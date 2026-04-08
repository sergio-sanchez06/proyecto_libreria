import Order from "../models/OrderModel.mjs";
import pool from "../config/database.mjs";
import OrderItemsRepository from "./OrderItemsRepository.mjs";
import BookRepository from "./BookRepository.mjs";
import nodemailer from "nodemailer"
import stripe, { Stripe } from "stripe"

async function createOrder({ user_id, items }) {
  const client = await pool.connect(); // Aquí SÍ usamos client para la transacción

  try {
    await client.query("BEGIN");

    if (!items || items.length === 0) throw new Error("El carrito está vacío");

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
      validatedItems.push({ ...item, currentPrice: book.price });
    }

    const orderResult = await client.query(
      "INSERT INTO orders (user_id, total, status) VALUES ($1, $2, 'PENDIENTE') RETURNING *",
      [user_id, total],
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
    return order;
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
  const result = await pool.query(
    `UPDATE orders 
     SET user_id = COALESCE($1, user_id),
         total = COALESCE($2, total),
         status = COALESCE($3, status),
         updated_at = NOW()
     WHERE id = $4 
     RETURNING *`,
    [order.user_id, order.total, order.status, order.id],
  );
  return result.rows[0] ? new Order(result.rows[0]) : null;
}

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


async function payment(items,user){
  console.log(user)
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const bookIds = items.map((item) => item.book_id);
  const books = await BookRepository.getBooksByIds(bookIds);
  let total = 0;
  const validatedItems = [];

    for (const item of items) {
      const book = books.find((b) => b.id == item.book_id);

      if (!book) throw new Error(`Libro no encontrado: ID ${item.book_id}`);
      if (book.stock < item.quantity) {
        throw new Error(
          `Stock insuficiente para "${book.title}". Disponible: ${book.stock}`
        );
      }

      total += book.price * item.quantity;
      // Guardamos el precio actual para asegurar la consistencia en el detalle
      validatedItems.push({ ...item, currentPrice: book.price, title: book.title});
    }
  const arrayStripeObjects = []
  validatedItems.forEach(books => {
    const lineItems = {
      price_data: {
        currency: 'eur',
        product_data: {
          name: books.title,
        },
        unit_amount: (books.currentPrice * 100).toFixed(0),
      },
      quantity: books.quantity,
    }
    arrayStripeObjects.push(lineItems)
  });
  
  const session = await stripe.checkout.sessions.create({
    line_items: arrayStripeObjects,
    mode: 'payment',
    success_url: 'http://localhost:3001/user/myOrders',
  })
  
  sendGmailTest(validatedItems,user,total)

  return session
}


async function sendGmailTest(validatedItems,user,total) {

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
      <h2 style="text-align: center; color: #333;">Recibo de Compra</h2>
      <p>Hola ${user.name},</p>
      <p>Gracias por tu compra. Aquí tienes el resumen de tu pedido:</p>

      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr>
            <th style="border-bottom: 1px solid #ddd; padding: 8px; text-align: left;">Producto</th>
            <th style="border-bottom: 1px solid #ddd; padding: 8px; text-align: center;">Cantidad</th>
            <th style="border-bottom: 1px solid #ddd; padding: 8px; text-align: right;">Precio</th>
          </tr>
        </thead>
        <tbody>
          ${validatedItems
            .map(
              products => `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${products.title}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${products.quantity}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${products.currentPrice}€</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 8px; text-align: right; font-weight: bold;">Total:</td>
            <td style="padding: 8px; text-align: right; font-weight: bold;">${total.toFixed(2)}€</td>
          </tr>
        </tfoot>
      </table>

      <p style="margin-top: 20px;">Fecha de compra: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>

      <p>Si tienes alguna duda, contáctanos a <a href="mailto:soporte@tudominio.com">soporte@tudominio.com</a>.</p>

      <p style="text-align: center; color: #888; font-size: 12px;">© ${new Date().getFullYear()} Tu Tienda. Todos los derechos reservados.</p>
    </div>
  `;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: "izanferlaf@gmail.com",
      clientId: process.env.CLIENT_ID,      
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN
    },
  });

  const mailOptions = {
    from: "izanferlaf@gmail.com",
    to: user.email, 
    subject: "Test Email from Nodemailer Gmail OAuth2",
    html: emailHtml,
  };

  const client = await pool.connect();
  await client.query("BEGIN");
  const orderResult = await client.query(
      "UPDATE orders SET status = $1 WHERE user_id = $2 AND created_at >= NOW() - INTERVAL '1 minute';",
      ["PAGADO", user.id]
    );
  await client.query("COMMIT");
  await transporter.sendMail(mailOptions);

}

export default {
  createOrder,
  getOrderById,
  getOrdersByUser,
  updateOrder,
  deleteOrder,
  getAllOrders,
  payment
};
