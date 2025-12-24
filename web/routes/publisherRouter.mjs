import express from "express";
import publisherController from "../controllers/PublisherController.mjs";

const router = express.Router();

router.get("/:id", publisherController.getPublisherById);

export default router;
