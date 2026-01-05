import Order from "../models/OrderModel.mjs";
import pool from "../config/database.mjs";
import OrderItemsRepository from "./OrderItemsRepository.mjs"; // Importar para introducir los nuevos libros en el pedido
import BookRepository from "./BookRepository.mjs"; // Para el stock y precios

async function createOrder({ user_id, items }) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN"); // Iniciamos la transacción única

    if (!items || items.length === 0) {
      throw new Error("El carrito está vacío");
    }

    // 1. Obtener información de libros y validar stock
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
      validatedItems.push({ ...item, currentPrice: book.price });
    }

    // 2. Crear cabecera (Tabla orders)
    const orderResult = await client.query(
      "INSERT INTO orders (user_id, total, status) VALUES ($1, $2, 'PENDIENTE') RETURNING *",
      [user_id, total]
    );
    const order = new Order(orderResult.rows[0]);

    // 3. Delegar inserción de items y actualización de stock
    for (const item of validatedItems) {
      // Llamada al repositorio de items compartiendo el cliente
      await OrderItemsRepository.create(
        {
          order_id: order.id,
          book_id: item.book_id,
          quantity: item.quantity,
          price_at_time: item.currentPrice,
        },
        client
      );

      // Llamada al repositorio de libros para descontar stock
      await BookRepository.updateStock(item.book_id, item.quantity, client);
    }

    await client.query("COMMIT"); // Confirmamos todos los cambios
    return order;
  } catch (error) {
    await client.query("ROLLBACK"); // Si algo falla, se deshace todo (pedido, items y stock)
    throw error;
  } finally {
    client.release(); // Siempre liberamos la conexión al pool
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
