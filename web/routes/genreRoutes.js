// web/routes/genreRoutes.js
// Rutas para las vistas de géneros

import express from "express";

const router = express.Router();

// Vista principal de géneros (usa genero.ejs)
router.get("/", (req, res) => {
  res.render("genero", {
    pageTitle: "Géneros Literarios",
    user: req.session.user,
  });
});

export default router;
