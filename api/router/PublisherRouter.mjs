import express from "express";
import PublisherController from "../controllers/PublisherController.mjs";
const router = express.Router();

// --- RUTAS DE LISTADO ---
router.get("/all", PublisherController.getPublishers);
router.get("/allPublishers", PublisherController.getPublishers);

// ---  RUTAS DE CATÁLOGO  ---
router.get("/paginated", PublisherController.getAllPublishers);
router.get("/", PublisherController.getAllPublishers);

// --- RUTAS DE CONSULTA Y FILTROS ---
router.get("/mostSold", PublisherController.getPublishersMostSold);
router.get("/name/:name", PublisherController.getPublisherByName);
router.get("/country/:country", PublisherController.getPublisherByCountry);
router.get("/:id", PublisherController.getPublisherById);

// --- RUTAS DE ESCRITURA (POST, PUT, DELETE) ---
router.post("/", PublisherController.createPublisher);
router.put("/restore/:id", PublisherController.restorePublisher);
router.put("/:id", PublisherController.updatePublisher);
router.delete("/:id", PublisherController.deletePublisher);

export default router;
