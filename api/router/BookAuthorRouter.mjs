import express from "express";
import BookAuthorController from "../controllers/BookAuthorController.mjs";
import AuthMiddleware from "../middlewares/AuthMiddleware.mjs";
import { validateBodyFields } from "../middlewares/validateBody.mjs";

const router = express.Router();

router.get("/", BookAuthorController.getBookAuthors);

router.get("/book/title/:bookTitle", BookAuthorController.getAuthorsByBook);

router.get("/book/id/:bookId", BookAuthorController.getAuthorsByBookId);

router.get("/author/:authorName", BookAuthorController.getBooksByAuthor);

router.get("/count", BookAuthorController.countBooksByAuthors);

router.get("/count/:authorId", BookAuthorController.countBooksByAuthor);

router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  validateBodyFields(["book_id", "author_id"]),
  BookAuthorController.assignAuthorToBook,
);

router.delete(
  "/:bookId/:authorId",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  BookAuthorController.removeAuthorFromBook,
);

export default router;
