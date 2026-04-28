import express from "express";
import AuthorController from "../controllers/AuthorController.mjs";
import uploadImage from "../middlewares/uploadMiddlewares.mjs";
import AuthMiddleware from "../middlewares/AuthMiddleware.mjs";
import { validateBodyFields } from "../middlewares/validateBody.mjs";

const router = express.Router();

// Rutas publicas

router.get("/countries", AuthorController.getUniqueCountries);
router.get("/name/:name", AuthorController.getAuthorByName);
router.get("/country/:country", AuthorController.getAuthorByCountry);
router.get("/authors/mostSold", AuthorController.getAuthorsMostSold);
router.get("/:id", AuthorController.getAuthorById);
router.get("/", AuthorController.getAllAuthors);

// Rutas protegidas

router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  validateBodyFields(["name", "country"]),
  AuthorController.createAuthor,
);

router.put(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  validateBodyFields(["name", "country"]),
  AuthorController.updateAuthor,
);
router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  AuthorController.deleteAuthor,
);

router.post(
  "/upload/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  uploadImage.single("author_photo"),
  AuthorController.updatePhoto,
);

router.put(
  "/restore/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  AuthorController.restoreAuthor,
);

export default router;
