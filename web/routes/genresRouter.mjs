import express from "express";
import genresController from "../controllers/genresController.mjs";
import protectMiddleware from "../middlewares/protect.mjs";

const router = express.Router();

router.get(
  "/create",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  genresController.getCreateGenre
);
router.post(
  "/create",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  genresController.createGenre
);
router.get("/", genresController.getGenres);
router.get("/:genreName", genresController.getGenreBooksByGenreName);
router.get(
  "/edit/:genreId",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  genresController.getEditGenre
);
router.post(
  "/update/:genreId",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  genresController.updateGenre
);
router.post(
  "/delete/:genreId",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  genresController.deleteGenre
);

export default router;
