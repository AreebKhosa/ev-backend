import { Router } from "express";
import { checkoutOrder, getAllOrdersAdmin, updateOrderStatus } from "../controllers/orderController";
import { uploadReceipt } from "../config/multer";
import { protect, adminOnly } from "../middlewares/authMiddleware";

const router = Router();

router.post("/checkout", uploadReceipt.single("receipt"), checkoutOrder);
router.get("/admin", protect, adminOnly, getAllOrdersAdmin);
router.put("/admin/:id/status", protect, adminOnly, updateOrderStatus);

export default router;