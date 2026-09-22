import { Router } from "express";
import { getBankDetails, updateBankDetails } from "../controllers/bankController";
import { protect, adminOnly } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", getBankDetails);
router.put("/admin", protect, adminOnly, updateBankDetails);

export default router;