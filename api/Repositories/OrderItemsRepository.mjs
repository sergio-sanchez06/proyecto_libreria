// api/Repositories/OrderItemsRepository.mjs
import pool from "../config/database.mjs";
import OrderItem from "../models/OrderItems.mjs";

async function create(orderItemData, client) {
  // Aquí usamos el 'client' que viene de la transacción del OrderRepository
  const result = await client.query(
    "INSERT INTO order_items (order_id, book_id, quantity, price_at_time) VALUES ($1, $2, $3, $4) RETURNING *",
    [
      orderItemData.order_id,
      orderItemData.book_id,
      orderItemData.quantity,
      orderItemData.price_at_time,
    ]
  );
  return result.rows[0] ? new OrderItem(result.rows[0]) : null;
}

async function getItemsByOrderId(orderId) {
  // Al usar pool.query directamente, evitamos fugas de conexiones (memory leaks)
  try {
    const result = await pool.query(
      `SELECT 
        oi.*, 
        b.id AS book_id,
        b.title AS book_title 
      FROM order_items oi 
      JOIN books b ON oi.book_id = b.id 
      WHERE oi.order_id = $1`,
      [orderId]
    );

    return result.rows.map((row) => {
      const bookObj = {
        id: row.book_id,
        title: row.book_title,
      };

      return new OrderItem({
        id: row.id,
        order_id: row.order_id,
        book_id: row.book_id,
        quantity: row.quantity,
        price_at_time: row.price_at_time,
        created_at: row.created_at,
        update_at: row.update_at,
        book: bookObj,
      });
    });
  } catch (error) {
    console.error("Error obteniendo ítems del pedido:", error);
    throw error;
  }
  // ELIMINADO: client.release() ya no es necesario con pool.query
}

async function getById(id) {
  try {
    const result = await pool.query("SELECT * FROM order_items WHERE id = $1", [
      id,
    ]);
    return result.rows[0] ? new OrderItem(result.rows[0]) : null;
  } catch (error) {
    throw error;
  }
  // CORREGIDO: Eliminado el finally que causaba el error
}

async function getAll() {
  try {
    const result = await pool.query("SELECT * FROM order_items");
    return result.rows.map((row) => new OrderItem(row));
  } catch (error) {
    throw error;
  }
}

async function update(updateData) {
  const fields = [];
  const values = [];
  let index = 1;

  const allowedFields = ["order_id", "book_id", "quantity", "price_at_time"];

  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = $${index}`);
      values.push(value);
      index++;
    }
  }

  if (fields.length === 0) throw new Error("No hay datos para actualizar");

  values.push(updateData.id);

  const query = `
    UPDATE order_items 
    SET ${fields.join(", ")}, updated_at = NOW()
    WHERE id = $${index}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0] ? new OrderItem(result.rows[0]) : null;
}

async function deleteItem(id) {
  try {
    const result = await pool.query(
      "DELETE FROM order_items WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rowCount > 0;
  } catch (error) {
    throw error;
  }
}

export default {
  create,
  getById,
  getAll,
  update,
  getItemsByOrderId,
  deleteItem,
};
