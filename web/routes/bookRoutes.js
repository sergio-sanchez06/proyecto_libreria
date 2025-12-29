// web/routes/bookRoutes.js
// Rutas para las vistas de libros

const express = require("express");
const router = express.Router();

// Vista principal de libros
router.get("/", (req, res) => {
  res.redirect("/");
});

// Vista de detalle de libro
router.get("/:id", (req, res) => {
  res.render("libro_detalle", {
    pageTitle: "Detalle de Libro",
    user: req.session.user,
    bookId: req.params.id,
  });
});

module.exports = router;
