// web/routes/userRoutes.js
// Rutas para vistas de usuario

import express from "express";
import webController from "../controllers/webController.mjs";

const router = express.Router();

// Vista de perfil
router.get(
  "/perfil",
  webController.requireLogin,
  webController.showUserProfile
);

// Vista de historial de compras
router.get(
  "/historial",
  webController.requireLogin,
  webController.showSalesHistory
);

export default router;
