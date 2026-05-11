import CartController from "../controllers/CartController.mjs";
import protectMiddleware from "../middlewares/protect.mjs";

import express from "express";

const router = express.Router();

router.post("/add", CartController.addToCart);
router.get("/view", CartController.viewCart);
router.post("/checkout", protectMiddleware.protect, protectMiddleware.requireFreshToken, CartController.checkout);

export default router;
