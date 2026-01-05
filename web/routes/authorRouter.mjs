import express from "express";
import authorController from "../controllers/authorController.mjs";
import upload from "../utils/upload.mjs";

const router = express.Router();

router.get("/showAllAuthors", authorController.getAuthors);
router.get("/:id", authorController.getAuthorById);
router.get("/author/create", authorController.getCreateAuthor);
router.post(
  "/author/create",
  upload.single("photo"),
  authorController.createAuthor
);
router.get("/author/edit/:id", authorController.getEditAuthor);
router.post(
  "/author/update/:id",
  upload.single("author_photo"),
  authorController.updateAuthor
);
router.post(
  "/author/update/:id",
  upload.single("author_photo"),
  authorController.updateAuthor
);
router.delete("/:id", authorController.deleteAuthor);

export default router;
