import pool from "../config/database.mjs";
import BookAuthorModel from "../models/bookAuthorModel.mjs";

async function createBookAuthor(bookAuthor) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO book_author (book_id, author_id) VALUES ($1, $2) RETURNING *",
      [bookAuthor.book_id, bookAuthor.author_id]
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

async function getBookAuthorById(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "SELECT * FROM book_author WHERE id = $1",
      [id]
    );
    await client.query("COMMIT");
    return new BookAuthorModel(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function updateBookAuthor(bookAuthor) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "UPDATE book_author SET book_id = $1, author_id = $2 WHERE id = $3 RETURNING *",
      [bookAuthor.book_id, bookAuthor.author_id, bookAuthor.id]
    );
    await client.query("COMMIT");
    return new BookAuthorModel(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function deleteBookAuthor(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM book_author WHERE id = $1", [id]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export default {
  createBookAuthor,
  getBookAuthorById,
  updateBookAuthor,
  deleteBookAuthor,
};
