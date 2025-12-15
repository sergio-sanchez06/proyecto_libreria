import pool from "../config/database";
import authorModel from "../models/authorModel";

async function createAuthor(author) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO authors (name, country, photo_url) VALUES ($1, $2, $3) RETURNING *",
      [author.name, author.country, author.photo_url]
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

async function getAuthorById(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM authors WHERE id = $1", [
      id,
    ]);
    await client.query("COMMIT");
    return new authorModel(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getAuthorByName(name) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM authors WHERE name = $1", [
      name,
    ]);
    await client.query("COMMIT");
    return new authorModel(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function updateAuthor(author) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "UPDATE authors SET name = $1, country = $2, photo_url = $3 WHERE id = $4 RETURNING *",
      [author.name, author.country, author.photo_url, author.id]
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

async function deleteAuthor(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "DELETE FROM authors WHERE id = $1 RETURNING *",
      [id]
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

async function getAllAuthors() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM authors");
    await client.query("COMMIT");
    return result.rows.map((author) => new authorModel(author));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export default {
  createAuthor,
  getAuthorById,
  getAuthorByName,
  updateAuthor,
  deleteAuthor,
  getAllAuthors,
};
