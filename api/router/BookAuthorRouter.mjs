import express from "express";
import BookAuthorController from "../controllers/BookAuthorController.mjs";

const router = express.Router();

router.post("/", BookAuthorController.assignAuthorToBook);

router.get("/book/title/:bookTitle", BookAuthorController.getAuthorsByBook);

router.get("/book/id/:bookId", BookAuthorController.getAuthorsByBookId);

router.get("/author/:authorName", BookAuthorController.getBooksByAuthor);

router.delete("/:bookId/:authorId", BookAuthorController.removeAuthorFromBook);

router.get("/count", BookAuthorController.countBooksByAuthors);

router.get("/count/:authorId", BookAuthorController.countBooksByAuthor);

export default router;
