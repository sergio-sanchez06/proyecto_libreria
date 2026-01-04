// web/routes/orderRoutes.js
// Rutas para las vistas de pedidos

import express from "express";
import webController from "../controllers/webController.mjs";

const router = express.Router();

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

export default router;
