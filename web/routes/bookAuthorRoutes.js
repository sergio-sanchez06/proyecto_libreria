// web/routes/bookAuthorRoutes.js
// Rutas para las relaciones libro-autor

import express from "express";
import webController from "../controllers/webController.mjs";

const router = express.Router();

// Vista de gestión de relaciones libro-autor (solo admin)
router.get(
  "/",
  webController.requireLogin,
  webController.checkRole("administrador"),
  (req, res) => {
    res.render("admin/book-author", {
      pageTitle: "Gestión Libro-Autor",
      user: req.session.user,
    });
  }
);

export default router;
