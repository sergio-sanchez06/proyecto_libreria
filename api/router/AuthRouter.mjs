// router/AuthRouter.mjs
import express from "express";
<<<<<<< HEAD
import { login, register } from "../controllers/authController.mjs";
=======
import {
  login,
  register,
  socialLogin,
} from "../controllers/authController.mjs";
>>>>>>> api

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
<<<<<<< HEAD
=======
router.post("/social-login", socialLogin);
>>>>>>> api

export default router;
