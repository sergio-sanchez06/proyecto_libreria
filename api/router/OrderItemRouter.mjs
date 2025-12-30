import express from "express";
import orderItemController from "../controllers/OrderItemController.mjs";
import authenticate from "../middleware/authenticate.mjs";
import requireAdmin from "../middleware/requireAdmin.mjs";

const router = express.Router();

// CRUD para order_items (protegido para admins)
router.get("/", authenticate, requireAdmin, orderItemController.getAll);
router.get("/:id", authenticate, requireAdmin, orderItemController.getById);
router.post("/", authenticate, requireAdmin, orderItemController.create);
router.put("/:id", authenticate, requireAdmin, orderItemController.update);
router.delete("/:id", authenticate, requireAdmin, orderItemController.delete);

export default router;
