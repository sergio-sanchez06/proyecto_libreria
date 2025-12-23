import express from "express";
import BookController from "../controllers/BookController.mjs";

const router = express.Router();

router.get("/", BookController.getIndex);
router.get("/libro/:id", BookController.getLibroDetail);

export default router;