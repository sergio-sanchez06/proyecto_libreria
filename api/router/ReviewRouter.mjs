import express from "express";
import ReviewController from "../controllers/ReviewController.mjs";

const router = express.Router();

router.post("/create", ReviewController.createReview);

router.get("/id/:id", ReviewController.getReviewById);

router.get("/book/:book_id", ReviewController.getReviewsByBookId);

router.delete("/delete/:id", ReviewController.deleteReview);

router.delete("/admin/delete/:id", ReviewController.adminDeleteReview);

router.put("/admin/update/:id", ReviewController.adminUpdateReview);

router.put("/update/:id", ReviewController.updateReview);

router.get("/user/:user_id", ReviewController.getReviewsByUserId);

router.get("/all", ReviewController.getAllReviews);

export default router;
