// web/routes/publisherRoutes.js
// Rutas para las vistas de editoriales

const express = require("express");
const router = express.Router();

// Vista principal de editoriales (usa editorial.ejs)
router.get("/", (req, res) => {
  res.render("editorial", {
    pageTitle: "Editoriales",
    user: req.session.user,
  });
});

module.exports = router;
