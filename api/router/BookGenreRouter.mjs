import express from "express";
import BookGenreController from "../controllers/BookGenreController.mjs";

const router = express.Router();

router.post("/", BookGenreController.addGenreToBook);

router.get("/genre/:genreName", BookGenreController.getBooksGenresByGenre);

router.get("/book/:bookId", BookGenreController.getBookGenresByBook);

router.delete("/:bookId/:genreId", BookGenreController.removeGenreFromBook);

export default router;
