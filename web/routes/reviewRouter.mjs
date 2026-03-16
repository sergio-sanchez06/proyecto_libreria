import express from "express";
import ReviewController from "../controllers/ReviewController.mjs";
import authMiddleware from "../middlewares/protect.mjs";

const router = express.Router();

router.post("/create", authMiddleware.protect, ReviewController.createReview);

router.get("/book/:book_id", ReviewController.getReviewsByBookId);

router.post(
  "/delete/:id",
  authMiddleware.protect,
  ReviewController.deleteReview,
);

router.post(
  "/update/:id",
  authMiddleware.protect,
  ReviewController.updateReview,
);

router.get(
  "/user/:user_id",
  authMiddleware.protect,
  ReviewController.getReviewsByUserId,
);

router.get("/all", ReviewController.getAllReviews);

export default router;
