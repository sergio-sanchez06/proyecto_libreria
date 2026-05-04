import apiClient, { getAuthenticatedClient } from "../utils/apiClient.mjs";

async function createReview(req, res) {
  const origin = "/books/book/" + req.body.book_id;

  const { book_id, rating, comment } = req.body;

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();

    const api = getAuthenticatedClient(cleanToken);

    const response = await api.post("/review/create", {
      book_id,
      user_id: req.session.user.id,
      user_email: req.session.user.email,
      rating,
      comment,
    });

    req.session.flash = {
      type: "success",
      message: "Reseña publicada correctamente.",
    };
    res.redirect(origin);
  } catch (error) {
    console.error("Error al crear reseña:", error);
    // Error: Guardamos el mensaje de la API (ej. "Comentario demasiado corto") en el flash
    req.session.flash = {
      type: "error",
      message:
        error.response?.data?.message ||
        "No se pudo publicar la reseña. Verifica los datos.",
    };

    // Importante: No enviamos JSON, redirigimos al origen para que el layout muestre el modal
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
    res.status(500).render("error", {
      message: "Error al cargar las reseñas de este libro.",
    });
  }
}

async function deleteReview(req, res) {
  const origin = "/books/book/" + req.body.book_id;
  const { book_id } = req.body;

  console.log("book_id", book_id);

  const { id } = req.params;

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const client = getAuthenticatedClient(cleanToken);

    const response = await client.delete(`/review/delete/${id}`, {
      data: {
        user_id: req.session.user.id,
      },
    });

    req.session.flash = {
      type: "success",
      message: "Reseña eliminada correctamente.",
    };
    res.redirect(origin);
  } catch (error) {
    console.error("Error al eliminar reseña:", error);
    req.session.flash = {
      type: "error",
      message:
        error.response?.data?.message ||
        "No tienes permiso para eliminar esta reseña.",
    };
    res.redirect(origin);
  }
}

async function updateReview(req, res) {
  const origin = "/books/book/" + req.body.book_id;
  const { id } = req.params;
  const { book_id, rating, comment } = req.body;

  try {
    const cleanToken = req.session.idToken.replace("Bearer ", "").trim();
    const client = getAuthenticatedClient(cleanToken);

    const response = await client.put(`/review/update/${id}`, {
      book_id,
      user_id: req.session.user.id,
      rating,
      comment,
    });
    req.session.flash = {
      type: "success",
      message: "Reseña actualizada.",
    };
    res.redirect(origin);
    // res.redirect(`/books/book/${book_id}`);
  } catch (error) {
    console.error("Error al actualizar reseña:", error);
    req.session.flash = {
      type: "error",
      message: error.response?.data?.message || "Error al editar la reseña.",
    };
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
    res
      .status(500)
      .render("error", { message: "Error al obtener sus reseñas publicadas." });
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
    res
      .status(500)
      .render("error", { message: "Error al obtener todas las reseñas." });
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
