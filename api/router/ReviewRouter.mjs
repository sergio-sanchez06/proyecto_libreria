import express from "express";
import ReviewController from "../controllers/ReviewController.mjs";
import ReviewModeration from "../middlewares/reviewModeration.mjs";
import AuthMiddleware from "../middlewares/AuthMiddleware.mjs";
import { validateBodyFields } from "../middlewares/validateBody.mjs";

const router = express.Router();

router.get("/all", ReviewController.getAllReviews);

router.get("/id/:id", ReviewController.getReviewById);

router.get("/book/:book_id", ReviewController.getReviewsByBookId);

router.get("/user/:user_id", ReviewController.getReviewsByUserId);

router.post(
  "/create",
  AuthMiddleware.authenticate,
  validateBodyFields(["book_id", "user_id", "user_email", "rating", "comment"]),
  ReviewModeration.checkAISightengine,
  ReviewController.createReview,
);

router.put(
  "/update/:id",
  AuthMiddleware.authenticate,
  validateBodyFields(["rating", "comment"]),
  ReviewModeration.checkAISightengine,
  ReviewController.updateReview,
);

router.delete(
  "/delete/:id",
  AuthMiddleware.authenticate,
  ReviewController.deleteReview,
);

router.delete(
  "/admin/delete/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  ReviewController.adminDeleteReview,
);

router.put(
  "/admin/update/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  ReviewModeration.checkAISightengine,
  ReviewController.adminUpdateReview,
);

export default router;
