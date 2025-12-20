import PublisherModel from "../models/publisherModel";
import pool from "../config/database";

async function createPublisher(publisher) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO publishers (name, country) VALUES ($1, $2) RETURNING *",
      [publisher.name, publisher.country]
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

async function getPublisherById(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "SELECT * FROM publishers WHERE id = $1",
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
async function getPublisherByName(name) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "SELECT * FROM publishers WHERE name = $1",
      [name]
    );
    await client.query("COMMIT");
    return new PublisherModel(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function updatePublisher(publisher) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE publishers 
       SET 
         name = COALESCE($1, name),
         country = COALESCE($2, country),
         updated_at = NOW()
       WHERE id = $3 
       RETURNING *`,
      [publisher.name, publisher.country, publisher.id]
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

async function deletePublisher(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "DELETE FROM publishers WHERE id = $1 RETURNING *",
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

async function getAllPublishers() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM publishers");
    await client.query("COMMIT");
    return result.rows.map((publisher) => new PublisherModel(publisher));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getPublisherByCountry(country) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "SELECT * FROM publishers WHERE country = $1",
      [country]
    );
    await client.query("COMMIT");
    return result.rows.map((publisher) => new PublisherModel(publisher));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export default {
  createPublisher,
  getPublisherById,
  getPublisherByName,
  getPublisherByCountry,
  getAllPublishers,
  updatePublisher,
  deletePublisher,
};
