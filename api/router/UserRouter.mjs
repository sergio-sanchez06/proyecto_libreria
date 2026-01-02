// router/UserRouter.mjs
import express from "express";
import UserController from "../controllers/UserController.mjs";
import AuthMiddleware from "../middlewares/AuthMiddleware.mjs"; // Importamos los middlewares

const router = express.Router();

// Rutas para el usuario autenticado (propio perfil)
router.get("/me", AuthMiddleware.authenticate, UserController.getMe); // Ver mi perfil
router.put(
  "/profile",
  AuthMiddleware.authenticate,
  UserController.updateProfile
); // Actualizar mi perfil

// Rutas para gestión de usuarios (requiere autenticación y rol ADMIN)
router.get(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  UserController.getAllUsers
); // Listar todos
router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  UserController.createUser
); // Crear nuevo usuario
router.get(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  UserController.getUserById
); // Ver por ID
router.put(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  UserController.updateUser
); // Actualizar por ID
router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  UserController.deleteUser
); // Eliminar por ID

export default router;
