import express from "express";
import bookController from "../controllers/BookController.mjs";

const router = express.Router();

router.post("/", bookController.createBook);
router.get("/updateCover", bookController.updateAllCovers);
router.get("/:id", bookController.getBookById);
router.get("/title/:title", bookController.getBookByTitle);
router.put("/:id", bookController.updateBook);
router.delete("/:id", bookController.deleteBook);
router.get("/", bookController.getAllBooks);
router.get("/features", bookController.getBookByFeatures);
router.get("/publisher/:id", bookController.getBooksByPublisherId);

export default router;
