// web/routes/webRoutes.mjs
import express from "express";
import homeController from "../controllers/homeController.mjs";
import authorController from "../controllers/authorController.mjs";
import publisherController from "../controllers/PublisherController.mjs";
// import bookController from "../controllers/bookController.mjs";
const router = express.Router();

// Ruta principal (inicio)
router.get(
  "/",
  homeController.getBooksAndAuthors,
  publisherController.getPublishers,
  homeController.index
);

// Ruta detalle del libro
router.get("/book/:id", homeController.getBookById);

// Ruta login (vista)
router.get("/login", (req, res) => {
  res.render("login");
});

// Ruta register (vista)
router.get("/register", (req, res) => {
  res.render("register");
});

router.get(
  "/publishers/:id",
  publisherController.getPublisherById,
  homeController.getBooksByPublisherId,
  homeController.publisher
);
// Ruta detalle del autor
router.get("/author/:id", authorController.getAuthorById);

export default router;
