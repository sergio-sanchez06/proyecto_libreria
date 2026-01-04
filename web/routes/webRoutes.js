import express from "express";
import webController from "../controllers/webController.mjs";

const router = express.Router();

router.get("/", webController.showAllLibros);

router.get("/login", webController.showLoginForm);

router.get(
  "/admin",
  webController.requireLogin, // Primero: Asegura que el usuario esté logueado
  webController.checkRole("administrador"), // Segundo: Asegura que el rol sea 'administrador'
  webController.showAdminPanel
);

export default router;
