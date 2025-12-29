// web/routes/authorRoutes.js
// Rutas para las vistas de autores

const express = require("express");
const router = express.Router();

// Vista principal de autores (usa autor.ejs)
router.get("/", (req, res) => {
  res.render("autor", {
    pageTitle: "Autores",
    user: req.session.user,
  });
});

module.exports = router;
