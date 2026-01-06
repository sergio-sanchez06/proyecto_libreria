import OrderController from "../controllers/OrderController.mjs";
import express from "express";
import AuthMiddleware from "../middlewares/AuthMiddleware.mjs";

const router = express.Router();

router.post("/", AuthMiddleware.authenticate, OrderController.createOrder);
router.get("/:id", AuthMiddleware.authenticate, OrderController.getOrderById);
router.get(
  "/user/:id",
  AuthMiddleware.authenticate,
  OrderController.getOrdersByUser
);
router.put(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  OrderController.updateOrder
);
router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  OrderController.deleteOrder
);
router.get(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  OrderController.getAllOrders
);

export default router;
