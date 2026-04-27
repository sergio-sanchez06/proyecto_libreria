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
        publisher.descripcion,
        publisher.image_url,
      ],
    );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error en createPublisher:", error);
    throw error;
  } finally {
    client.release();
  }
}

async function getPublisherById(id, client = pool) {
  try {
    const result = await client.query(
      "SELECT * FROM publishers WHERE id = $1 AND deleted_at IS NULL",
      [id],
    );

    if (result.rows.length === 0) return null;

    return new PublisherModel(result.rows[0]);
  } catch (error) {
    console.error("Error en getPublisherById:", error);
    throw error;
  }
}
async function getPublisherByName(name) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM publishers WHERE name = $1",
      [name],
    );
    return new PublisherModel(result.rows[0]);
  } catch (error) {
    console.error("Error en getPublisherByName:", error);
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
      ],
    );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error en updatePublisher:", error);
    throw error;
  } finally {
    client.release();
  }
}

// async function deletePublisher(id, connection) {
//   const sql = `
//         UPDATE publishers
//         SET deleted_at = NOW()
//         WHERE id = $1
//     `;
//   const result = await connection.query(sql, [id]);
//   return result;
// }
async function deletePublisher(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "UPDATE publishers SET deleted_at = NOW() WHERE id = $1 RETURNING *",
      [id],
    );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error en deletePublisher:", error);
    throw error;
  } finally {
    client.release();
  }
}
// async function deletePublisher(id) {
//   const client = await pool.connect();
//   try {
//     await client.query("BEGIN");
//     const result = await client.query(
//       "DELETE FROM publishers WHERE id = $1 RETURNING *",
//       [id],
//     );
//     await client.query("COMMIT");
//     return result.rows[0];
//   } catch (error) {
//     await client.query("ROLLBACK");
//     console.error("Error en deletePublisher:", error);
//     throw error;
//   } finally {
//     client.release();
//   }
// }

/*async function getAllPublishers() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM publishers order by name");
    await client.query("COMMIT");
    return result.rows.map((publisher) => new PublisherModel(publisher));
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error en getAllPublishers:", error);
    throw error;
  } finally {
    client.release();
  }
}*/

async function getAllPublishers(page = 1, limit = 4) {
  const client = await pool.connect();
  try {
    const offset = (page - 1) * limit;

    const countRes = await client.query("SELECT COUNT(*) FROM publishers");
    const totalItems = parseInt(countRes.rows[0].count);

    const result = await client.query(
      "SELECT * FROM publishers ORDER BY name LIMIT $1 OFFSET $2",
      [limit, offset],
    );

    return {
      data: result.rows.map((publisher) => new PublisherModel(publisher)),
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: parseInt(page),
    };
  } catch (error) {
    console.error("Error en getAllPublishers:", error);
    throw error;
  } finally {
    client.release();
  }
}

async function getPublisherByCountry(country) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM publishers WHERE country = $1",
      [country],
    );
    return result.rows.map((publisher) => new PublisherModel(publisher));
  } catch (error) {
    console.error("Error en getPublisherByCountry:", error);
    throw error;
  } finally {
    client.release();
  }
}

async function getPublishersMostSold() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `select p.*, sum(oi.quantity) as total_sold 
      from publishers p left join books b on p.id = b.publisher_id 
        join order_items oi on oi.book_id = b.id 
      group by p.id 
      order by total_sold desc
      LIMIT 5;`,
    );
    return result.rows.map((row) => {
      const publisher = new PublisherModel(row);
      publisher.totalSold = row.total_sold;
      return publisher;
    });
  } catch (error) {
    console.error("Error en getPublishersMostSold:", error);
    throw error;
  } finally {
    client.release();
  }
}

async function getPublishers() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM publishers where deleted_at is null order by name",
    );
    return result.rows.map((publisher) => new PublisherModel(publisher));
  } catch (error) {
    console.error("Error en getPublishers:", error);
    throw error;
  } finally {
    client.release();
  }
}

async function restorePublisher(id, client = pool) {
  console.log("id", id);

  const sql = `
    UPDATE publishers 
    SET deleted_at = NULL 
    WHERE id = $1
  `;
  return await client.query(sql, [id]);
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
  getPublishers,
  restorePublisher,
};
