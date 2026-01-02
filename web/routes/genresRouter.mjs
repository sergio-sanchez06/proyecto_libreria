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
  "/edit/:genreName",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  genresController.getEditGenre
);
router.post(
  "/update/:genreName",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  genresController.updateGenre
);
router.delete(
  "/:genreName",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  genresController.deleteGenre
);

export default router;
