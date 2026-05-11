// web/routes/webRoutes.mjs
import express from "express";
import homeController from "../controllers/homeController.mjs";
import authorController from "../controllers/authorController.mjs";
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

// Ruta detalle del libro
router.get("/book/:id", homeController.getBookById);

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

router.post("/auth/refresh-token", authController.refreshToken);

// Página de renovación de token — se muestra cuando protect detecta token expirado.
// El cliente renueva el token via Firebase, lo sincroniza con el servidor,
// y redirige automáticamente a la URL original (returnTo).
router.get("/refreshing", (req, res) => {
  // Si no hay sesión activa, no tiene sentido renovar — al login
  if (!req.session.user) {
    return res.redirect("/login");
  }

  const returnTo = req.query.returnTo || "/";

  // Validación básica de returnTo para evitar open redirects
  // Solo permitimos rutas relativas (que empiecen por /)
  const safeReturnTo = returnTo.startsWith("/") ? returnTo : "/";

  res.render("errors/refreshing", {
    title: "Actualizando sesión | Librería",
    returnTo: safeReturnTo,
    user: req.session.user || null,
  });
});

router.get("/aviso-legal", homeController.legalNotice);
router.get("/cookies", homeController.cookiesPolicy);
router.get("/privacidad", homeController.privacyPolicy);

export default router;
