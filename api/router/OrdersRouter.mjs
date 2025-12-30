import OrderController from "../controllers/OrderController.mjs";
import express from "express";
import AuthMiddleware from "../middlewares/AuthMiddleware.mjs";

const router = express.Router();

router.post("/", AuthMiddleware.authenticate, OrderController.createOrder);
router.get("/:id", OrderController.getOrderById);
router.get("/user/:id", OrderController.getOrdersByUser);
router.put("/:id", OrderController.updateOrder);
router.delete("/:id", OrderController.deleteOrder);
router.get("/", OrderController.getAllOrders);

export default router;
