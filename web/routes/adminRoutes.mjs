import express from "express";
import AdminController from "../controllers/AdminController.mjs";
import genresController from "../controllers/genresController.mjs";
import protectMiddleware from "../middlewares/protect.mjs";
import bookController from "../controllers/BookController.mjs";
import upload from "../utils/upload.mjs";
import { checkToxicity } from "../middlewares/reviewModeration.mjs";
import { validateReview } from "../middlewares/validateReviewContent.mjs";
import { validateSchema } from "../middlewares/validator.mjs";
import { bookSchema } from "../schemas/bookSchema.mjs";
import { userSchema } from "../schemas/userSchema.mjs";
import { genreSchema } from "../schemas/genreSchema.mjs";
import { getBookFormData } from "../utils/bookFormData.mjs";

const router = express.Router();

router.get(
  "/dashboard",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  AdminController.getDashboard,
);

router.get(
  "/books/list",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  AdminController.getManageBooks,
);

router.get(
  "/books/create",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  bookController.getCreateBook,
);
router.post(
  "/books/create",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  upload.single("cover"),
  (req, res, next) => {
    req.viewToRender = "admin/add_book";
    next();
  },
  protectMiddleware.requireFreshToken,
  // 2. Pasamos el schema y la función de carga de datos
  validateSchema(bookSchema, getBookFormData),
  bookController.createBook,
);
// router.post(
//   "/books/create",
//   protectMiddleware.protect,
//   protectMiddleware.requireAdmin,
//   upload.single("cover"),
//   bookController.createBook,
// );
router.get(
  "/books/update/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  bookController.getEditBook,
);
router.post(
  "/books/update/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  upload.single("cover"),
  (req, res, next) => {
    req.viewToRender = "admin/edit_book";
    req.body.id = req.params.id;
    next();
  },
  protectMiddleware.requireFreshToken,
  // 2. Usamos el MISMO schema y la misma utilidad
  validateSchema(bookSchema, getBookFormData),
  bookController.updateBook,
);
router.post(
  "/books/delete/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  protectMiddleware.requireFreshToken,
  bookController.deleteBook,
);

router.post(
  "/books/restore/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  protectMiddleware.requireFreshToken,
  bookController.restoreBook,
);

router.get(
  "/users",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  AdminController.listUsers,
);
router.get(
  "/users/create",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  AdminController.getCreateUserForm,
);
router.post(
  "/users/create",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  protectMiddleware.requireFreshToken,
  validateSchema(userSchema),
  AdminController.createUser,
);
router.get(
  "/users/update/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  AdminController.getUpdateUserForm,
);
router.post(
  "/users/update/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  protectMiddleware.requireFreshToken,
  validateSchema(userSchema),
  AdminController.updateUser,
);
router.post(
  "/users/delete/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  protectMiddleware.requireFreshToken,
  AdminController.deleteUser,
);

router.post(
  "/users/reactivate/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  protectMiddleware.requireFreshToken,
  AdminController.reactivateUser,
);

router.get(
  "/orders",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  AdminController.getManageOrders,
);

router.get(
  "/orders/pending",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  AdminController.getPendingOrders,
);

router.post(
  "/orders/updateStatus/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  protectMiddleware.requireFreshToken,
  AdminController.updateOrderStatus,
);
router.post(
  "/orders/cancel/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  protectMiddleware.requireFreshToken,
  AdminController.cancelOrder,
);

router.post(
  "/orders/force-return/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  protectMiddleware.requireFreshToken,
  AdminController.adminForceReturn,
);

router.post(
  "/orders/confirm-return/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  protectMiddleware.requireFreshToken,
  AdminController.adminConfirmReturn,
);

router.get(
  "/reviews",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  AdminController.getManageReviews,
);

router.post(
  "/review/update/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  validateReview,
  checkToxicity,
  AdminController.updateReview,
);

router.post(
  "/review/delete/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  AdminController.deleteReview,
);

router.get(
  "/genres/list",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  AdminController.getManagedGenres,
);

router.get(
  "/genres/create",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  genresController.getCreateGenre,
);

router.post(
  "/genres/create",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  protectMiddleware.requireFreshToken,
  (req, res, next) => {
    req.viewToRender = "admin/add_genre";
    req.entityName = "genre";
    next();
  },
  validateSchema(genreSchema),
  AdminController.createGenre,
);

router.post(
  "/genres/restore/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  protectMiddleware.requireFreshToken,
  AdminController.restoreGenre,
);

router.post(
  "/genres/delete/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  protectMiddleware.requireFreshToken,
  AdminController.deleteGenre,
);

export default router;
