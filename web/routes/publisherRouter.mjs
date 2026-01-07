import express from "express";
import publisherController from "../controllers/PublisherController.mjs";
import upload from "../utils/upload.mjs";
import protectMiddleware from "../middlewares/protect.mjs";

const router = express.Router();

router.get("/showAllPublishers", publisherController.showAllPublishers);
router.get(
  "/edit/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  publisherController.getPublisherEdit
);
router.get(
  "/create",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  publisherController.getPublisherCreateForm
);
router.get("/:id", publisherController.getPublisherById);
router.post(
  "/create",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  upload.single("publisher_logo"),
  publisherController.createPublisher
);
router.post(
  "/update/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  upload.single("publisher_logo"),
  publisherController.updatePublisher
);
router.post(
  "/delete/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  publisherController.deletePublisher
);

export default router;
