import OrderController from "../controllers/OrderController.mjs";
import express from "express";
import AuthMiddleware from "../middlewares/AuthMiddleware.mjs";
import { validateBodyFields } from "../middlewares/validateBody.mjs";

const router = express.Router();

router.get(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  OrderController.getAllOrders,
);

// router.post(
//   "/stripe/create-session",
//   AuthMiddleware.authenticate,
//   validateBodyFields(["items", "shipping_address"]),
//   OrderController.createStripeSession,
// );

router.get(
  "/stripe/confirm-session",
  AuthMiddleware.authenticate,
  OrderController.confirmStripeSession,
);

router.post(
  "/",
  AuthMiddleware.authenticate,
  validateBodyFields(["items", "shipping_address"]),
  OrderController.createOrder,
);

router.get(
  "/user/:id",
  AuthMiddleware.authenticate,
  OrderController.getOrdersByUser,
);

router.get("/:id", AuthMiddleware.authenticate, OrderController.getOrderById);

router.put(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  validateBodyFields(["status"]),
  OrderController.updateOrder,
);

// router.delete(
//   "/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.requireAdmin,
//   OrderController.deleteOrder,
// );

router.post(
  "/user/cancel/:id",
  AuthMiddleware.authenticate,
  OrderController.userCancelOrder,
);

router.post(
  "/admin/cancel/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  OrderController.cancelOrder,
);

router.post(
  "/user/request-return/:id",
  AuthMiddleware.authenticate,
  OrderController.userRequestReturn,
);

router.post(
  "/admin/confirm-return/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  OrderController.adminConfirmReturn,
);

router.post(
  "/admin/force-return/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  OrderController.adminForceReturn,
);

router.post("/payment", OrderController.paymentAndEmail);


export default router;