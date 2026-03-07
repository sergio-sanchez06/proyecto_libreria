import PublisherModel from "../models/publisherModel.mjs";
import pool from "../config/database.mjs";

async function createPublisher(publisher) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO publishers (name, country, website, descripcion, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [
        publisher.name,
        publisher.country,
        publisher.website,
        publisher.description,
        publisher.image_url,
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
  console.log(publisher);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE publishers 
       SET 
         name = COALESCE($1, name),
         country = COALESCE($2, country),
         website = COALESCE($3, website),
         descripcion = COALESCE($4, descripcion),
         image_url = COALESCE($5, image_url),
         updated_at = NOW()
       WHERE id = $6 
       RETURNING *`,
      [
        publisher.name,
        publisher.country,
        publisher.website,
        publisher.descripcion,
        publisher.logo_url,
        publisher.id,
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
    const result = await client.query("SELECT * FROM publishers order by name");
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

async function getPublishersMostSold() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `select p.*, sum(oi.quantity) as total_sold 
      from publishers p left join books b on p.id = b.publisher_id 
        join order_items oi on oi.book_id = b.id 
      group by p.id 
      order by total_sold desc
      LIMIT 5;`
    );
    return result.rows.map((row) => {
      const publisher = new PublisherModel(row);
      publisher.totalSold = row.total_sold;
      return publisher;
    });
  } catch (error) {
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
  getPublishersMostSold,
};
