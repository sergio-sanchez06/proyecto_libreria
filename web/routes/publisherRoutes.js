// web/routes/publisherRoutes.js
// Rutas para las vistas de editoriales

const express = require("express");
const router = express.Router();

// Vista principal de editoriales
router.get("/", (req, res) => {
  res.render("publishers/list", {
    pageTitle: "Editoriales",
    user: req.session.user,
  });
});

// Vista de detalle de editorial
router.get("/:id", (req, res) => {
  res.render("publishers/detail", {
    pageTitle: "Detalle de Editorial",
    user: req.session.user,
    publisherId: req.params.id,
  });
});

module.exports = router;
