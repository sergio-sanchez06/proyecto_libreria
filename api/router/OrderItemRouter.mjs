import express from "express";
import orderItemController from "../controllers/OrderItemController.mjs";
import AuthMiddleware from "../middlewares/AuthMiddleware.mjs";
import { validateBodyFields } from "../middlewares/validateBody.mjs";

const router = express.Router();

// CRUD para order_items (protegido para admins)
router.get(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  orderItemController.getAll
);
// router.get("/:id", orderItemController.getById);
router.get("/:id", orderItemController.getItemsByOrderId);
router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  validateBodyFields(["order_id", "book_id", "quantity", "price_at_time"]),
  orderItemController.create
);
router.put(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  validateBodyFields(["quantity", "price_at_time"]),
  orderItemController.update
);
router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  orderItemController.deleteItem
);

export default router;
