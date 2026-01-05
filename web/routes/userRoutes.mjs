import express from "express";
import UserController from "../controllers/userController.mjs";

const router = express.Router();

router.get("/profile", UserController.getProfile);
router.get("/myOrders", UserController.getPurchaseHistory);

export default router;
