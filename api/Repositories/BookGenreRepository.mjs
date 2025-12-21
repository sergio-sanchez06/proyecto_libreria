import pool from "../config/database.mjs";
import BookGenre from "../models/BookGenreModel.mjs";

async function createBookGenre(bookGenre) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO book_genre (book_id, genre_id) VALUES ($1, $2) RETURNING *",
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
      "SELECT * FROM book_genre WHERE book_id = $1 AND genre_id = $2",
      [book_id]
    );
    return new BookGenreModel(result.rows[0]);
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

async function getBookGenresByBook(bookTitle) {
  const client = await pool.connect();
  try {
    console.log(bookTitle);

    const result = await client.query(
      `SELECT 
                bg.book_id, bg.genre_id,
                b.title AS book_title,
                g.name AS genre_name
            FROM book_genres bg
            INNER JOIN books b ON bg.book_id = b.id
            INNER JOIN genres g ON bg.genre_id = g.id
            WHERE b.title ILIKE $1`,
      [`%${bookTitle}%`]
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
            title: row.book_title,
          },
          genre: {
            name: row.genre_name,
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
        g.name AS genre_name
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
          },
          genre: {
            name: row.genre_name,
          },
        })
    );
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

//Sacar todos los datos del libro
// async function getBookGenresByGenre(genreName) {
//   const client = await pool.connect();
//   try {
//     const result = await client.query(
//       `SELECT
//         bg.book_id, bg.genre_id,
//         b.title AS book_title, b.isbn, b.price, b.stock, b.releashed_year,
//         b.format, b.language, b.synopsis, b.pages, b.cover_url,
//         p.name AS publisher_name,
//         g.name AS genre_name,
//         json_agg(DISTINCT jsonb_build_object(
//           'id', g.id,
//           'name', g.name
//         )) FILTER (WHERE g.id IS NOT NULL) AS all_genres_for_book
//       FROM public.book_genres bg
//       INNER JOIN public.books b ON bg.book_id = b.id
//       INNER JOIN public.genres g ON bg.genre_id = g.id
//       LEFT JOIN public.publishers p ON b.publisher_id = p.id
//       WHERE g.name ILIKE $1
//       GROUP BY bg.book_id, bg.genre_id, b.id, p.name, g.name
//       ORDER BY b.releashed_year DESC`,
//       [`%${genreName}%`]
//     );

//     if (result.rows.length === 0) {
//       console.log("No se encontraron libros con el género especificado");
//     }

//     return result.rows.map(
//       (row) =>
//         new BookGenre({
//           book_id: row.book_id,
//           genre_id: row.genre_id,
//           book: row.book_title
//             ? {
//                 // Solo si hay datos del libro
//                 title: row.book_title,
//                 isbn: row.isbn,
//                 price: row.price,
//                 stock: row.stock,
//                 released_year: row.released_year,
//                 format: row.format,
//                 language: row.language,
//                 synopsis: row.synopsis,
//                 pages: row.pages,
//                 cover_url: row.cover_url,
//                 publisher_name: row.publisher_name || null,
//                 genres: row.all_genres_for_book || [], // array de géneros del libro
//               }
//             : null,
//           genre: row.genre_name
//             ? {
//                 // Solo si hay género
//                 name: row.genre_name,
//               }
//             : null,
//           created_at: row.created_at,
//           updated_at: row.updated_at,
//         })
//     );
//   } catch (error) {
//     throw error;
//   } finally {
//     client.release();
//   }
// }

async function updateBookGenre(bookGenre) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "UPDATE book_genre SET book_id = $1, genre_id = $2 WHERE id = $3 AND book_id = $4 AND genre_id = $5 RETURNING *",
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

async function deleteBookGenre(book_id, genre_id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM book_genre WHERE book_id = $1 AND genre_id = $2",
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
};
