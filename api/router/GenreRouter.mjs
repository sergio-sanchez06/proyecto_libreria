import GenreController from "../controllers/GenreController.mjs";
import express from "express";
import AuthMiddleware from "../middlewares/AuthMiddleware.mjs";
const router = express.Router();
router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  GenreController.createGenre
);
router.get("/:id", GenreController.getGenreById);
router.get("/name/:name", GenreController.getGenreByName);
router.get("/country/:country", GenreController.getGenreByCountry);
router.get("/", GenreController.getAllGenres);
router.put("/:id", GenreController.updateGenre);
router.delete("/:id", GenreController.deleteGenre);
export default router;
