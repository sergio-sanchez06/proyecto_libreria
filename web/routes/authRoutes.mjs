import express from "express";
import AuthController from "../controllers/AuthController.mjs";

const router = express.Router();

router.get("/login", AuthController.getLogin);
router.get("/register", AuthController.getRegister);

export default router;