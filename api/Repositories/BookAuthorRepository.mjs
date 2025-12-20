import pool from "../config/database.mjs";
import BookAuthorModel from "../models/bookAuthorModel.mjs";

// 1. Crear asociación (No suele requerir transacción si es una sola consulta)
async function createBookAuthor(bookAuthor) {
  const result = await pool.query(
    "INSERT INTO book_author (book_id, author_id) VALUES ($1, $2) RETURNING *",
    [bookAuthor.book_id, bookAuthor.author_id]
  );
  return result.rows[0] ? new BookAuthorModel(result.rows[0]) : null;
}

async function getBooksByAuthorName(authorName) {

  const client = await pool.connect()

  try {

    const result = await client.query(`SELECT ba.* 
      from books b join book_authors ba on b.id = ba.book_id
      join authors a on ba.author_id = a.id
      where a.name = $1
                    `, [authorName])

    console.log(result.rows)

    return result.rows.map((row) => new BookAuthorModel(row))

  } catch (err) {

    console.log(err)
    return "Fallo al recueperar los libros del autor"
  }
  finally {

    client.release()

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
  getBookAuthor,
  updateBookAuthor,
  deleteBookAuthor,
};