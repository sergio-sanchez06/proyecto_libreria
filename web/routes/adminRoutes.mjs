import express from "express";
import AdminController from "../controllers/AdminController.mjs";

const router = express.Router();

router.get("/admin", AdminController.getDashboard);
router.get("/admin/libros", AdminController.getManageBooks);

export default router;