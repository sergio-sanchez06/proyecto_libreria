import express from "express";
import AdminController from "../controllers/AdminController.mjs";
import userController from "../controllers/userController.mjs";
import protectMiddleware from "../middlewares/protect.mjs";
import bookController from "../controllers/BookController.mjs";

const router = express.Router();

router.get("/admin/libros", AdminController.getManageBooks);

router.get(
  "/books/create",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  bookController.getCreateBook
);
router.post(
  "/books/create",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  bookController.createBook
);
router.get(
  "/books/update/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  bookController.getEditBook
);
router.post(
  "/books/update/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  bookController.updateBook
);
router.post(
  "/books/delete/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  bookController.deleteBook
);

router.get(
  "/users",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  AdminController.listUsers
);
router.get(
  "/users/create",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  AdminController.getCreateUserForm
);
router.post(
  "/users/create",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  AdminController.createUser
);
router.get(
  "/users/update/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  AdminController.getUpdateUserForm
);
router.post(
  "/users/update/:id",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  AdminController.updateUser
);
router.post(
  "/users/delete/:email",
  protectMiddleware.protect,
  protectMiddleware.requireAdmin,
  AdminController.deleteUser
);

export default router;
