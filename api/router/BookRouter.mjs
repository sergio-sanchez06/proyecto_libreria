import express from "express";
import bookController from "../controllers/BookController.mjs";

const router = express.Router();

router.post("/", bookController.createBook);
router.get("/updateCover", bookController.updateAllCovers);
router.get("/mostSold", bookController.getMostSoldBooks);
router.get("/carrusel", bookController.getBooksCarrusel);
router.get("/:id", bookController.getBookById);
router.get("/title/:title", bookController.getBookByTitle);
router.put("/:id", bookController.updateBook);
router.delete("/:id", bookController.deleteBook);
router.put("/restore/:id", bookController.restoreBook);
router.get("/features", bookController.getBookByFeatures);
router.get("/publisher/:id", bookController.getBooksByPublisherId);
router.get("/", bookController.getAllBooks);

export default router;
