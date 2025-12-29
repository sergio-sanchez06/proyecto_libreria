// web/routes/userRoutes.js
// Rutas para vistas de usuario

const express = require("express");
const router = express.Router();
const webController = require("../controllers/webController");

// Vista de perfil
router.get("/perfil", webController.requireLogin, (req, res) => {
  res.render("perfil", {
    pageTitle: "Mi Perfil",
    user: req.session.user,
  });
});

// Vista de historial de compras
router.get("/historial", webController.requireLogin, (req, res) => {
  res.render("historial_compras", {
    pageTitle: "Historial de Compras",
    user: req.session.user,
  });
});

module.exports = router;
