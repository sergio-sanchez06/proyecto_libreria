import express from "express";

const router = express.Router();

router.post("/", createAuthor);
router.get("/:id", getAuthorById);
router.get("/name/:name", getAuthorByName);
router.get("/country/:country", getAuthorByCountry);
router.get("/", getAllAuthors);
router.put("/:id", updateAuthor);
router.delete("/:id", deleteAuthor);

export default router;
