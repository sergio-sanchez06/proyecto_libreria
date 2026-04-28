import express from "express";
import publisherController from "../controllers/PublisherController.mjs";
import upload from "../utils/upload.mjs";
import protectMiddleware from "../middlewares/protect.mjs";

import { validateSchema } from "../middlewares/validator.mjs";
import { publisherSchema } from "../schemas/publisherSchema.mjs";

const router = express.Router();

router.get("/showAllPublishers", publisherController.showAllPublishers);
router.get(
  "/manage/list",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  publisherController.getManagePublishers,
);
router.get(
  "/edit/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  publisherController.getPublisherEdit,
);
router.get(
  "/create",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  publisherController.getPublisherCreateForm,
);
router.get("/:id", publisherController.getPublisherById);
router.post(
  "/create",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  upload.single("publisher_logo"),
  protectMiddleware.requireFreshToken,
  (req, res, next) => {
    req.viewToRender = "admin/add_publisher";
    req.entityName = "publisherData";
    next();
  },
  validateSchema(publisherSchema),
  publisherController.createPublisher,
);
router.post(
  "/update/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  upload.single("publisher_logo"),
  protectMiddleware.requireFreshToken,
  (req, res, next) => {
    req.viewToRender = "admin/add_publisher";
    req.entityName = "publisherData";
    next();
  },
  validateSchema(publisherSchema),
  publisherController.updatePublisher,
);
router.post(
  "/delete/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  protectMiddleware.requireFreshToken,
  publisherController.deletePublisher,
);

router.post(
  "/restore/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  protectMiddleware.requireFreshToken,
  publisherController.restorePublisher,
);

export default router;
