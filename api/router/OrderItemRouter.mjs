import express from "express";
import orderItemController from "../controllers/OrderItemController.mjs";
import AuthMiddleware from "../middlewares/AuthMiddleware.mjs";

const router = express.Router();

// CRUD para order_items (protegido para admins)
router.get(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  orderItemController.getAll
);

// Comentado para evitar conflictos hasta saber la respuesta

// router.get(
//   "/",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.requireAdmin,
//   orderItemController.getAllOrderItemsPag
// );

// router.get("/:id", orderItemController.getById);
router.get("/:id", orderItemController.getItemsByOrderId);
router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  orderItemController.create
);
router.put(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  orderItemController.update
);
router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  orderItemController.deleteItem
);

export default router;
