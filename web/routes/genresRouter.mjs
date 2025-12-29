import express from "express";
import genresController from "../controllers/genresController.mjs";

const router = express.Router();

router.get("/", genresController.getGenres);
router.get("/:genreName", genresController.getGenreBooksByGenreName);

export default router;
