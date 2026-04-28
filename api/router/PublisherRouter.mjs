import express from "express";
import PublisherController from "../controllers/PublisherController.mjs";
import AuthMiddleware from "../middlewares/AuthMiddleware.mjs";
import { validateBodyFields } from "../middlewares/validateBody.mjs";

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
router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  validateBodyFields(["name", "country", "website", "descripcion"]),
  PublisherController.createPublisher,
);
router.put(
  "/restore/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  PublisherController.restorePublisher,
);
router.put(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  validateBodyFields(["name", "country", "website", "descripcion"]),
  PublisherController.updatePublisher,
);
router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  PublisherController.deletePublisher,
);

export default router;
