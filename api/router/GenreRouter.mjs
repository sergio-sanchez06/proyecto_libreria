// api/routes/genreRouter.mjs

import GenreController from "../controllers/GenreController.mjs";
import express from "express";
import AuthMiddleware from "../middlewares/AuthMiddleware.mjs";
import { validateBodyFields } from "../middlewares/validateBody.mjs";

const router = express.Router();

// Rutas públicas

router.get("/all", GenreController.getGenres);
router.get("/mostSold", GenreController.getGenresMostSold);
router.get("/name/:name", GenreController.getGenreByName);
router.get("/country/:country", GenreController.getGenreByCountry);

router.get("/paginated", GenreController.getAllGenres);
router.get("/", GenreController.getAllGenres);

router.get("/:id", GenreController.getGenreById);

// Rutas protegidas

router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  validateBodyFields(["name"]),
  GenreController.createGenre,
);

router.put(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  validateBodyFields(["name"]),
  GenreController.updateGenre,
);

router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  GenreController.deleteGenre,
);

export default router;
