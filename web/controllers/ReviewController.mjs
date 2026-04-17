import apiClient, { getAuthenticatedClient } from "../utils/apiClient.mjs";
import redis from "../controllers/RedisController.mjs";

async function createReview(req, res) {
  const origin = req.headers.referer || "/";

  const { book_id, rating, comment } = req.body;

  const cleanToken = req.session.idToken.replace("Bearer ", "").trim();

  const api = getAuthenticatedClient(cleanToken);

  try {
    const response = await api.post("/review/create", {
      book_id,
      user_id: req.session.user.id,
      user_email: req.session.user.email,
      rating,
      comment,
    });
    res.redirect(origin);
  } catch (error) {
    console.error("Error al crear reseña:", error);
    res.redirect(origin);
  }
}

async function getReviewsByBookId(req, res) {
  const { book_id } = req.params;
  const client = getAuthenticatedClient(req, res);

  try {

    var reviewById = null
    const redisClient = redis.returnRedisClient()
    const redisData = await redisClient.get("ReviewById")
    console.log(redisData)
    if(redisData){
      reviewById = JSON.parse(redisData)
    }else{
      const response = await apiClient.get(`/review/book/${book_id}`);
      reviewById = response.data;
      await redisClient.set("ReviewById", JSON.stringify(reviewById))
      
    }

    res.render("partials/reviewsTable", {
      reviews: reviewById,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error al obtener reseñas:", error);
    res.status(500).send("Error al obtener las reseñas");
  }
}

async function deleteReview(req, res) {
  const origin = req.headers.referer || "/";
  const { book_id } = req.body;

  console.log("book_id", book_id);

  const { id } = req.params;
  const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
  const client = getAuthenticatedClient(cleanToken);

  try {
    const response = await client.delete(`/review/delete/${id}`, {
      data: {
        user_id: req.session.user.id,
      },
    });
    res.redirect(origin);
  } catch (error) {
    console.error("Error al eliminar reseña:", error);
    res.redirect(origin);
  }
}

async function updateReview(req, res) {
  const origin = req.headers.referer || "/";
  const { id } = req.params;
  const { book_id, rating, comment } = req.body;
  const client = getAuthenticatedClient(req, res);

  try {
    const response = await client.put(`/review/update/${id}`, {
      book_id,
      user_id: req.session.user.id,
      rating,
      comment,
    });
    res.redirect(origin);
    // res.redirect(`/books/book/${book_id}`);
  } catch (error) {
    console.error("Error al actualizar reseña:", error);
    res.redirect(origin);
    // res.redirect(`/books/book/${book_id}`);
  }
}

async function getReviewsByUserId(req, res) {
  const { user_id } = req.params;
  const client = getAuthenticatedClient(req, res);

  try {

    var userReviews = null
    const redisClient = redis.returnRedisClient()
    const redisData = await redisClient.get(`UserReviews${user_id}`)
    if(redisData){
      userReviews = JSON.parse(redisData)
    }else{
      const response = await api.get(`/review/user/${user_id}`);
      userReviews = response.data;
      await redisClient.set(`UserReviews${user_id}`, JSON.stringify(userReviews))
      
    }

    res.render("partials/reviewsTable", {
      reviews: userReviews,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error al obtener reseñas:", error);
    res.status(500).send("Error al obtener las reseñas");
  }
}

async function getAllReviews(req, res) {
  const client = getAuthenticatedClient(req, res);

  try {
    const response = await client.get("/review/all");
    res.render("partials/reviewsTable", {
      reviews: response.data,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error al obtener reseñas:", error);
    res.status(500).send("Error al obtener las reseñas");
  }
}

export default {
  createReview,
  getReviewsByBookId,
  deleteReview,
  updateReview,
  getReviewsByUserId,
  getAllReviews,
};
