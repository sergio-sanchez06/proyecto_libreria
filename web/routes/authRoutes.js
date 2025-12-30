// web/routes/authRoutes.js
// Rutas para autenticación (login/registro/logout)

import express from "express";
import webController from "../controllers/webController.mjs";

const router = express.Router();

// Vista de registro (la ruta /login ya está en webRoutes.js)
router.get("/register", webController.showRegisterForm);

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

export default router;
