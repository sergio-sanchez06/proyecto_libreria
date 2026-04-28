import express from "express";
import bookController from "../controllers/BookController.mjs";
import AuthMiddleware from "../middlewares/AuthMiddleware.mjs";
import { validateBodyFields } from "../middlewares/validateBody.mjs";

const router = express.Router();

// Rutas públicas
router.get("/features", bookController.getBookByFeatures);
router.get("/publisher/:id", bookController.getBooksByPublisherId);

router.get("/mostSold", bookController.getMostSoldBooks);
router.get("/carrusel", bookController.getBooksCarrusel);
router.get("/title/:title", bookController.getBookByTitle);
router.get("/updateCover", bookController.updateAllCovers);
router.get("/:id", bookController.getBookById);
router.get("/", bookController.getAllBooks);

// Rutas protegidas
router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  validateBodyFields([
    "title",
    "price",
    "stock",
    "language",
    "publisher_id",
    "pages",
    "language",
    "isbn",
    "synopsis",
  ]),
  bookController.createBook,
);
router.put(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  validateBodyFields([
    "title",
    "price",
    "stock",
    "language",
    "publisher_id",
    "pages",
    "language",
    "isbn",
    "synopsis",
  ]),
  bookController.updateBook,
);
router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  bookController.deleteBook,
);
router.put(
  "/restore/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  bookController.restoreBook,
);

export default router;
