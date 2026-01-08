import express from "express";
import PublisherController from "../controllers/PublisherController.mjs";
const router = express.Router();

router.post("/", PublisherController.createPublisher);
router.get("/mostSold", PublisherController.getPublishersMostSold);
router.get("/:id", PublisherController.getPublisherById);
router.get("/name/:name", PublisherController.getPublisherByName);
router.get("/country/:country", PublisherController.getPublisherByCountry);
router.get("/", PublisherController.getAllPublishers);
router.put("/:id", PublisherController.updatePublisher);
router.delete("/:id", PublisherController.deletePublisher);

export default router;
