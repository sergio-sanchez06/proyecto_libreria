import ReviewRepository from "../Repositories/ReviewRepository.mjs";

async function createReview(req, res) {
  const { book_id, user_id, user_email, rating, comment } = req.body;

  console.log(user_id);
  console.log(book_id);
  console.log(rating);
  console.log(comment);
  console.log(user_email);

  if (!book_id || !rating || !comment) {
    return res.status(400).json({
      error: "Faltan campos obligatorios: book_id, rating y comment.",
    });
  }

  try {
    const newReview = await ReviewRepository.createReview({
      user_id,
      book_id,
      user_email,
      rating,
      comment,
    });

    res.status(201).json({
      message: "Reseña creada exitosamente.",
      review: newReview,
    });
  } catch (error) {
    console.error("Error al crear reseña:", error);
    if (error.code === "23505") {
      return res.status(409).json({
        error:
          "Ya has dejado una reseña para este libro. Intenta actualizarla.",
      });
    }
    res.status(500).json({
      error: "Error interno del servidor al crear la reseña.",
    });
  }
}

async function getReviewsByBookId(req, res) {
  const { book_id } = req.params;

  try {
    const reviews = await ReviewRepository.getReviewByBookId(book_id);
    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error al obtener reseñas por libro:", error);
    res.status(500).json({
      error: "Error interno del servidor al obtener las reseñas.",
    });
  }
}

async function deleteReview(req, res) {
  console.log("deleteReview Controller");

  const { id } = req.params;
  const userId = req.body.user_id;

  console.log("Id del usuario: ", userId);

  try {
    const review = await ReviewRepository.getReviewById(id);

    console.log("Se va eliminar esta review: ", review);

    if (!review) {
      return res.status(404).json({ error: "Reseña no encontrada." });
    }

    if (Number(review.user_id) !== Number(userId)) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar esta reseña." });
    }

    await ReviewRepository.deleteReview(id);
    res.status(200).json({ message: "Reseña eliminada exitosamente." });
  } catch (error) {
    console.error("Error al eliminar reseña:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al eliminar la reseña." });
  }
}
async function adminDeleteReview(req, res) {
  const id = req.params.id;
  console.log("Id de la reseña desde el repo: ", id);

  try {
    const review = await ReviewRepository.getReviewById(id);

    if (!review) {
      return res.status(404).json({ error: "Reseña no encontrada." });
    }

    await ReviewRepository.deleteReview(id);
    res.status(200).json({ message: "Reseña eliminada exitosamente." });
  } catch (error) {
    console.error("Error al eliminar reseña:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al eliminar la reseña." });
  }
}

async function getReviewById(req, res) {
  const { id } = req.params;

  try {
    const review = await ReviewRepository.getReviewById(id);
    res.status(200).json(review);
  } catch (error) {
    console.error("Error al obtener reseña:", error);
    res.status(500).json({
      error: "Error interno del servidor al obtener la reseña.",
    });
  }
}

async function updateReview(req, res) {
  const { id } = req.params;
  const { user_id, rating, comment } = req.body;

  if (!user_id || !rating || !comment) {
    return res.status(400).json({
      error: "Faltan campos obligatorios: user_id, rating y comment.",
    });
  }

  try {
    const review = await ReviewRepository.getReviewById(id);

    if (!review) {
      return res.status(404).json({ error: "Reseña no encontrada." });
    }

    if (Number(review.user_id) !== Number(user_id)) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para actualizar esta reseña." });
    }

    const updatedReview = await ReviewRepository.updateReview({
      id,
      rating,
      comment,
    });
    res.status(200).json({
      message: "Reseña actualizada exitosamente.",
      review: updatedReview,
    });
  } catch (error) {
    console.error("Error al actualizar reseña:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al actualizar la reseña." });
  }
}

async function getReviewsByUserId(req, res) {
  const { user_id } = req.params;

  try {
    const reviews = await ReviewRepository.getReviewsByUserId(user_id);
    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error al obtener reseñas por usuario:", error);
    res.status(500).json({
      error: "Error interno del servidor al obtener las reseñas.",
    });
  }
}

async function getAllReviews(req, res) {
  try {
    const reviews = await ReviewRepository.getAllReviews();
    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error al obtener reseñas:", error);
    res.status(500).json({
      error: "Error interno del servidor al obtener las reseñas.",
    });
  }
}

async function adminUpdateReview(req, res) {
  const { id } = req.params;
  const { rating, comment } = req.body;

  if (!rating || !comment) {
    return res.status(400).json({
      error: "Faltan campos obligatorios: rating y comment.",
    });
  }

  try {
    const review = await ReviewRepository.getReviewById(id);

    if (!review) {
      return res.status(404).json({ error: "Reseña no encontrada." });
    }

    const updatedReview = await ReviewRepository.updateReview({
      id,
      rating,
      comment,
    });
    res.status(200).json({
      message: "Reseña actualizada exitosamente.",
      review: updatedReview,
    });
  } catch (error) {
    console.error("Error al actualizar reseña:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al actualizar la reseña." });
  }
}

export default {
  createReview,
  getReviewsByBookId,
  deleteReview,
  getReviewById,
  updateReview,
  getReviewsByUserId,
  getAllReviews,
  adminDeleteReview,
  adminUpdateReview,
};
