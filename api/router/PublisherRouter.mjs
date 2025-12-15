import express from "express";

const router = express.Router();

router.post("/", createPublisher);
router.get("/:id", getPublisherById);
router.get("/name/:name", getPublisherByName);
router.get("/country/:country", getPublisherByCountry);
router.get("/", getAllPublishers);
router.put("/:id", updatePublisher);
router.delete("/:id", deletePublisher);

export default router;
