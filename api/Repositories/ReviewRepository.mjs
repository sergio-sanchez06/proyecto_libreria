import ReviewModel from "../models/ReviewsModel.mjs";
import pool from "../config/database.mjs";

async function createReview(review) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO reviews (book_id, user_id, user_email, rating, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [
        review.book_id,
        review.user_id,
        review.user_email,
        review.rating,
        review.comment,
      ],
    );
    await client.query("COMMIT");
    return result.rows.map((review) => new ReviewModel(review));
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
    const result = await client.query("SELECT * FROM reviews WHERE id = $1", [
      id,
    ]);
    return new ReviewModel(result.rows[0]);
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}
async function getReviewByBookId(book_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM reviews WHERE book_id = $1 order by id desc",
      [book_id],
    );
    return result.rows.map((review) => new ReviewModel(review));
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

async function updateReview(review) {
  console.log("Id de la reseña: ", review.id);
  console.log("Rating: ", review.rating);
  console.log("Comment: ", review.comment);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE reviews 
       SET 
         rating = COALESCE($1, rating),
         comment = COALESCE($2, comment),
         updated_at = NOW()
       WHERE id = $3 
       RETURNING *`,
      [review.rating, review.comment, Number(review.id)],
    );
    await client.query("COMMIT");
    return result.rows.map((review) => new ReviewModel(review));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function deleteReview(id) {
  console.log("Id de la reseña desde el repo: ", id);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "DELETE FROM reviews WHERE id = $1 RETURNING *",
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

async function getAllReviews() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT r.*, b.title as book_title, b.cover_url as book_cover 
       FROM reviews r JOIN books b ON r.book_id = b.id
       order by r.id desc`,
    );
    return result.rows.map((review) => new ReviewModel(review));
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

async function getReviewsByUserId(user_id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT r.*, b.title as book_title, b.cover_url as book_cover 
       FROM reviews r JOIN books b ON r.book_id = b.id 
       WHERE r.user_id = $1
       order by r.id desc`,
      [user_id],
    );
    console.log("Fila cruda de la BD:", result.rows[0]);
    return result.rows.map((review) => new ReviewModel(review));
  } catch (error) {
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
  getReviewsByUserId,
};
