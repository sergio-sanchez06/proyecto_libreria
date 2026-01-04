// web/routes/publisherRoutes.js
// Rutas para las vistas de editoriales

import express from "express";

const router = express.Router();

// Vista principal de editoriales (usa editorial.ejs)
router.get("/", (req, res) => {
  res.render("editorial", {
    pageTitle: "Editoriales",
    user: req.session.user,
  });
});

export default router;
