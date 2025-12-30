// web/routes/authorRoutes.js
// Rutas para las vistas de autores

import express from "express";

const router = express.Router();

// Vista principal de autores (usa autor.ejs)
router.get("/", (req, res) => {
  res.render("autor", {
    pageTitle: "Autores",
    user: req.session.user,
  });
});

export default router;
