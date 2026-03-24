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
      ],
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
    const result = await client.query(
      "SELECT b.* FROM books b right join publishers p ON b.publisher_id = p.id WHERE b.id = $1",
      [id],
    );
    return new Book(result.rows[0]);
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

async function getBookByTitle(title) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT b.* FROM books b right join publishers p ON b.publisher_id = p.id WHERE b.title = $1",
      [title],
    );
    return new Book(result.rows[0]);
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

async function updateBook(id, book) {
  const client = await pool.connect();

  console.log(`Datos del libro a modificar: ${book}`);

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
        id,
      ],
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

async function getBooksByPublisherId(publisher_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT b.*, p.name as publisher_name FROM books b right join publishers p ON b.publisher_id = p.id WHERE b.publisher_id = $1",
      [publisher_id],
    );
    return result.rows.map((book) => new Book(book));
  } catch (error) {
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
      "SELECT id, isbn FROM books WHERE cover_url IS NULL OR cover_url = ''",
    );

    console.log(`Se encontraron ${books.length} libros para actualizar.`);

    const updatedBooks = [];

    // 2. Recorrer cada libro y buscar su portada en Google
    for (const book of books) {
      if (book.isbn) {
        try {
          // Reutilizamos la lógica de buscar en Google (puedes extraerla a una función aparte)
          const { data } = await axios.get(
            `https://www.googleapis.com/books/v1/volumes?q=isbn:${book.isbn}`,
          );

          if (data.totalItems > 0 && data.items[0].volumeInfo.imageLinks) {
            const url = data.items[0].volumeInfo.imageLinks.thumbnail.replace(
              "http://",
              "https://",
            );

            // 3. Actualizar este libro específico en la BBDD
            const updateRes = await client.query(
              "UPDATE books SET cover_url = $1 WHERE id = $2 RETURNING *",
              [url, book.id],
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
      [5],
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

// async function getAllBooks(page = 1, limit = 4) {
//   const client = await pool.connect();
//   try {
//     const p = Math.max(1, parseInt(page) || 1);
//     const l = 4;
//     const offset = (p - 1) * l;

//     const query = `SELECT * FROM books ORDER BY created_at DESC LIMIT ${l} OFFSET ${offset}`;

//     console.log("--- DEBUG API ---");
//     console.log("Página solicitada:", p);
//     console.log("SQL ejecutado:", query);

//     const result = await client.query(query);
//     const books = result.rows;

//     const countRes = await client.query("SELECT COUNT(*) FROM books");
//     const totalItems = parseInt(countRes.rows[0].count);

//     return {
//       data: books,
//       totalItems,
//       totalPages: Math.ceil(totalItems / l),
//       currentPage: p
//     };
//   } catch (error) {
//     console.error("Error en Repository:", error);
//     throw error;
//   } finally {
//     client.release();
//   }
// }

// api/Repositories/BookRepository.mjs

async function getBooksCarrusel(ids = null) {
  try {
    let query = "SELECT * FROM books";
    let params = [];

    if (ids) {
      const idArray = ids
        .split(",")
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id));

      if (idArray.length > 0) {
        const placeholders = idArray.map((_, i) => `$${i + 1}`).join(",");
        query += ` WHERE id IN (${placeholders})`;
        params = idArray;
      }
    }

    const result = await pool.query(query, params);
    return result.rows.map((book) => new Book(book));
  } catch (error) {
    throw error;
  }
}

async function getAllBooks(page = 1, filters = {}) {
  const client = await pool.connect();
  try {
    const p = Math.max(1, parseInt(page) || 1);
    const l = 8;
    const offset = (p - 1) * l;

    let queryBase = "SELECT b.* FROM books b";
    let countBase = "SELECT COUNT(*) FROM books b";
    let whereClauses = [];
    let values = [];

    if (filters.q) {
      whereClauses.push(`b.title ILIKE $${values.length + 1}`);
      values.push(`%${filters.q}%`);
    }

    if (filters.maxPrice) {
      whereClauses.push(`b.price <= $${values.length + 1}`);
      values.push(filters.maxPrice);
    }

    if (filters.genre) {
      whereClauses.push(
        `b.id IN (SELECT book_id FROM book_genres WHERE genre_id = $${values.length + 1})`,
      );
      values.push(filters.genre);
    }

    if (filters.author) {
      whereClauses.push(
        `b.id IN (SELECT book_id FROM book_authors WHERE author_id = $${values.length + 1})`,
      );
      values.push(filters.author);
    }

    const whereSQL =
      whereClauses.length > 0 ? " WHERE " + whereClauses.join(" AND ") : "";

    const finalQuery = `${queryBase} ${whereSQL} ORDER BY b.created_at DESC LIMIT ${l} OFFSET ${offset}`;
    const finalCount = `${countBase} ${whereSQL}`;

    const [result, countRes] = await Promise.all([
      client.query(finalQuery, values),
      client.query(finalCount, values),
    ]);

    const totalItems = parseInt(countRes.rows[0].count);

    return {
      data: result.rows,
      totalItems,
      totalPages: Math.ceil(totalItems / l),
      currentPage: p,
    };
  } catch (error) {
    console.error("Error en getAllBooks (Repository):", error);
    throw error;
  } finally {
    client.release();
  }
}

async function updateStock(book_id, quantity, client) {
  await client.query("UPDATE books SET stock = stock - $1 WHERE id = $2", [
    quantity,
    book_id,
  ]);
}

async function getBooksByIds(bookIds) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM books WHERE id = ANY($1)",
      [bookIds],
    );
    return result.rows.map((book) => new Book(book));
  } catch (error) {
    console.log(error);
    throw error;
  } finally {
    client.release();
  }
}

async function getBooksMostSold() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `select b.*, sum(oi.quantity) as total_sold 
      from books b right join order_items oi on b.id = oi.book_id 
      group by b.id 
      order by total_sold desc
      LIMIT 5;`,
    );
    return result.rows.map((row) => {
      const book = new Book(row);
      book.totalSold = row.total_sold;
      return book;
    });
  } catch (error) {
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
  getBooksByPublisherId,
  updateStock,
  getBooksByIds,
  getBooksMostSold,
  getBooksCarrusel,
};
