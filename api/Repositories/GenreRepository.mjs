import pool from "../config/database";
import GenreModel from "../models/genreModel";

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
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM genres WHERE name = $1", [
      name,
    ]);
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
      "UPDATE genres SET name = $1 WHERE id = $2 RETURNING *",
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

export default {
  createGenre,
  getGenreById,
  getGenreByName,
  getAllGenres,
  updateGenre,
  deleteGenre,
};
