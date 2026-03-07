// router/UserRouter.mjs
import express from "express";
import UserController from "../controllers/UserController.mjs";
<<<<<<< HEAD
import AuthService from "../services/authService.mjs";

const router = express.Router();

router.get("/getAll", UserController.getAll);

// Middleware de autenticación
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No autorizado - Token faltante" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    req.user = await AuthService.verifyTokenAndGetUser(idToken);
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

// Middleware para verificar que el usuario es el propietario o ADMIN
const authorizeUserOrAdmin = (req, res, next) => {
  const requestedId = parseInt(req.params.id);
  const currentUser = req.user;

  if (currentUser.role === "ADMIN" || currentUser.id === requestedId) {
    next();
  } else {
    return res.status(403).json({ message: "Acceso denegado" });
  }
};

// Ruta para obtener el perfil del usuario autenticado (la más usada)
router.get("/me", authenticate, (req, res) => {
  res.status(200).json({
    message: "Perfil del usuario",
    user: req.user,
  });
});

// Ruta para listar todos los usuarios (solo ADMIN)
router.get(
  "/",
  authenticate,
  (req, res, next) => {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Solo administradores" });
    }
    next();
  },
  UserController.getAllUsers
);

// Ruta para obtener un usuario por ID (propio o ADMIN)
router.get(
  "/:id",
  authenticate,
  authorizeUserOrAdmin,
  UserController.getUserById
);

// Ruta para actualizar usuario (propio o ADMIN)
router.put(
  "/:id",
  authenticate,
  authorizeUserOrAdmin,
  UserController.updateUser
);

// Ruta para eliminar usuario (solo ADMIN o el propio usuario)
router.delete(
  "/:id",
  authenticate,
  authorizeUserOrAdmin,
  UserController.deleteUser
);
=======
import AuthMiddleware from "../middlewares/AuthMiddleware.mjs"; // Importamos los middlewares

const router = express.Router();

// Rutas para el usuario autenticado (propio perfil)
router.get("/me/:id", AuthMiddleware.authenticate, UserController.getMe); // Ver mi perfil
router.put(
  "/profile/:id",
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
  UserController.adminCreateUser
); // Crear nuevo usuario
router.post("/register", UserController.registerUser); // Crear nuevo usuario
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
  "/dismissSelf/:id",
  AuthMiddleware.authenticate,
  UserController.deleteUser
); // Eliminar al propio usuario
router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  UserController.deleteUser
); // Eliminar por ID
>>>>>>> api

export default router;
