import CartController from "../controllers/CartController.mjs";

import express from "express";

const router = express.Router();

router.post("/add", CartController.addToCart);
router.get("/view", CartController.viewCart);
router.post("/checkout", CartController.checkout);

export default router;
