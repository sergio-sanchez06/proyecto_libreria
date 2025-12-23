import express from "express";
import bookController from "../controllers/bookController.mjs";

const router = express.Router();

router.post("/", bookController.createBook);
router.get("/updateCover", bookController.updateAllCovers);
router.get("/:id", bookController.getBookById);
router.get("/title/:title", bookController.getBookByTitle);
router.put("/:id", bookController.updateBook);
router.delete("/:id", bookController.deleteBook);
router.get("/", bookController.getAllBooks);
router.get("/features", bookController.getBookByFeatures);

export default router;
