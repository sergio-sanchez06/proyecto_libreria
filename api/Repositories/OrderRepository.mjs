import Order from "../models/OrderModel.mjs";
import pool from "../config/database.mjs";
import OrderItemsRepository from "./OrderItemsRepository.mjs";
import BookRepository from "./BookRepository.mjs";
import emailService from "../services/emailService.mjs";
import Stripe from "stripe";

async function createOrder({
  user_id,
  items,
  shipping_address,
  status = "PENDIENTE",
  stripe_payment_intent = null,
}) {
  const client = await pool.connect(); // Aquí SÍ usamos client para la transacción

  try {
    await client.query("BEGIN");

    if (!items || items.length === 0) throw new Error("El carrito está vacío");

    const bookIds = items.map((item) => item.book_id);

    // Se pone true para bloquear las filas hasta que haga commit
    // Evita que otro usuario compre el mismo libro al mismo tiempo
    // Tambien pasamos la conexión actual para que todo se haga en la misma transacción
    const books = await BookRepository.getBooksByIds(bookIds, client, true);

    let total = 0;
    const validatedItems = [];

    for (const item of items) {
      const book = books.find((b) => b.id == item.book_id);
      if (!book) throw new Error(`Libro no encontrado: ID ${item.book_id}`);
      if (book.stock < item.quantity) {
        throw new Error(
          `Stock insuficiente para "${book.title}". Disponible: ${book.stock}`,
        );
      }

      // Priorizamos el precio que viene del objeto (Stripe) o el de la DB

      const priceToUse = item.price_at_time || book.price;

      // Ponemos Number() para evitar errores de tipo por si postgre devuelve string

      total += Number(priceToUse) * item.quantity;
      validatedItems.push({ ...item, currentPrice: priceToUse });
    }

    const orderResult = await client.query(
      "INSERT INTO orders (user_id, total, status, shipping_address, stripe_payment_intent) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [user_id, total, status, shipping_address, stripe_payment_intent],
    );
    const order = new Order(orderResult.rows[0]);

    for (const item of validatedItems) {
      // Pasamos 'client' para que todo sea parte de la misma transacción
      await OrderItemsRepository.create(
        {
          order_id: order.id,
          book_id: item.book_id,
          quantity: item.quantity,
          price_at_time: item.currentPrice,
        },
        client,
      );
      await BookRepository.updateStock(item.book_id, item.quantity, client);
    }

    await client.query("COMMIT");
    // return order;

    return {
      ...order,
      items: validatedItems.map((item) => {
        const bookInfo = books.find((b) => b.id == item.book_id);
        return {
          title: bookInfo.title, // <--- Esto es lo que necesita el email
          quantity: item.quantity,
          price: item.currentPrice,
          cover_url: bookInfo.cover_url,
        };
      }),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release(); // Correcto: se libera lo que se abrió con pool.connect()
  }
}

async function getOrderById(id) {
  // pool.query ya gestiona la conexión, no hace falta client ni finally
  const result = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);
  return result.rows[0] ? new Order(result.rows[0]) : null;
}

async function getOrdersByUser(userId) {
  const result = await pool.query(
    "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );
  return result.rows.map((row) => new Order(row));
}

async function updateOrder(order) {
  const client = await pool.connect();

  let user_email = null;
  let user_name = null;

  let items = []

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT o.status, o.stripe_payment_intent, u.email, u.name 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       WHERE o.id = $1 FOR UPDATE`,
      [order.id],
    );

    if (!rows[0]) throw new Error("Pedido no encontrado");

    user_email = rows[0].email;
    user_name = rows[0].name;

    items = await OrderItemsRepository.getItemsByOrderId(order.id, client);

    const result = await client.query(
      `UPDATE orders 
     SET status = COALESCE($1, status),
         updated_at = NOW()
     WHERE id = $2 
     RETURNING *`,
      [order.status, order.id],
    );

    await client.query("COMMIT");

    return {
      user_email,
      user_name,
      items
    };

    // return result.rows[0] ? new Order(result.rows[0]) : null;
  } catch (error) {
    await client.query("ROLLBACK");

    console.log("Error update order: ", error)

    throw error;
  } finally {
    client.release();
  }
}
// async function updateOrder(order) {

//   try{

//     const client = await pool.connect();

//     await client.query("BEGIN");

//     const result = await client.query(
//     `UPDATE orders
//      SET status = COALESCE($1, status),
//          updated_at = NOW()
//      WHERE id = $2
//      RETURNING *`,
//     [order.status, order.id],
//   );
//   return result.rows[0] ? new Order(result.rows[0]) : null;

//   }catch(error){

//   }

//   const result = await pool.query(
//     `UPDATE orders
//      SET user_id = COALESCE($1, user_id),
//          total = COALESCE($2, total),
//          status = COALESCE($3, status),
//          updated_at = NOW()
//      WHERE id = $4
//      RETURNING *`,
//     [order.user_id, order.total, order.status, order.id],
//   );
//   return result.rows[0] ? new Order(result.rows[0]) : null;
// }

async function deleteOrder(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // OJO: Aquí antes usabas pool.query dentro de una transacción de client.
    // Debe ser client.query para que el DELETE se vea afectado por el COMMIT/ROLLBACK.
    await client.query("DELETE FROM orders WHERE id = $1", [id]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getAllOrders() {
  const result = await pool.query(
    "SELECT o.*, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id ORDER BY created_at DESC",
  );

  const orders = result.rows.map((row) => {
    const order = new Order(row);
    order.user_email = row.user_email;
    return order;
  });

  return orders;
}

async function cancelOrder(id) {
  const client = await pool.connect();

  let stripePaymentIntent = null;

  let items = [];

  let user_email = null;
  let user_name = null;

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT o.status, o.stripe_payment_intent, u.email AS user_email, u.name AS user_name
   FROM orders o
   JOIN users u ON o.user_id = u.id
   WHERE o.id = $1 FOR UPDATE`,
      [id],
    );

    if (!rows[0]) throw new Error("Pedido no encontrado");
    if (rows[0].status === "CANCELADO")
      throw new Error("El pedido ya fue cancelado previamente");
    // if (!admin && ["ENVIADO", "ENTREGADO"].includes(rows[0].status))
    //   throw new Error(
    //     `No se puede cancelar un pedido en estado ${rows[0].status}`,
    //   );

    

    stripePaymentIntent = rows[0].stripe_payment_intent;
    user_email = rows[0].user_email;
    user_name = rows[0].user_name;

    //Obtenemos los libros de los pedidos, pasando la conexión actual
    // para que todo se haga en la misma transacción
    items = await OrderItemsRepository.getItemsByOrderId(id, client);

    console.log("Items asociados al pedido: ", items);

    for (const item of items) {
      await BookRepository.restoreStock(item.book_id, item.quantity, client);
    }

    await client.query(
      "UPDATE orders SET status = 'CANCELADO', updated_at = NOW() WHERE id = $1",
      [id],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    throw error;
  } finally {
    client.release();
  }

  // Reembolso fuera de la transacción SQL — si Stripe falla, el pedido
  // ya está cancelado y el stock restaurado. Se puede reintentar desde
  // el dashboard de Stripe con el payment_intent_id guardado en la DB.
  if (stripePaymentIntent) {
    console.log("Reembolsando pedido", stripePaymentIntent);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    try {
      await stripe.refunds.create({
        payment_intent: stripePaymentIntent,
        reason: "requested_by_customer",
      });
    } catch (stripeError) {
      // No relanzamos — la cancelación fue exitosa, solo el reembolso falló
      console.error(
        "Reembolso Stripe fallido — reembolsar manualmente:",
        stripeError.message,
      );
    }
  }

  return { items, refunded: !!stripePaymentIntent, user_email, user_name };
}

// async function payment(items, user, shipping_address) {
//   console.log(user);
//   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
//   const bookIds = items.map((item) => item.book_id);
//   const books = await BookRepository.getBooksByIds(bookIds);
//   let total = 0;
//   const validatedItems = [];

//   for (const item of items) {
//     const book = books.find((b) => b.id == item.book_id);

//     if (!book) throw new Error(`Libro no encontrado: ID ${item.book_id}`);
//     if (book.stock < item.quantity) {
//       throw new Error(
//         `Stock insuficiente para "${book.title}". Disponible: ${book.stock}`,
//       );
//     }

//     total += book.price * item.quantity;
//     // Guardamos el precio actual para asegurar la consistencia en el detalle
//     validatedItems.push({
//       ...item,
//       currentPrice: book.price,
//       title: book.title,
//     });
//   }
//   const arrayStripeObjects = [];
//   validatedItems.forEach((books) => {
//     const lineItems = {
//       price_data: {
//         currency: "eur",
//         product_data: {
//           name: books.title,
//         },
//         unit_amount: (books.currentPrice * 100).toFixed(0),
//       },
//       quantity: books.quantity,
//     };
//     arrayStripeObjects.push(lineItems);
//   });

//   const session = await stripe.checkout.sessions.create({
//     customer_email: user.email,
//     line_items: arrayStripeObjects,
//     mode: "payment",
//     success_url: `${process.env.FRONTEND_URL}/user/myOrders?success=true&session_id={CHECKOUT_SESSION_ID}`,
//     cancel_url: `${process.env.FRONTEND_URL}/cart/view`, // <-- AÑADIR ESTO
//   });

//   emailService.sendOrderConfirmationEmail(
//     user.email,
//     user.name,
//     shipping_address,
//     validatedItems,
//     total,
//   );
//   const client = await pool.connect();
//   await client.query("BEGIN");
//   const orderResult = await client.query(
//     "UPDATE orders SET status = $1 WHERE user_id = $2 AND created_at >= NOW() - INTERVAL '1 minute';",
//     ["PAGADO", user.id],
//   );
//   await client.query("COMMIT");

//   return session;
// }

async function payment(items, user, shipping_address) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  // ... lógica de validación de stock y precios que ya tienes ...

  const bookIds = items.map((item) => item.book_id);
  const books = await BookRepository.getBooksByIds(bookIds);
  let total = 0;
  const validatedItems = [];

  for (const item of items) {
    const book = books.find((b) => b.id == item.book_id);

    if (!book) throw new Error(`Libro no encontrado: ID ${item.book_id}`);
    if (book.stock < item.quantity) {
      throw new Error(
        `Stock insuficiente para "${book.title}". Disponible: ${book.stock}`,
      );
    }

    total += book.price * item.quantity;
    // Guardamos el precio actual para asegurar la consistencia en el detalle
    validatedItems.push({
      ...item,
      currentPrice: book.price,
      title: book.title,
      cover_url: book.cover_url,
    });
  }
  const arrayStripeObjects = [];
  validatedItems.forEach((books) => {
    const lineItems = {
      price_data: {
        currency: "eur",
        product_data: {
          name: books.title,
        },
        unit_amount: (books.currentPrice * 100).toFixed(0),
      },
      quantity: books.quantity,
    };
    arrayStripeObjects.push(lineItems);
  });

  const itemsForMetadata = validatedItems.map((item) => ({
    book_id: item.book_id,
    quantity: item.quantity,
    price_at_time: item.currentPrice, // Guardamos el precio validado aquí
    cover_url: item.cover_url,
  }));

  // 1. Crear sesión de Stripe
  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    line_items: arrayStripeObjects,
    mode: "payment",
    // Pasamos metadatos para recuperarlos en la confirmación
    metadata: {
      user_id: user.id,
      user_name: user.name,
      shipping_address: shipping_address,
      items: JSON.stringify(itemsForMetadata),
    },
    success_url: `${process.env.FRONTEND_URL}/user/myOrders?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/cart/view`,
  });

  // NO actualices la DB aquí ni envíes el email todavía.
  return session;
}

async function confirmStripeSession(session_id) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.retrieve(session_id);

  if (session.payment_status === "paid") {
    const { user_id, user_name, shipping_address, items } = session.metadata;
    const user_email = session.customer_details.email;
    const parsedItems = JSON.parse(items);

    try {
      const newOrder = await createOrder({
        user_id: parseInt(user_id),
        items: parsedItems,
        shipping_address: shipping_address,
        status: "PAGADO",
        stripe_payment_intent: session.payment_intent,
      });

      console.log("Lo que metemos en el nuevo pedido : ", newOrder);

      // emailService.sendOrderConfirmationEmail(
      //   user_email,
      //   user_name,
      //   shipping_address,
      //   newOrder.items,
      //   session.amount_total / 100,
      // ).catch((err) => {
      //   console.error("Error enviando email de confirmación de pedido:", err.message);
      // });
      return { ...newOrder, user_email, user_name, shipping_address }; // Ahora sí, el pedido existe y está pagado
    } catch (error) {
      console.log(
        "Confirmar Sesión stripe repo (dentro del try/catch) error",
        error,
      );
      throw error;
    }
  }
  return null;
}
// async function confirmStripeSession(session_id) {
//   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
//   const session = await stripe.checkout.sessions.retrieve(session_id);

//   if (session.payment_status === "paid") {
//     const { user_id, user_name, shipping_address, items } = session.metadata;
//     const user_email = session.customer_details.email;
//     const parsedItems = JSON.parse(items);

//     const client = await pool.connect();
//     try {
//       await client.query("BEGIN");

//       // 1. Aquí haces el INSERT (Antes no existía el pedido)
//       const orderResult = await client.query(
//         `INSERT INTO orders (user_id, shipping_address, status, total)
//        VALUES ($1, $2, 'PAGADO', $3) RETURNING *`,
//         [user_id, shipping_address, session.amount_total / 100],
//       );

//       const newOrder = orderResult.rows[0];

//       // 2. Insertamos los items
//       for (const item of parsedItems) {
//         // Pasamos 'client' para que todo sea parte de la misma transacción
//         await OrderItemsRepository.create(
//           {
//             order_id: newOrder.id,
//             book_id: item.book_id,
//             quantity: item.quantity,
//             price_at_time: item.price_at_time,
//           },
//           client,
//         );
//         await BookRepository.updateStock(item.book_id, item.quantity, client);
//       }
//       await client.query("COMMIT");

//       emailService.sendOrderConfirmationEmail(
//         user_email,
//         user_name,
//         shipping_address,
//         parsedItems,
//         session.amount_total / 100,
//       );
//       return newOrder; // Ahora sí, el pedido existe y está pagado
//     } catch (error) {
//       console.log(
//         "Confirmar Sesión stripe repo (dentro del try/catch) error",
//         error,
//       );
//       await client.query("ROLLBACK");
//       throw error;
//     } finally {
//       console.log(
//         "Confirmar Sesión stripe repo (dentro del finally) saliendo del try/catch",
//       );
//       client.release();
//     }
//   }
//   return null;
// }

async function confirmReturn(id, forceReturn = false) {
  const client = await pool.connect();
  let stripePaymentIntent = null;
  let items = [];
  let user_email, user_name;

  try {
    await client.query("BEGIN");

    // 1. Bloqueamos y obtenemos info del pedido
    const { rows } = await client.query(
      `SELECT o.status, o.stripe_payment_intent, u.email, u.name 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       WHERE o.id = $1 FOR UPDATE`,
      [id],
    );

    if (!rows[0]) throw new Error("Pedido no encontrado");

    const allowedStatuses = forceReturn
      ? ["PAGADO", "PROCESANDO", "ENVIADO", "ENTREGADO", "DEVOLUCION_PENDIENTE"]
      : ["DEVOLUCION_PENDIENTE"];

    if (!allowedStatuses.includes(rows[0].status)) {
      throw new Error(
        forceReturn
          ? `No se puede forzar devolución en estado ${rows[0].status}`
          : "El pedido no está en espera de devolución",
      );
    }

    stripePaymentIntent = rows[0].stripe_payment_intent;
    user_email = rows[0].email;
    user_name = rows[0].name;

    // 2. Recuperamos los items y restauramos stock
    items = await OrderItemsRepository.getItemsByOrderId(id, client);
    for (const item of items) {
      await BookRepository.restoreStock(item.book_id, item.quantity, client);
    }

    // 3. Cambiamos el estado a 'DEVUELTO' (más preciso que 'CANCELADO' para el TFG)
    await client.query(
      "UPDATE orders SET status = 'DEVUELTO', updated_at = NOW() WHERE id = $1",
      [id],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  // 4. Reembolso en Stripe (fuera de la transacción SQL)
  if (stripePaymentIntent) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    try {
      await stripe.refunds.create({ payment_intent: stripePaymentIntent });
    } catch (err) {
      console.error("Error en reembolso Stripe:", err.message);
      // En TFG, con el log basta, o podrías marcar un flag de 'reembolso_pendiente'
    }
  }

  return { items, user_email, user_name };
}

async function rejectReturn(id) {
  const client = await pool.connect();
  let items = [];
  let user_email, user_name;

  try {
    await client.query("BEGIN");

    // 1. Bloqueamos y obtenemos info del pedido
    const { rows } = await client.query(
      `SELECT o.status, o.stripe_payment_intent, u.email, u.name 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       WHERE o.id = $1 FOR UPDATE`,
      [id],
    );

    if (!rows[0]) throw new Error("Pedido no encontrado");

    if (rows[0].status !== "DEVOLUCION_PENDIENTE") {
      throw new Error(
        `No se puede rechazar la devolución en estado ${rows[0].status}`,
      );
    }

    items = await OrderItemsRepository.getItemsByOrderId(id, client);

    user_email = rows[0].email;
    user_name = rows[0].name;

    // 3. Cambiamos el estado a 'DEVUELTO' (más preciso que 'CANCELADO' para el TFG)
    await client.query(
      "UPDATE orders SET status = 'DEVOLUCION_RECHAZADA', updated_at = NOW() WHERE id = $1",
      [id],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return { user_email, user_name, items };
}

export default {
  createOrder,
  getOrderById,
  getOrdersByUser,
  updateOrder,
  deleteOrder,
  getAllOrders,
  cancelOrder,
  payment,
  confirmStripeSession,
  confirmReturn,
  rejectReturn,
};
