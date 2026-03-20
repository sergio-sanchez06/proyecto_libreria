import Order from "../models/OrderModel.mjs";
import pool from "../config/database.mjs";
import OrderItemsRepository from "./OrderItemsRepository.mjs";
import BookRepository from "./BookRepository.mjs";

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
          `Stock insuficiente para "${book.title}". Disponible: ${book.stock}`
        );
      }
      total += book.price * item.quantity;
      validatedItems.push({ ...item, currentPrice: book.price });
    }

    const orderResult = await client.query(
      "INSERT INTO orders (user_id, total, status) VALUES ($1, $2, 'PENDIENTE') RETURNING *",
      [user_id, total]
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
        client
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
    [userId]
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
    [order.user_id, order.total, order.status, order.id]
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
    "SELECT * FROM orders ORDER BY created_at DESC"
  );
  return result.rows.map((row) => new Order(row));
}

async function getAllOrdersPag(page = null, limit = null) {
  const client = await pool.connect();
  try {
    let query = "SELECT * FROM orders ORDER BY name ASC ";
    let params = [];

    if (page !== null && limit !== null) {
      const p = Math.max(1, parseInt(page));
      const l = parseInt(limit);
      const offset = (p - 1) * l;

      query += "LIMIT $1 OFFSET $2";
      params = [l, offset];
    }

    const result = await client.query(query, params);
    
    const authors = result.rows; 

    if (page !== null) {
      const countRes = await client.query("SELECT COUNT(*) FROM orders");
      const totalItems = parseInt(countRes.rows[0].count);
      
      return {
        data: authors,
        totalItems,
        totalPages: Math.ceil(totalItems / (limit || 4)),
        currentPage: parseInt(page)
      };
    }
    return authors;
  } catch (error) {
    console.error("Error en OrderRepository:", error);
    throw error;
  } finally {
    client.release();
  }
}

export default {
  createOrder,
  getOrderById,
  getOrdersByUser,
  updateOrder,
  deleteOrder,
  getAllOrders,
  getAllOrdersPag
};
