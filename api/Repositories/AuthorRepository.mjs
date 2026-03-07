import pool from "../config/database.mjs";
import authorModel from "../models/authorModel.mjs";

async function createAuthor(author) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO authors (name, country, photo_url, biography) VALUES ($1, $2, $3, $4) RETURNING *",
      [author.name, author.country, author.photo_url, author.biography]
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
    const result = await client.query(
      "SELECT * FROM authors WHERE UPPER(name) = UPPER($1)",
      [name]
    );
    await client.query("COMMIT");
    return new authorModel(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getAuthorByCountry(country) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "SELECT * FROM authors WHERE UPPER(country) = UPPER($1)",
      [country]
    );
    await client.query("COMMIT");
    return result.rows.map((author) => new authorModel(author));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function updateAuthor(author) {
  const client = await pool.connect();
  console.log(author);
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE authors 
       SET 
         name = COALESCE($1, name),
         country = COALESCE($2, country),
         photo_url = COALESCE($3, photo_url),
         biography = COALESCE($4, biography),
         updated_at = NOW()
       WHERE id = $5 
       RETURNING *`,
      [
        author.name,
        author.country,
        author.photo_url,
        author.biography,
        author.id,
      ]
    );

    if (result) {
      console.log("Actualizado");
    } else {
      console.log("No se actualizó");
    }

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

async function updatePhoto(id, photoUrl) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "UPDATE authors SET photo_url = $2 WHERE id = $1 RETURNING *",
      [id, photoUrl]
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

async function getAuthorsMostSold() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `select a.*, sum(oi.quantity) as total_sold
        from authors a join book_authors ba on ba.author_id = a.id 
          right join order_items oi on oi.book_id = ba.book_id 
        group by a.id,a.name, oi.book_id 
        order by total_sold desc
        LIMIT 5;`
    );
    return result.rows.map((row) => {
      const author = new authorModel(row);
      author.totalSold = row.total_sold;
      return author;
    });
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

export default {
  createAuthor,
  getAuthorById,
  getAuthorByName,
  getAuthorByCountry,
  updateAuthor,
  deleteAuthor,
  getAllAuthors,
  updatePhoto,
  getAuthorsMostSold,
};
