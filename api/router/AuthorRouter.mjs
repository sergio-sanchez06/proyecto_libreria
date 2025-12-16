import express from "express";
import AuthorController from "../controllers/AuthorController.mjs";

const router = express.Router();

router.post("/", AuthorController.createAuthor);
router.get("/:id", AuthorController.getAuthorById);
router.get("/name/:name", AuthorController.getAuthorByName);
router.get("/country/:country", AuthorController.getAuthorByCountry);
router.get("/", AuthorController.getAllAuthors);
router.put("/:id", AuthorController.updateAuthor);
router.delete("/:id", AuthorController.deleteAuthor);

export default router;
