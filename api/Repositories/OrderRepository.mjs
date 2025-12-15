import Order from "../models/OrderModel";
import pool from "../config/db";

async function createOrder(order) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO books (user_id, total, status) VALUES ($1, $2, $3) RETURNING *",
      [order.user_id, order.total, order.status]
    );
    await client.query("COMMIT");

    const order_id = new Order(result.rows[0]);

    return order_id;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getOrderById(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM books WHERE id = $1", [
      id,
    ]);
    await client.query("COMMIT");
    return new Order(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getOrdersByUser(userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "SELECT * FROM books WHERE user_id = $1",
      [userId]
    );
    await client.query("COMMIT");
    return result.rows.map((row) => new Order(row));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function updateOrder(order) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "UPDATE books SET user_id = $1, total = $2, status = $3 WHERE id = $4 RETURNING *",
      [order.user_id, order.total, order.status, order.id]
    );
    await client.query("COMMIT");
    return new Order(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function deleteOrder(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM orders where id = $1", [id]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getAllOrders() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM orders");
    await client.query("COMMIT");
    return result.rows.map((row) => new Order(row));
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
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
};
