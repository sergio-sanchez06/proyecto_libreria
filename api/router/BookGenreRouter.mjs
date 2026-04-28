import express from "express";
import BookGenreController from "../controllers/BookGenreController.mjs";
import AuthMiddleware from "../middlewares/AuthMiddleware.mjs";
import { validateBodyFields } from "../middlewares/validateBody.mjs";

const router = express.Router();

router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  validateBodyFields(["book_id", "genre_id"]),
  BookGenreController.addGenreToBook,
);

router.delete(
  "/:bookId/:genreId",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  BookGenreController.removeGenreFromBook,
);

router.get("/genre/:genreName", BookGenreController.getBooksGenresByGenre);

router.get("/book/:bookId", BookGenreController.getBookGenresByBook);

export default router;
