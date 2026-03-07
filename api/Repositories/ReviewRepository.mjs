import ReviewModel from "../models/ReviewsModel.mjs";
import pool from "../config/database.mjs";

async function createReview(review) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO reviews (book_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *",
      [review.book_id, review.user_id, review.rating, review.comment]
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

async function getReviewById(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM reviews WHERE id = $1", [
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
async function getReviewByBookId(book_id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "SELECT * FROM reviews WHERE book_id = $1",
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

async function updateReview(review) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE reviews 
       SET 
         book_id = COALESCE($1, book_id),
         user_id = COALESCE($2, user_id),
         rating = COALESCE($3, rating),
         comment = COALESCE($4, comment),
         updated_at = NOW()
       WHERE id = $5 
       RETURNING *`,
      [review.book_id, review.user_id, review.rating, review.comment, review.id]
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

async function deleteReview(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "DELETE FROM reviews WHERE id = $1 RETURNING *",
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

async function getAllReviews() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM reviews");
    await client.query("COMMIT");
    return result.rows.map((publisher) => new PublisherModel(publisher));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getReviewByUserId(user_id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "SELECT * FROM reviews WHERE user_id = $1",
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
  createReview,
  getReviewById,
  getReviewByBookId,
  updateReview,
  deleteReview,
  getAllReviews,
  getReviewByUserId,
};
