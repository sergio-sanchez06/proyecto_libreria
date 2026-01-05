import express from "express";
import publisherController from "../controllers/PublisherController.mjs";
import upload from "../utils/upload.mjs";

const router = express.Router();

router.get("/showAllPublishers", publisherController.showAllPublishers);
router.get("/edit/:id", publisherController.getPublisherEdit);
router.get("/create", publisherController.getPublisherCreateForm);
router.get("/:id", publisherController.getPublisherById);
router.post(
  "/create",
  upload.single("photo"),
  publisherController.createPublisher
);
router.post(
  "/update/:id",
  upload.single("photo"),
  publisherController.updatePublisher
);
router.post("/delete/:id", publisherController.deletePublisher);

export default router;
