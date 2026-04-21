import Order from "../models/OrderModel.mjs";
import pool from "../config/database.mjs";
import OrderItemsRepository from "./OrderItemsRepository.mjs";
import BookRepository from "./BookRepository.mjs";

async function createOrder({ user_id, items, shipping_address }) {
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

      // Ponemos Number() para evitar errores de tipo por si postgre devuelve string

      total += Number(book.price) * item.quantity;
      validatedItems.push({ ...item, currentPrice: book.price });
    }

    const orderResult = await client.query(
      "INSERT INTO orders (user_id, total, status, shipping_address) VALUES ($1, $2, 'PENDIENTE', $3) RETURNING *",
      [user_id, total, shipping_address],
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

export default {
  createOrder,
  getOrderById,
  getOrdersByUser,
  updateOrder,
  deleteOrder,
  getAllOrders,
};
