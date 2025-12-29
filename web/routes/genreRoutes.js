// web/routes/genreRoutes.js
// Rutas para las vistas de géneros

const express = require("express");
const router = express.Router();

// Vista principal de géneros (usa genero.ejs)
router.get("/", (req, res) => {
  res.render("genero", {
    pageTitle: "Géneros Literarios",
    user: req.session.user,
  });
});

module.exports = router;
