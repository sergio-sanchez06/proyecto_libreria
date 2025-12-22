import express from "express";
import BookAuthorController from "../controllers/BookAuthorController.mjs";

const router = express.Router();

router.post("/", BookAuthorController.assignAuthorToBook);

router.get("/book/:bookTitle", BookAuthorController.getAuthorsByBook);

router.get("/author/:authorName", BookAuthorController.getBooksByAuthor);

router.delete("/:bookId/:authorId", BookAuthorController.removeAuthorFromBook);

export default router;
