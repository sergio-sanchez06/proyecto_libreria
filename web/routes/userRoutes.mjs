import express from "express";
import UserController from "../controllers/userController.mjs";
import protectMiddleware from "../middlewares/protect.mjs";

const router = express.Router();

router.get("/profile", protectMiddleware.protect, UserController.getProfile);
router.get(
  "/myOrders",
  protectMiddleware.protect,
  UserController.getPurchaseHistory
);
router.get(
  "/edit/:id",
  protectMiddleware.protect,
  UserController.getEditProfileForm
);
router.post(
  "/edit/:id",
  protectMiddleware.protect,
  UserController.updateProfile
);

router.post(
  "/bajaUsuario",
  protectMiddleware.protect,
  UserController.deleteUser
);

export default router;
