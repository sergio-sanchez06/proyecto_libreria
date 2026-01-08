import pool from "../config/database.mjs";
import GenreModel from "../models/GenreModel.mjs";

async function createGenre(genre) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO genres (name) VALUES ($1) RETURNING *",
      [genre.name]
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

async function getGenreById(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM genres WHERE id = $1", [
      id,
    ]);
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getGenreByName(name) {
  const client = await pool.connect();
  console.log("Tipo de dato de nombre: " + typeof name);
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM genres WHERE name = $1", [
      name,
    ]);
    console.log("Buscando nombre", name);

    if (result) {
      console.log("Encontrado", result.rows[0]);
    } else {
      console.log("No encontrado");
    }

    await client.query("COMMIT");
    return new GenreModel(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getAllGenres() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM genres");
    await client.query("COMMIT");
    return result.rows.map((genre) => new GenreModel(genre));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function updateGenre(genre) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE genres 
       SET 
         name = COALESCE($1, name),
         updated_at = NOW()
       WHERE id = $2 
       RETURNING *`,
      [genre.name, genre.id]
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

async function deleteGenre(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "DELETE FROM genres WHERE id = $1 RETURNING *",
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

async function getGenresMostSold() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `select name, sum(oi.quantity) as total_sold 
      from genres g join book_genres bg on g.id = bg.genre_id 
        join order_items oi on bg.book_id = oi.book_id 
      group by g.id, g.name 
      order by 2 desc 
      limit 5;`
    );
    return result.rows.map((row) => {
      const genre = new GenreModel(row);
      genre.totalSold = row.total_sold;
      return genre;
    });
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

export default {
  createGenre,
  getGenreById,
  getGenreByName,
  getAllGenres,
  updateGenre,
  deleteGenre,
  getGenresMostSold,
};
