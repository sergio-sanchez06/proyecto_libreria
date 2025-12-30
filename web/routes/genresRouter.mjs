import express from "express";
import genresController from "../controllers/genresController.mjs";

const router = express.Router();

router.get("/create", genresController.getCreateGenre);
router.post("/create", genresController.createGenre);
router.get("/", genresController.getGenres);
router.get("/:genreName", genresController.getGenreBooksByGenreName);
router.get("/edit/:genreName", genresController.getEditGenre);
router.post("/update/:genreName", genresController.updateGenre);
router.delete("/:genreName", genresController.deleteGenre);

export default router;
