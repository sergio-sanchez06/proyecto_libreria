import express from "express";
import BookAuthorController from "../controllers/BookAuthorController.mjs";

const router = express.Router();

router.post("/", BookAuthorController.assignAuthorToBook);

<<<<<<< HEAD
router.get("/book/:bookId", BookAuthorController.getAuthorsByBook);
=======
router.get("/", BookAuthorController.getBookAuthors);

router.get("/book/title/:bookTitle", BookAuthorController.getAuthorsByBook);

router.get("/book/id/:bookId", BookAuthorController.getAuthorsByBookId);
>>>>>>> api

router.get("/author/:authorName", BookAuthorController.getBooksByAuthor);

router.delete("/:bookId/:authorId", BookAuthorController.removeAuthorFromBook);

<<<<<<< HEAD
export default router;
=======
router.get("/count", BookAuthorController.countBooksByAuthors);

router.get("/count/:authorId", BookAuthorController.countBooksByAuthor);

export default router;
>>>>>>> api
