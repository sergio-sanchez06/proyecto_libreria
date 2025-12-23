import express from "express";
import AuthorController from "../controllers/AuthorController.mjs";
import uploadAuthorPhoto from "../middlewares/uploadMiddlewares.mjs";

const router = express.Router();

router.post("/", AuthorController.createAuthor);
router.get("/:id", AuthorController.getAuthorById);
router.get("/name/:name", AuthorController.getAuthorByName);
router.get("/country/:country", AuthorController.getAuthorByCountry);
router.get("/", AuthorController.getAllAuthors);
router.put("/:id", AuthorController.updateAuthor);
router.delete("/:id", AuthorController.deleteAuthor);

router.post(
  "/upload/:id",
  uploadAuthorPhoto.single("photo"),
  AuthorController.updatePhoto
);

export default router;
