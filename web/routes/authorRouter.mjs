import express from "express";
import authorController from "../controllers/authorController.mjs";
import upload from "../utils/upload.mjs";
import protectMiddleware from "../middlewares/protect.mjs";
import { validateSchema } from "../middlewares/validator.mjs";
import { authorSchema } from "../schemas/authorSchema.mjs";

const router = express.Router();

router.get("/showAllAuthors", authorController.getAuthors);
router.get(
  "/manage/list",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  authorController.getManageAuthors,
);
router.get("/:id", authorController.getAuthorById);
router.get(
  "/author/create",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  authorController.getCreateAuthor,
);
router.post(
  "/author/create",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  upload.single("photo"),
  protectMiddleware.requireFreshToken,
  validateSchema(authorSchema),
  authorController.createAuthor,
);
router.get(
  "/author/edit/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  authorController.getEditAuthor,
);
router.post(
  "/author/update/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  upload.single("photo"),
  protectMiddleware.requireFreshToken,
  validateSchema(authorSchema),
  authorController.updateAuthor,
);
router.post(
  "/author/delete/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  protectMiddleware.requireFreshToken,
  authorController.deleteAuthor,
);

router.post(
  "/author/restore/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  protectMiddleware.requireFreshToken,
  authorController.restoreAuthor,
);

export default router;
