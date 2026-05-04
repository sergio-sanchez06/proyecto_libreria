import express from "express";
import UserFavoriteGenresController from "../controllers/UserFavoriteGenresController.mjs";
import AuthMiddleware from "../middlewares/AuthMiddleware.mjs";

const router = express.Router();

// Obtener géneros favoritos de un usuario
router.get(
  "/:userId",
  AuthMiddleware.authenticate,
  UserFavoriteGenresController.getFavoriteGenres,
);

// Sincronizar (reemplazar) todos los géneros favoritos
router.post(
  "/:userId",
  AuthMiddleware.authenticate,
  UserFavoriteGenresController.syncFavoriteGenres,
);

// Eliminar un género favorito concreto
router.delete(
  "/:userId/:genreId",
  AuthMiddleware.authenticate,
  UserFavoriteGenresController.removeFavoriteGenre,
);

export default router;
