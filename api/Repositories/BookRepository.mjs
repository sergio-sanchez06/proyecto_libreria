import Book from "../models/BookModel.mjs";
import pool from "../config/database.mjs";
import axios from "axios";

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
      `UPDATE books 
       SET 
         title = COALESCE($1, title),
         isbn = COALESCE($2, isbn),
         price = COALESCE($3, price),
         stock = COALESCE($4, stock),
         releashed_year = COALESCE($5, releashed_year),
         format = COALESCE($6, format),
         language = COALESCE($7, language),
         pages = COALESCE($8, pages),
         synopsis = COALESCE($9, synopsis),
         cover_url = COALESCE($10, cover_url),
         publisher_id = COALESCE($11, publisher_id),
         updated_at = NOW()
       WHERE id = $12 
       RETURNING *`,
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

async function updateAllCovers() {
  const client = await pool.connect();
  try {
    // 1. Obtener todos los libros que no tienen portada o tienen una vacía
    const { rows: books } = await client.query(
      "SELECT id, isbn FROM books WHERE cover_url IS NULL OR cover_url = ''"
    );

    console.log(`Se encontraron ${books.length} libros para actualizar.`);

    const updatedBooks = [];

    // 2. Recorrer cada libro y buscar su portada en Google
    for (const book of books) {
      if (book.isbn) {
        try {
          // Reutilizamos la lógica de buscar en Google (puedes extraerla a una función aparte)
          const { data } = await axios.get(
            `https://www.googleapis.com/books/v1/volumes?q=isbn:${book.isbn}`
          );

          if (data.totalItems > 0 && data.items[0].volumeInfo.imageLinks) {
            const url = data.items[0].volumeInfo.imageLinks.thumbnail.replace(
              "http://",
              "https://"
            );

            // 3. Actualizar este libro específico en la BBDD
            const updateRes = await client.query(
              "UPDATE books SET cover_url = $1 WHERE id = $2 RETURNING *",
              [url, book.id]
            );

            updatedBooks.push(updateRes.rows[0]);
            console.log(`Portada actualizada para ID: ${book.id}`);
          }

          // Opcional: Pequeña pausa para no saturar la API de Google (Rate Limiting)
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (err) {
          console.error(`Error con el libro ${book.id}: ${err.message}`);
        }
      }
    }
    return updatedBooks;
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

async function getBookByFeatures(features) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `
      SELECT b.id, b.title, b.cover_url, b.price, a.name AS author_name
      FROM public.books b
      INNER JOIN public.book_authors ba ON b.id = ba.book_id
      INNER JOIN public.authors a ON ba.author_id = a.id
      ORDER BY b.created_at DESC
      LIMIT $1
      `,
      [5]
    );
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
  updateAllCovers,
  getBookByFeatures,
  getAllBooks,
};
