import express from "express";
import authorController from "../controllers/authorController.mjs";
import upload from "../utils/upload.mjs";
import protectMiddleware from "../middlewares/protect.mjs";

const router = express.Router();

router.get("/showAllAuthors", authorController.getAuthors);
router.get("/:id", authorController.getAuthorById);
router.get(
  "/author/create",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  authorController.getCreateAuthor
);
router.post(
  "/author/create",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  upload.single("photo"),
  authorController.createAuthor
);
router.get(
  "/author/edit/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  authorController.getEditAuthor
);
router.post(
  "/author/update/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  upload.single("photo"),
  authorController.updateAuthor
);
router.post(
  "/author/delete/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  authorController.deleteAuthor
);

export default router;
