import express from "express";
import ReviewController from "../controllers/ReviewController.mjs";

const router = express.Router();

router.post("/", ReviewController.createReview);

router.get("/book/:book_id", ReviewController.getReviewsByBookId);

router.delete("/:id", ReviewController.deleteReview);

export default router;
