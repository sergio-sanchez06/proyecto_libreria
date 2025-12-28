import express from "express";
import UserController from "../controllers/UserController.mjs";

const router = express.Router();

router.get("/profile", UserController.getProfile);
router.get("/mis-compras", UserController.getPurchaseHistory);

export default router;
