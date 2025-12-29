// web/routes/bookAuthorRoutes.js
// Rutas para las relaciones libro-autor

const express = require("express");
const router = express.Router();
const webController = require("../controllers/webController");

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

module.exports = router;
