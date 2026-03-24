import pool from "../config/database.mjs";
import BookGenre from "../models/BookGenreModel.mjs";

/**
 * Crea una asociación individual.
 * Soporta transacciones externas (útil para createBook).
 */
async function createBookGenre(bookGenre, externalClient = null) {
  const client = externalClient || (await pool.connect());
  try {
    if (!externalClient) await client.query("BEGIN");

    const result = await client.query(
      "INSERT INTO book_genres (book_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *",
      [bookGenre.book_id, bookGenre.genre_id],
    );

    if (!externalClient) await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    if (!externalClient) await client.query("ROLLBACK");
    throw error;
  } finally {
    if (!externalClient) client.release();
  }
}

/**
 * SINCRONIZACIÓN: Borra todos los géneros de un libro y añade los nuevos.
 * Este es el método que llamarás desde BookRepository.updateBook.
 */
async function syncBookGenres(bookId, genreIds, externalClient = null) {
  const client = externalClient || (await pool.connect());
  try {
    if (!externalClient) await client.query("BEGIN");

    // 1. Limpiamos la "pizarra"
    await client.query("DELETE FROM book_genres WHERE book_id = $1", [bookId]);

    // 2. Insertamos los nuevos IDs
    if (genreIds && genreIds.length > 0) {
      for (const genreId of genreIds) {
        await client.query(
          "INSERT INTO book_genres (book_id, genre_id) VALUES ($1, $2)",
          [bookId, genreId],
        );
      }
    }

    if (!externalClient) await client.query("COMMIT");
  } catch (error) {
    if (!externalClient) await client.query("ROLLBACK");
    throw error;
  } finally {
    if (!externalClient) client.release();
  }
}

async function getBookGenreById(book_id, genre_id) {
  try {
    const result = await pool.query(
      "SELECT * FROM book_genres WHERE book_id = $1 AND genre_id = $2",
      [book_id, genre_id],
    );
    return result.rows[0] ? new BookGenre(result.rows[0]) : null;
  } catch (error) {
    console.error("Error en getBookGenreById:", error);
    throw error;
  }
}

async function getBookGenresByBook(id) {
  try {
    const result = await pool.query(
      `SELECT bg.book_id, bg.genre_id, b.title, g.name
       FROM book_genres bg
       INNER JOIN books b ON bg.book_id = b.id
       INNER JOIN genres g ON bg.genre_id = g.id
       WHERE b.id = $1`,
      [id],
    );

    return result.rows.map(
      (row) =>
        new BookGenre({
          book_id: row.book_id,
          genre_id: row.genre_id,
          book: { title: row.title, id: row.book_id },
          genre: { name: row.name, id: row.genre_id },
        }),
    );
  } catch (error) {
    console.error("Error en getBookGenresByBook:", error);
    throw error;
  }
}

async function getBookGenresByGenre(genreName) {
  try {
    const result = await pool.query(
      `SELECT bg.book_id, bg.genre_id, b.title AS book_title, b.id AS book_id,
              b.cover_url, g.name AS genre_name, g.id AS genre_id
       FROM public.book_genres bg
       INNER JOIN public.books b ON bg.book_id = b.id
       INNER JOIN public.genres g ON bg.genre_id = g.id
       WHERE g.name ILIKE $1`,
      [`%${genreName}%`],
    );

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
          genre: { name: row.genre_name, id: row.genre_id },
        }),
    );
  } catch (error) {
    console.error("Error en getBookGenresByGenre:", error);
    throw error;
  }
}

async function deleteByBookId(book_id, externalClient = null) {
  const client = externalClient || (await pool.connect());
  try {
    await client.query("DELETE FROM book_genres WHERE book_id = $1", [book_id]);
  } finally {
    if (!externalClient) client.release();
  }
}

async function deleteBookGenre(book_id, genre_id) {
  try {
    await pool.query(
      "DELETE FROM book_genres WHERE book_id = $1 AND genre_id = $2",
      [book_id, genre_id],
    );
    return true;
  } catch (error) {
    console.error("Error en deleteBookGenre:", error);
    throw error;
  }
}

export default {
  createBookGenre,
  syncBookGenres, // Nueva función estrella para updates
  getBookGenreById,
  getBookGenresByBook,
  getBookGenresByGenre,
  deleteBookGenre,
  deleteByBookId,
};
