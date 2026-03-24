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

async function getAllAuthors(page = null, limit = null, country = null) {
  const client = await pool.connect();
  try {
    let query = "SELECT * FROM authors ";
    let whereClauses = [];
    let params = [];

    if (country) {
      whereClauses.push("country = $" + (params.length + 1));
      params.push(country);
    }

    if (whereClauses.length > 0) {
      query += " WHERE " + whereClauses.join(" AND ");
    }

    query += " ORDER BY name ASC ";

    if (page !== null && limit !== null) {
      const p = Math.max(1, parseInt(page));
      const l = parseInt(limit);
      const offset = (p - 1) * l;

      query += " LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2);
      params.push(l, offset);
    }

    const result = await client.query(query, params);
    
    const authors = result.rows; 

    if (page !== null) {
      let countQuery = "SELECT COUNT(*) FROM authors";
      let countParams = [];
      if (country) {
        countQuery += " WHERE country = $1";
        countParams.push(country);
      }
      const countRes = await client.query(countQuery, countParams);
      const totalItems = parseInt(countRes.rows[0].count);
      
      return {
        data: authors,
        totalItems,
        totalPages: Math.ceil(totalItems / (limit || 4)),
        currentPage: parseInt(page)
      };
    }
    return authors;
  } catch (error) {
    console.error("Error en AuthorRepository:", error);
    throw error;
  } finally {
    client.release();
  }
}

async function getUniqueCountries() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT DISTINCT country FROM authors WHERE country IS NOT NULL AND country <> '' ORDER BY country ASC"
    );
    return result.rows.map((row) => row.country);
  } catch (error) {
    console.error("Error en getUniqueCountries:", error);
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
getUniqueCountries,
};