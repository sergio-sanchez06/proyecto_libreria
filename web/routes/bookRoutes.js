// web/routes/bookRoutes.js
// Rutas para las vistas de libros

import express from "express";
import webController from "../controllers/webController.mjs";

const router = express.Router();

// Vista principal de libros (Si quieres que /books redirija a la home o liste libros)
router.get("/", (req, res) => {
  res.redirect("/");
});

// Vista de detalle de libro
router.get("/:id", webController.showLibroDetail);

export default router;
