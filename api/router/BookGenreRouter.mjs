import express from "express";
import BookGenreController from "../controllers/BookGenreController.mjs";

const router = express.Router();

router.post("/", BookGenreController.addGenreToBook);

router.get("/book/:bookId", BookGenreController.getGenresByBook);

router.get("/genre/:genreId", BookGenreController.getBooksByGenre);

router.delete("/:bookId/:genreId", BookGenreController.removeGenreFromBook);

export default router;