import express from "express";
import authorController from "../controllers/authorController.mjs";
import upload from "../utils/upload.mjs";

const router = express.Router();

router.get("/:id", authorController.getAuthorById);
router.get("/edit/:id", authorController.getEditAuthor);
router.post(
  "/create",
  upload.single("author_photo"),
  authorController.createAuthor
);
router.post(
  "/update/:id",
  upload.single("author_photo"),
  authorController.updateAuthor
);
router.delete("/:id", authorController.deleteAuthor);

export default router;
