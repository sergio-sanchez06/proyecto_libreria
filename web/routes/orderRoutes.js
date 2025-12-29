// web/routes/orderRoutes.js
// Rutas para las vistas de pedidos

const express = require("express");
const router = express.Router();
const webController = require("../controllers/webController");

// Vista de mis pedidos (requiere login)
router.get("/my-orders", webController.requireLogin, (req, res) => {
  res.render("orders/my-orders", {
    pageTitle: "Mis Pedidos",
    user: req.session.user,
  });
});

// Vista de detalle de pedido (requiere login)
router.get("/my-orders/:id", webController.requireLogin, (req, res) => {
  res.render("orders/detail", {
    pageTitle: "Detalle de Pedido",
    user: req.session.user,
    orderId: req.params.id,
  });
});

// Vista del carrito
router.get("/cart", (req, res) => {
  res.render("orders/cart", {
    pageTitle: "Carrito de Compras",
    user: req.session.user,
  });
});

module.exports = router;
