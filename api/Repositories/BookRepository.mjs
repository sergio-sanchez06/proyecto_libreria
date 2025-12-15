import Book from "../models/BookModel";
import pool from "../config/db";

async function createBook(book) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO books (title, isbn, price, stock, releashed_year, format, language, pages, synopsis, cover_url, publisher_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *",
      [
        book.title,
        book.isbn,
        book.price,
        book.stock,
        book.releashed_year,
        book.format,
        book.language,
        book.pages,
        book.synopsis,
        book.cover_url,
        book.publisher_id,
      ]
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

async function getBookById(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM books WHERE id = $1", [
      id,
    ]);
    await client.query("COMMIT");
    return new Book(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getBookByTitle(title) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM books WHERE title = $1", [
      title,
    ]);
    await client.query("COMMIT");
    return new Book(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function updateBook(book) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "UPDATE books SET title = $1, isbn = $2, price = $3, stock = $4, releashed_year = $5, format = $6, language = $7, pages = $8, synopsis = $9, cover_url = $10, publisher_id = $11 WHERE id = $12 RETURNING *",
      [
        book.title,
        book.isbn,
        book.price,
        book.stock,
        book.releashed_year,
        book.format,
        book.language,
        book.pages,
        book.synopsis,
        book.cover_url,
        book.publisher_id,
        book.id,
      ]
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

async function deleteBook(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM books where id = $1", [id]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getAllBooks() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM books");
    await client.query("COMMIT");
    return result.rows.map((book) => new Book(book));
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    throw error;
  } finally {
    client.release();
  }
}

export default {
  createBook,
  getBookById,
  getBookByTitle,
  updateBook,
  deleteBook,
  getAllBooks,
};
