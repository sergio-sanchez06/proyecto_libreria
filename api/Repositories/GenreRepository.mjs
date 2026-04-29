import pool from "../config/database.mjs";
import GenreModel from "../models/GenreModel.mjs";

async function createGenre(genre) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO genres (name) VALUES ($1) RETURNING *",
      [genre.name],
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
    const result = await client.query(
      "SELECT * FROM genres WHERE id = $1 AND deleted_at IS NULL",
      [id],
    );
    return result.rows[0] ? new GenreModel(result.rows[0]) : null;
  } catch (error) {
    console.log("Error en getGenreById", error);
    throw error;
  } finally {
    client.release();
  }
}

async function getGenreByName(name) {
  const client = await pool.connect();
  console.log("Tipo de dato de nombre: " + typeof name);
  try {
    const result = await client.query(
      "SELECT * FROM genres WHERE name = $1 AND deleted_at IS NULL",
      [name],
    );
    console.log("Buscando nombre", name);

    if (result) {
      console.log("Encontrado", result.rows[0]);
    } else {
      console.log("No encontrado");
    }

    return result.rows[0] ? new GenreModel(result.rows[0]) : null;
  } catch (error) {
    console.log("Error en getGenreByName", error);
    throw error;
  } finally {
    client.release();
  }
}

async function getAllGenres(page = 1, limit = 10, includeDeleted = false) {
  const client = await pool.connect();
  try {
    const offset = (page - 1) * limit;

    const whereClause = includeDeleted ? "1=1" : "deleted_at IS NULL";

    // 2. Obtener el conteo total con la condición dinámica
    const countRes = await client.query(
      `SELECT COUNT(*) FROM genres WHERE ${whereClause}`,
    );
    const totalItems = parseInt(countRes.rows[0].count);

    // 3. Obtener los registros con la condición dinámica
    const result = await client.query(
      `SELECT * FROM genres 
       WHERE ${whereClause} 
       ORDER BY name 
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    return {
      data: result.rows.map((genre) => new GenreModel(genre)),
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: parseInt(page),
    };
  } catch (error) {
    console.log("Error en getAllGenres (paginado)", error);
    throw error;
  } finally {
    client.release();
  }
}

async function getGenres(includeDeleted = false) {
  const client = await pool.connect();
  let result;
  try {
    if (includeDeleted) {
      result = await client.query("SELECT * FROM genres ORDER BY name");
    } else {
      result = await client.query(
        `SELECT DISTINCT g.* FROM genres g
        LEFT JOIN book_genres bg ON g.id = bg.genre_id
        WHERE g.deleted_at IS NULL 
           OR bg.book_id IS NOT NULL
        ORDER BY g.name`,
      );
    }
    return result.rows.map((genre) => new GenreModel(genre));
  } catch (error) {
    console.log("Error en getGenres (completo)", error);
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
      [genre.name, genre.id],
    );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    console.log("Error en updateGenre", error);
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
    //Borrado lógico (SOFT DELETE)
    const result = await client.query(
      "UPDATE genres SET deleted_at = NOW() WHERE id = $1 RETURNING *",
      [id],
    );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.log("Error en deleteGenre", error);
    throw error;
  } finally {
    client.release();
  }
}
// async function deleteGenre(id) {
//   const client = await pool.connect();
//   try {
//     await client.query("BEGIN");
//     const result = await client.query(
//       "DELETE FROM genres WHERE id = $1 RETURNING *",
//       [id],
//     );
//     await client.query("COMMIT");
//     return result.rows[0];
//   } catch (error) {
//     console.log("Error en deleteGenre", error);
//     await client.query("ROLLBACK");
//     throw error;
//   } finally {
//     client.release();
//   }
// }

async function getGenresMostSold() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `select name, sum(oi.quantity) as total_sold 
       from genres g join book_genres bg on g.id = bg.genre_id 
         join order_items oi on bg.book_id = oi.book_id 
       group by g.id, g.name 
       order by 2 desc 
       limit 5;`,
    );
    return result.rows.map((row) => {
      const genre = new GenreModel(row);
      genre.totalSold = row.total_sold;
      return genre;
    });
  } catch (error) {
    console.log("Error en getGenresMostSold", error);
    throw error;
  } finally {
    client.release();
  }
}

async function restoreGenre(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "UPDATE genres SET deleted_at = NULL, updated_at = NOW() WHERE id = $1 RETURNING *",
      [id],
    );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.log("Error en restoreGenre", error);
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
  getGenres,
  updateGenre,
  deleteGenre,
  getGenresMostSold,
  restoreGenre,
};
