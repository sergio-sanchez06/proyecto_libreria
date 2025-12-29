// web/routes/authRoutes.js
// Rutas para autenticación (login/registro/logout)

const express = require("express");
const router = express.Router();

// Vista de login
router.get("/login", (req, res) => {
  res.render("login", {
    pageTitle: "Iniciar Sesión",
    user: req.session.user,
    error: null,
  });
});

// Vista de registro
router.get("/register", (req, res) => {
  res.render("register", {
    pageTitle: "Registrarse",
    user: req.session.user,
    error: null,
  });
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
