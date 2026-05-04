import pool from "../config/database.mjs";
import UserFavoriteGenre from "../models/UserFavoriteGenreModel.mjs";

async function getAllFavoriteGenresByUserId(userId, externalClient = null) {
  let client = null;
  try {
    client = externalClient ?? (await pool.connect());

    const query = `

        Select g.id as genre_id, g.name as genre_name
        from genres g 
        inner join user_favorite_genres ufg
        on g.id = ufg.genre_id
        where ufg.user_id = $1
        order by g.name;
        `;

    const result = await client.query(query, [userId]);
    return result.rows.map((row) => new UserFavoriteGenre(row));
  } catch (error) {
    throw error;
  } finally {
    if (client && !externalClient) {
      client.release();
    }
  }
}

async function saveFavoriteGenre(userId, genreId) {
  let client = null;
  try {
    client = await pool.connect();

    await client.query("BEGIN");

    const query = `
        INSERT INTO user_favorite_genres (user_id, genre_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, genre_id) DO NOTHING;
        `;

    await client.query(query, [userId, genreId]);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function deleteFavoriteGenre(genreId, userId) {
  let client = null;
  try {
    client = await pool.connect();

    await client.query("BEGIN");

    const query = `
        DELETE FROM user_favorite_genres 
        WHERE genre_id = $1 AND user_id = $2;
        `;

    await client.query(query, [genreId, userId]);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function syncFavoriteGenres(userId, genreIds) {
  let client = null;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // 1. Borrar todos los actuales
    await client.query("DELETE FROM user_favorite_genres WHERE user_id = $1", [
      userId,
    ]);

    // 2. Insertar los nuevos si hay alguno
    if (genreIds.length > 0) {
      const placeholders = genreIds.map((_, i) => `($1, $${i + 2})`).join(", ");
      await client.query(
        `INSERT INTO user_favorite_genres (user_id, genre_id) VALUES ${placeholders}`,
        [userId, ...genreIds],
      );
    }

    await client.query("COMMIT");
    return await getAllFavoriteGenresByUserId(userId, client);
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    throw error;
  } finally {
    if (client) client.release();
  }
}

export default {
  getAllFavoriteGenresByUserId,
  saveFavoriteGenre,
  deleteFavoriteGenre,
  syncFavoriteGenres,
};
