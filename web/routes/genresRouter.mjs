import express from "express";
import genresController from "../controllers/genresController.mjs";

const router = express.Router();

router.get("/", genresController.getGenres);
router.get("/:genreName", genresController.getGenreBooksByGenreName);
router.get("/genre/create", genresController.getCreateGenre);
router.post("/genre/create", genresController.createGenre);
router.get("/genre/edit/:genreName", genresController.getEditGenre);
router.post("/genre/update/:genreName", genresController.updateGenre);
router.delete("/genre/:genreName", genresController.deleteGenre);

export default router;
