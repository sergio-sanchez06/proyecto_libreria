import pool from "../config/database.mjs";
import BookAuthorModel from "../models/bookAuthorModel.mjs";
import authorModel from "../models/authorModel.mjs";

// 1. Crear asociación (No suele requerir transacción si es una sola consulta)
async function createBookAuthor(bookAuthor) {
  const result = await pool.query(
    "INSERT INTO book_author (book_id, author_id) VALUES ($1, $2) RETURNING *",
    [bookAuthor.book_id, bookAuthor.author_id]
  );
  return result.rows[0] ? new BookAuthorModel(result.rows[0]) : null;
}

async function getBooksByAuthorName(authorName) {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT 
        b.id, b.title, b.isbn, b.price, b.stock, b.releashed_year,
        b.format, b.language, b.synopsis, b.pages, b.cover_url,
        b.created_at, b.updated_at,
        p.name AS publisher_name,
        json_agg(DISTINCT jsonb_build_object(
          'name', g.name
        )) FILTER (WHERE g.id IS NOT NULL) AS genres
      FROM public.books b
      INNER JOIN public.book_authors ba ON b.id = ba.book_id
      INNER JOIN public.authors a ON ba.author_id = a.id
      LEFT JOIN public.publishers p ON b.publisher_id = p.id
      LEFT JOIN public.book_genres bg ON b.id = bg.book_id
      LEFT JOIN public.genres g ON bg.genre_id = g.id
      WHERE a.name ILIKE $1  -- ILIKE para búsqueda insensible a mayúsculas
      GROUP BY b.id, p.name
      ORDER BY b.releashed_year DESC
      `,
      [`%${authorName}%`]
    );

    // Sacar toda la información de los generos de libro en formato json
    // const result = await client.query(
    //   `SELECT
    //     b.id, b.title, b.isbn, b.price, b.stock, b.releashed_year,
    //     b.format, b.language, b.synopsis, b.pages, b.cover_url,
    //     b.created_at, b.updated_at,
    //     p.name AS publisher_name,
    //     json_agg(DISTINCT jsonb_build_object(
    //       'id', g.id,
    //       'name', g.name
    //     )) FILTER (WHERE g.id IS NOT NULL) AS genres
    //   FROM public.books b
    //   INNER JOIN public.book_authors ba ON b.id = ba.book_id
    //   INNER JOIN public.authors a ON ba.author_id = a.id
    //   LEFT JOIN public.publishers p ON b.publisher_id = p.id
    //   LEFT JOIN public.book_genres bg ON b.id = bg.book_id
    //   LEFT JOIN public.genres g ON bg.genre_id = g.id
    //   WHERE a.name ILIKE $1  -- ILIKE para búsqueda insensible a mayúsculas
    //   GROUP BY b.id, p.name
    //   ORDER BY b.releashed_year DESC
    //   `,
    //   [`%${authorName}%`]
    // );

    console.log(result.rows);

    return result.rows.map((row) => ({
      ...row,
      genres: row.genres || [],
    }));
  } catch (err) {
    console.log(err);
    return "Fallo al recueperar los libros del autor";
  } finally {
    client.release();
  }
}

async function getAuthorsByBook(bookTitle) {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT 
        a.id, a.name, a.country, a.photo_url, a.created_at, a.updated_at
      FROM public.authors a
      INNER JOIN public.book_authors ba ON a.id = ba.author_id
      INNER JOIN public.books b ON ba.book_id = b.id
      WHERE b.title ILIKE $1
      GROUP BY a.id
      ORDER BY a.name ASC
      `,
      [`%${bookTitle}%`]
    );
    return result.rows.map((row) => new authorModel(row));
  } catch (err) {
    console.log(err);
    return "Fallo al recueperar los autores del libro";
  } finally {
    client.release();
  }
}

async function countBooksByAuthors() {
  const client = await pool.connect();

  try {
    const result = await client.query(
      "SELECT author_id,COUNT(*) as count_books FROM book_authors group by author_id"
    );
    return result.rows;
  } catch (err) {
    console.log(err);
    return "Fallo al recueperar los libros del autor";
  } finally {
    client.release();
  }
}

async function countBooksByAuthor(authorId) {
  const client = await pool.connect();

  try {
    const result = await client.query(
      "SELECT COUNT(*) FROM book_authors WHERE author_id = $1 order by book_id",
      [authorId]
    );
    return result.rows;
  } catch (err) {
    console.log(err);
    return "Fallo al recueperar los libros del autor";
  } finally {
    client.release();
  }
}

// 2. Obtener por clave compuesta (book_id Y author_id)
async function getBookAuthor(bookId, authorId) {
  const result = await pool.query(
    "SELECT * FROM book_author WHERE book_id = $1 AND author_id = $2",
    [bookId, authorId]
  );
  return result.rows[0] ? new BookAuthorModel(result.rows[0]) : null;
}

// 3. Actualizar (Cambiar un autor o libro por otro en la relación)
// Nota: Necesitamos los IDs viejos para encontrar la fila y los nuevos para actualizarla
async function updateBookAuthor(oldIds, newIds) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE book_author 
       SET book_id = $1, author_id = $2 
       WHERE book_id = $3 AND author_id = $4 
       RETURNING *`,
      [newIds.book_id, newIds.author_id, oldIds.book_id, oldIds.author_id]
    );
    await client.query("COMMIT");
    return result.rows[0] ? new BookAuthorModel(result.rows[0]) : null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getAuthorsByBookId(bookId) {
  const client = await pool.connect();

  try {
    const result = await client.query(
      "SELECT a.* FROM book_authors ba join authors a on ba.author_id = a.id WHERE ba.book_id = $1",
      [bookId]
    );
    return result.rows.map((row) => new authorModel(row));
  } catch (err) {
    console.log(err);
    return "Fallo al recueperar los libros del autor";
  } finally {
    client.release();
  }
}

// 4. Eliminar por clave compuesta
async function deleteBookAuthor(bookId, authorId) {
  const result = await pool.query(
    "DELETE FROM book_author WHERE book_id = $1 AND author_id = $2 RETURNING *",
    [bookId, authorId]
  );
  return result.rowCount > 0;
}

export default {
  createBookAuthor,
  getBooksByAuthorName,
  getAuthorsByBook,
  getBookAuthor,
  getAuthorsByBookId,
  updateBookAuthor,
  countBooksByAuthor,
  countBooksByAuthors,
  deleteBookAuthor,
};
