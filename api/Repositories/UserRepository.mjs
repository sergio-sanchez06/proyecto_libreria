import UserModel from "../models/UserModel.mjs";
import pool from "../config/database.mjs";

async function createUser(user) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [user.name, user.email, user.password, user.role]
    );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getUserById(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    await client.query("COMMIT");
    return new UserModel(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getUserByEmail(email) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    await client.query("COMMIT");
    return new UserModel(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function updateUser(user) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE users 
       SET 
         name = COALESCE($1, name),
         email = COALESCE($2, email),
         password = COALESCE($3, password),
         role = COALESCE($4, role),
         updated_at = NOW()
       WHERE id = $5 
       RETURNING *`,
      [user.name, user.email, user.password, user.role, user.id]
    );
    await client.query("COMMIT");
    return new UserModel(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function deleteUser(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM users WHERE id = $1", [id]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getAllUsers() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM users");
    await client.query("COMMIT");
    return result.rows.map((row) => new UserModel(row));
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    throw error;
  } finally {
    client.release();
  }
}

export default {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
  getAllUsers,
};
