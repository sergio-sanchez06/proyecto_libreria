import pool from "../config/database.mjs";
import BookGenre from "../models/BookGenreModel.mjs";

async function createBookGenre(bookGenre) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO book_genres (book_id, genre_id) VALUES ($1, $2) RETURNING *",
      [bookGenre.book_id, bookGenre.genre_id]
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

async function getBookGenreById(book_id, genre_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM book_genres WHERE book_id = $1 AND genre_id = $2",
      [book_id]
    );
    return new BookGenreModel(result.rows[0]);
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

async function getBookGenresByBook(id) {
  const client = await pool.connect();
  try {
    console.log(id);

    const result = await client.query(
      `SELECT 
                bg.book_id, bg.genre_id,
                b.title,
                g.name
            FROM book_genres bg
            INNER JOIN books b ON bg.book_id = b.id
            INNER JOIN genres g ON bg.genre_id = g.id
            WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      console.log("No se encontraron géneros para el libro especificado");
    }

    return result.rows.map(
      (row) =>
        new BookGenre({
          book_id: row.book_id,
          genre_id: row.genre_id,
          book: {
            title: row.title,
            id: row.book_id,
          },
          genre: {
            name: row.name,
            id: row.genre_id,
          },
        })
    );
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

async function getBookGenresByGenre(genreName) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT 
        bg.book_id, bg.genre_id,
        b.title AS book_title,
        b.id AS book_id,
        b.cover_url,
        g.name AS genre_name,
        g.id AS genre_id
      FROM public.book_genres bg
      INNER JOIN public.books b ON bg.book_id = b.id
      INNER JOIN public.genres g ON bg.genre_id = g.id
      WHERE g.name ILIKE $1`,
      [`%${genreName}%`]
    );

    if (result.rows.length === 0) {
      console.log("No se encontraron libros con el género especificado");
    }

    return result.rows.map(
      (row) =>
        new BookGenre({
          book_id: row.book_id,
          genre_id: row.genre_id,
          book: {
            title: row.book_title,
            id: row.book_id,
            cover_url: row.cover_url,
          },
          genre: {
            name: row.genre_name,
            id: row.genre_id,
          },
        })
    );
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

async function updateBookGenre(bookGenre) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "UPDATE book_genres SET book_id = $1, genre_id = $2 WHERE id = $3 AND book_id = $4 AND genre_id = $5 RETURNING *",
      [
        bookGenre.book_id,
        bookGenre.genre_id,
        bookGenre.book_id,
        bookGenre.genre_id,
      ]
    );
    await client.query("COMMIT");
    return new BookGenreModel(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function deleteByBookId(book_id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM book_genres WHERE book_id = $1", [book_id]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function deleteBookGenre(book_id, genre_id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM book_genres WHERE book_id = $1 AND genre_id = $2",
      [book_id, genre_id]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export default {
  createBookGenre,
  getBookGenreById,
  getBookGenresByBook,
  getBookGenresByGenre,
  updateBookGenre,
  deleteBookGenre,
  deleteByBookId,
};
