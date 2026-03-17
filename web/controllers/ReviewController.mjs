import apiClient, { getAuthenticatedClient } from "../utils/apiClient.mjs";

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
    const response = await client.get(`/review/book/${book_id}`);
    res.render("partials/reviewsTable", {
      reviews: response.data,
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
    const response = await client.get(`/review/user/${user_id}`);
    res.render("partials/reviewsTable", {
      reviews: response.data,
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
