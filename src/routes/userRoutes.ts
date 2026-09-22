import { Router } from "express";
import { getAllUsersAdmin, toggleUserSuspension } from "../controllers/userController";
import { protect, adminOnly } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", protect, adminOnly, getAllUsersAdmin);
router.put("/:id/suspend", protect, adminOnly, toggleUserSuspension);

export default router;