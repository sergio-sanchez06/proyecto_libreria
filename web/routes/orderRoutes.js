// web/routes/orderRoutes.js
// Rutas para las vistas de pedidos

const express = require("express");
const router = express.Router();
const webController = require("../controllers/webController");

// Vista de carrito
router.get("/cart", (req, res) => {
  res.render("carrito", {
    pageTitle: "Carrito de Compras",
    user: req.session.user,
  });
});

// Vista de historial de compras
router.get("/my-orders", webController.requireLogin, (req, res) => {
  res.render("historial_compras", {
    pageTitle: "Mis Pedidos",
    user: req.session.user,
  });
});

module.exports = router;
