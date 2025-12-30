import Order from "../models/OrderModel.mjs";
import pool from "../config/database.mjs";

async function createOrder({ user_id, items }) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (!items || items.length === 0) {
      throw new Error("El carrito está vacío");
    }

    // Obtener libros para validar stock y calcular total
    const bookIds = items.map((item) => item.book_id);
    const booksResult = await client.query(
      "SELECT id, title, price, stock FROM books WHERE id = ANY($1)",
      [bookIds]
    );
    const books = booksResult.rows;

    let total = 0;
    for (const item of items) {
      const book = books.find((b) => b.id == item.book_id);
      if (!book) {
        throw new Error(`Libro no encontrado: ${item.book_id}`);
      }
      if (book.stock < item.quantity) {
        throw new Error(`Stock insuficiente para ${book.title}`);
      }
      total += book.price * item.quantity;
    }

    // Crear pedido principal (tabla orders, no books!)
    const orderResult = await client.query(
      "INSERT INTO orders (user_id, total, status) VALUES ($1, $2, 'pendiente') RETURNING *",
      [user_id, total]
    );
    const order = new Order(orderResult.rows[0]);

    // Crear items del pedido
    for (const item of items) {
      const book = books.find((b) => b.id == item.book_id);
      await client.query(
        "INSERT INTO order_items (order_id, book_id, quantity, price) VALUES ($1, $2, $3, $4)",
        [order.id, item.book_id, item.quantity, book.price]
      );

      // Actualizar stock
      await client.query("UPDATE books SET stock = stock - $1 WHERE id = $2", [
        item.quantity,
        item.book_id,
      ]);
    }

    await client.query("COMMIT");
    return order;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// getOrderById (corregido: tabla orders, no books)
async function getOrderById(id) {
  const result = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);
  return result.rows[0] ? new Order(result.rows[0]) : null;
}

// getOrdersByUser (corregido: tabla orders, no books)
async function getOrdersByUser(userId) {
  const result = await pool.query(
    "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  return result.rows.map((row) => new Order(row));
}

// updateOrder (corregido: tabla orders)
async function updateOrder(order) {
  const result = await pool.query(
    `UPDATE orders 
     SET 
       user_id = COALESCE($1, user_id),
       total = COALESCE($2, total),
       status = COALESCE($3, status),
       updated_at = NOW()
     WHERE id = $4 
     RETURNING *`,
    [order.user_id, order.total, order.status, order.id]
  );
  return result.rows[0] ? new Order(result.rows[0]) : null;
}

// deleteOrder
async function deleteOrder(id) {
  await pool.query("DELETE FROM orders WHERE id = $1", [id]);
}

// getAllOrders
async function getAllOrders() {
  const result = await pool.query(
    "SELECT * FROM orders ORDER BY created_at DESC"
  );
  return result.rows.map((row) => new Order(row));
}

export default {
  createOrder,
  getOrderById,
  getOrdersByUser,
  updateOrder,
  deleteOrder,
  getAllOrders,
};
