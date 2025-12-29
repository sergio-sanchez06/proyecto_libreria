// web/routes/authorRoutes.js
// Rutas para las vistas de autores

const express = require("express");
const router = express.Router();

// Vista principal de autores
router.get("/", (req, res) => {
  res.render("authors/list", {
    pageTitle: "Autores",
    user: req.session.user,
  });
});

// Vista de detalle de autor
router.get("/:id", (req, res) => {
  res.render("authors/detail", {
    pageTitle: "Detalle de Autor",
    user: req.session.user,
    authorId: req.params.id,
  });
});

module.exports = router;
