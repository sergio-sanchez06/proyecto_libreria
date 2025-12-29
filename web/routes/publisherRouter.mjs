import express from "express";
import publisherController from "../controllers/PublisherController.mjs";
import BookController from "../controllers/BookController.mjs";
import upload from "../utils/upload.mjs";

const router = express.Router();

router.get(
  "/:id",
  publisherController.getPublisherById
  //   BookController.getBooksByPublisherId,
  //   publisherController.publisher
);

router.get("/edit/:id", publisherController.getPublisherEdit);
router.get("/publisher/create", publisherController.getPublisherCreateForm);
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
