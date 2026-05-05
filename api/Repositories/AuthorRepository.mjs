import pool from "../config/database.mjs";
import authorModel from "../models/authorModel.mjs";

async function createAuthor(author) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO authors (name, country, photo_url, biography) VALUES ($1, $2, $3, $4) RETURNING *",
      [author.name, author.country, author.photo_url, author.biography],
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
    const result = await client.query(
      "SELECT * FROM authors WHERE id = $1 AND deleted_at IS NULL",
      [id],
    );
    return result.rows[0] ? new authorModel(result.rows[0]) : null;
  } catch (error) {
    console.error("Error obteniendo autor por ID:", error);
    throw error;
  } finally {
    client.release();
  }
}

async function getAuthorByName(name) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM authors WHERE UPPER(name) = UPPER($1)",
      [name],
    );
    return new authorModel(result.rows[0]);
  } catch (error) {
    console.error("Error obteniendo autor por nombre:", error);
    throw error;
  } finally {
    client.release();
  }
}

async function getAuthorByCountry(country) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM authors WHERE UPPER(country) = UPPER($1)",
      [country],
    );
    return result.rows.map((author) => new authorModel(author));
  } catch (error) {
    console.error("Error obteniendo autor por país:", error);
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
      ],
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
    console.error("Error actualizando autor:", error);
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
      "UPDATE authors SET deleted_at = NOW() WHERE id = $1 RETURNING *",
      [id],
    );
    // const result = await client.query(
    //   "DELETE FROM authors WHERE id = $1 RETURNING *",
    //   [id],
    // );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error eliminando autor:", error);
    throw error;
  } finally {
    client.release();
  }
}

async function getAllAuthors(
  page = null,
  limit = null,
  country = null,
  deleted = false,
  onlyWithBooks = false, // <-- Mostrar autores borrados en el filtro de catalogo
  includeAll = false, // <-- Mostrar autores borrados en la tabla de admin sin usar el filtro de solo borrados
  mostRated = false,
  leastRated = false,
  mostBought = false,
  leastBought = false,
   
) {
  const client = await pool.connect();
  try {

    let whereClauses = [];
    let params = [];
    let joinClauses = [];
    let groupBy = [];
    let OrderClause = [];
    let selectClause = [];

    // Filtro de país
    if (country) {
      whereClauses.push("a.country = $" + (params.length + 1));
      params.push(country);
    }

    // Lógica inteligente de borrado
    if (onlyWithBooks) {
      whereClauses.push("b.deleted_at IS NULL ");
    } else if (includeAll) {
      // CASO ADMIN TOTAL: No añadimos filtro de deleted_at.
      // Traerá tanto NULL como NOT NULL.
    } else {
      if (deleted) {
        whereClauses.push("a.deleted_at IS NOT NULL "); // Solo papelera
      } else {
        whereClauses.push("a.deleted_at IS NULL "); // Solo activos (Para formularios)
      }
    }

    if(mostRated === true){
      selectClause.push(", COALESCE(round(avg(rating), 1),0)")
      joinClauses.push("full outer join reviews on ba.book_id = reviews.book_id")
      groupBy.push("a.id")
      OrderClause.push("COALESCE(round(avg(rating), 1),0) desc")
      
    }
    if(leastRated === true){
      selectClause.push(", COALESCE(round(avg(rating), 1),0)")
      joinClauses.push("full outer join reviews on ba.book_id = reviews.book_id")
      groupBy.push("a.id")
      OrderClause.push("COALESCE(round(avg(rating), 1),0) asc")
      
    }
    if(mostBought === true){
      selectClause.push(", count(order_items.book_id)")
      joinClauses.push("full outer join order_items on ba.book_id = order_items.book_id")
      groupBy.push("a.id")
      groupBy.push("order_items.book_id")
      OrderClause.push("count(order_items.book_id) desc")
    }
    if(leastBought === true){
      selectClause.push(", count(order_items.book_id)")
      joinClauses.push("full outer join order_items on ba.book_id = order_items.book_id")
      groupBy.push("a.id")
      groupBy.push("order_items.book_id")
      OrderClause.push("count(order_items.book_id) asc")
    }

    const selectSQl = selectClause.length > 0 ? selectClause.join("") : ""

    // 1. Usamos DISTINCT para no repetir autores si tienen muchos libros
    let query = `SELECT DISTINCT a.* ${selectSQl} FROM authors a `;

    // Si solo queremos autores con libros, necesitamos unir las tablas
    if (onlyWithBooks) {
      query += " INNER JOIN book_authors ba ON a.id = ba.author_id ";
      query += " INNER JOIN books b ON ba.book_id = b.id ";
    } else if (joinClauses.length > 0) {
      // Necesitamos ba si vamos a unir con reviews u order_items
      query += " LEFT JOIN book_authors ba ON a.id = ba.author_id ";
    }

    const joinSQL = joinClauses.length > 0 ? joinClauses.join(" ") : "";
    query += joinSQL + " ";

    if (whereClauses.length > 0) {
      query += " WHERE " + whereClauses.join(" AND ");
    }

    const groupBySQL = groupBy.length > 0 ? groupBy.join(",") : "a.id";
    const orderBySQL = OrderClause.length > 0 ? OrderClause.join(",") : "a.name ASC";

    query += " GROUP BY " + groupBySQL + " ORDER BY " + orderBySQL;

    console.log("SQL Query:", query);

    // Paginación (Tu lógica original adaptada)
    if (page !== null && limit !== null) {
      const p = Math.max(1, parseInt(page));
      const l = parseInt(limit);
      const offset = (p - 1) * l;
      query +=
        " LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2);
      params.push(l, offset);
    }

    const result = await client.query(query, params);
    const authors = result.rows;

    // Conteo para paginación
    if (page !== null) {
      // Nota: El conteo debe reflejar los mismos JOINs que la query principal
      let countQuery = "SELECT COUNT(DISTINCT a.id) FROM authors a";
      let countParams = [];

      if (onlyWithBooks) {
        countQuery +=
          " INNER JOIN book_authors ba ON a.id = ba.author_id INNER JOIN books b ON ba.book_id = b.id WHERE b.deleted_at IS NULL";
        if (country) {
          countQuery += " AND a.country = $1";
          countParams.push(country);
        }
      } else if (country) {
        countQuery += " WHERE a.country = $1";
        countParams.push(country);
      }

      const countRes = await client.query(countQuery, countParams);
      const totalItems = parseInt(countRes.rows[0].count);

      return {
        data: authors,
        totalItems,
        totalPages: Math.ceil(totalItems / (limit || 4)),
        currentPage: parseInt(page),
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
// async function getAllAuthors(
//   page = null,
//   limit = null,
//   country = null,
//   deleted = false,
//   onlyWithBooks = false,
// ) {
//   const client = await pool.connect();
//   try {
//     let query = "SELECT * FROM authors ";
//     let whereClauses = [];
//     let params = [];

//     if (country) {
//       whereClauses.push("country = $" + (params.length + 1));
//       params.push(country);
//     }

//     if (deleted) {
//       whereClauses.push("deleted_at IS NOT NULL");
//     } else {
//       whereClauses.push("deleted_at IS NULL");
//     }

//     if (whereClauses.length > 0) {
//       query += " WHERE " + whereClauses.join(" AND ");
//     }

//     query += " ORDER BY name ASC ";

//     if (page !== null && limit !== null) {
//       const p = Math.max(1, parseInt(page));
//       const l = parseInt(limit);
//       const offset = (p - 1) * l;

//       query +=
//         " LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2);
//       params.push(l, offset);
//     }

//     const result = await client.query(query, params);

//     const authors = result.rows;

//     if (page !== null) {
//       let countQuery = "SELECT COUNT(*) FROM authors";
//       let countParams = [];
//       if (country) {
//         countQuery += " WHERE country = $1";
//         countParams.push(country);
//       }
//       const countRes = await client.query(countQuery, countParams);
//       const totalItems = parseInt(countRes.rows[0].count);

//       return {
//         data: authors,
//         totalItems,
//         totalPages: Math.ceil(totalItems / (limit || 4)),
//         currentPage: parseInt(page),
//       };
//     }
//     return authors;
//   } catch (error) {
//     console.error("Error en AuthorRepository:", error);
//     throw error;
//   } finally {
//     client.release();
//   }
// }

async function getUniqueCountries() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT DISTINCT country FROM authors WHERE country IS NOT NULL AND country <> '' ORDER BY country ASC",
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
      [id, photoUrl],
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
          join order_items oi on oi.book_id = ba.book_id 
       group by a.id 
       order by total_sold desc
       LIMIT 5;`,
    );
    return result.rows.map((row) => {
      const author = new authorModel(row);
      author.totalSold = parseInt(row.total_sold);
      return author;
    });
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

async function restoreAuthor(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "UPDATE authors SET deleted_at = NULL WHERE id = $1 RETURNING *",
      [id],
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
  restoreAuthor,
};