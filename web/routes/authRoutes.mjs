import express from "express";
import AuthController from "../controllers/AuthController.mjs";

const router = express.Router();

router.get("/login", AuthController.showLogin);
router.get("/register", AuthController.showRegister);
router.post("/login", AuthController.login);
router.post("/register", AuthController.register);
router.get("/logout", AuthController.logout);

export default router;
