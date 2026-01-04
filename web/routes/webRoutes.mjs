// web/routes/webRoutes.mjs
import express from "express";
import homeController from "../controllers/homeController.mjs";
import authorController from "../controllers/authorController.mjs";
import authRoutes from "./authRoutes.mjs"; 

const router = express.Router();

// --- 1. Rutas de API y Autenticación ---
// Esto conecta el login POST para que guarde la sesión
router.use("/auth", authRoutes); 

// --- 2. Rutas de Vistas ---

// Ruta principal (inicio)
router.get("/", homeController.getBooksAndAuthors);

// Ruta detalle del libro
router.get("/book/:id", homeController.getBookById);

// Ruta detalle del autor
router.get("/author/:id", authorController.getAuthorById);

// Rutas de Login y Registro (Vistas)
router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/register", (req, res) => {
  res.render("register");
});

// Ruta del Carrito
router.get("/carrito", (req, res) => {
  res.render("carrito");
});

// Ruta de Logout (Destruir sesión)
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid'); 
        res.redirect("/");
    });
});

export default router;