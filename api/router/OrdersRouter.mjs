import OrderController from "../controllers/OrderController";

const router = express.Router();

router.post("/", OrderController.createOrder);
router.get("/:id", OrderController.getOrderById);
router.get("/user/:id", OrderController.getOrdersByUser);
router.put("/:id", OrderController.updateOrder);
router.delete("/:id", OrderController.deleteOrder);
router.get("/", OrderController.getAllOrders);

export default router;
