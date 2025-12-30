import pool from "../config/database.mjs";
import OrderItem from "../models/OrderItemModel.mjs"; // crea el modelo si no existe

async function create(orderItemData) {
  const result = await pool.query(
    "INSERT INTO order_items (order_id, book_id, quantity, price) VALUES ($1, $2, $3, $4) RETURNING *",
    [
      orderItemData.order_id,
      orderItemData.book_id,
      orderItemData.quantity,
      orderItemData.price,
    ]
  );
  return result.rows[0] ? new OrderItem(result.rows[0]) : null;
}

async function getById(id) {
  const result = await pool.query("SELECT * FROM order_items WHERE id = $1", [
    id,
  ]);
  return result.rows[0] ? new OrderItem(result.rows[0]) : null;
}

async function getAll() {
  const result = await pool.query("SELECT * FROM order_items");
  return result.rows.map((row) => new OrderItem(row));
}

async function update(updateData) {
  const fields = [];
  const values = [];
  let index = 1;

  const allowedFields = ["order_id", "book_id", "quantity", "price"];

  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = $${index}`);
      values.push(value);
      index++;
    }
  }

  if (fields.length === 0) {
    throw new Error("No hay datos para actualizar");
  }

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
  const result = await pool.query(
    "DELETE FROM order_items WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rowCount > 0;
}

export default {
  create,
  getById,
  getAll,
  update,
  deleteItem,
};
