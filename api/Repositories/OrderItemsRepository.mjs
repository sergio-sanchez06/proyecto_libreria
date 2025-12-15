import OrderItems from "../models/OrderItemsModel";
import pool from "../config/db";

async function createOrderItems(orderItems) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(
            "INSERT INTO order_items (order_id, book_id, quantity) VALUES ($1, $2, $3) RETURNING *",
            [orderItems.order_id, orderItems.book_id, orderItems.quantity]
        );
        await client.query("COMMIT");

        const order_id = new OrderItems(result.rows[0]);

        return order_id;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function getOrderItemsById(id) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query("SELECT * FROM order_items WHERE id = $1", [
            id,
        ]);
        await client.query("COMMIT");
        return new OrderItems(result.rows[0]);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function getOrdersItemsByUser(userId) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(
            "SELECT * FROM books WHERE user_id = $1",
            [userId]
        );
        await client.query("COMMIT");
        return result.rows.map((row) => new OrderItems(row));
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function updateOrderItems(orderItems) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(
            "UPDATE order_items SET order_id = $1, book_id = $2, quantity = $3 WHERE id = $4 RETURNING *",
            [orderItems.order_id, orderItems.book_id, orderItems.quantity, orderItems.id]
        );
        await client.query("COMMIT");
        return new OrderItems(result.rows[0]);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function deleteOrderItems(id) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query("DELETE FROM order_items where id = $1", [id]);
        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function getAllOrderItems() {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query("SELECT * FROM order_items");
        await client.query("COMMIT");
        return result.rows.map((row) => new OrderItems(row));
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
