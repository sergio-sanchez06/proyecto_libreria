import express from "express";
import BookController from "../controllers/BookController.mjs";
import upload from "../utils/upload.mjs";

const router = express.Router();

router.get("/", BookController.getAllBooks);
router.get("/showAllBooks", BookController.showAllBooks);
router.get("/book/:id", BookController.getBookById);

router.get("/edit/:id", BookController.getEditBook);
router.post("/update/:id", upload.single("cover"), BookController.updateBook);

router.get("/create", BookController.getCreateBook);
router.post("/create", upload.single("cover"), BookController.createBook);

router.post("/delete/:id", BookController.deleteBook);

export default router;
