// web/routes/webRoutes.mjs
import express from "express";
import homeController from "../controllers/homeController.mjs";
import authorController from "../controllers/authorController.mjs";
<<<<<<< HEAD
import authRoutes from "./authRoutes.mjs"; 

const router = express.Router();

// --- 1. Rutas de API y Autenticación ---
// Esto conecta el login POST para que guarde la sesión
router.use("/auth", authRoutes); 

// --- 2. Rutas de Vistas ---

// Ruta principal (inicio)
router.get("/", homeController.getBooksAndAuthors);
=======
import publisherController from "../controllers/PublisherController.mjs";
import authController from "../controllers/AuthController.mjs";
import languageController from "../controllers/languageController.mjs";
// import controlUserAgent from "../middlewares/controlUserAgent.mjs";
// import bookController from "../controllers/bookController.mjs";
const router = express.Router();

// router.use(controlUserAgent.filterUserAgent);

// Ruta principal (inicio)
router.get(
  "/",
  homeController.getBooksAndAuthors,
  publisherController.getPublishers,
  homeController.index,
);

router.get("/language", languageController.changeLanguage);
>>>>>>> api

// Ruta detalle del libro
router.get("/book/:id", homeController.getBookById);

<<<<<<< HEAD
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
=======
// // Ruta login (vista)
// router.get("/login", (req, res) => {
//   res.render("login");
// });

// // Ruta register (vista)
// router.get("/register", (req, res) => {
//   res.render("register");
// });

// router.get(
//   "/publishers/:id",
//   publisherController.getPublisherById,
//   homeController.getBooksByPublisherId,
//   homeController.publisher
// );
// Ruta detalle del autor
router.get("/author/:id", authorController.getAuthorById);

router.get("/login", authController.showLogin);

router.post("/login", authController.login);

router.get("/logout", authController.logout);

router.get("/register", authController.showRegister);

router.post("/register", authController.register);

router.post("/login-social", authController.socialLogin);

export default router;
>>>>>>> api
