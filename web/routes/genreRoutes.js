// web/routes/genreRoutes.js
// Rutas para las vistas de géneros

const express = require("express");
const router = express.Router();

// Vista principal de géneros
router.get("/", (req, res) => {
  res.render("genres/list", {
    pageTitle: "Géneros Literarios",
    user: req.session.user,
  });
});

// Vista de libros por género
router.get("/:id", (req, res) => {
  res.render("genres/books", {
    pageTitle: "Libros por Género",
    user: req.session.user,
    genreId: req.params.id,
  });
});

module.exports = router;
