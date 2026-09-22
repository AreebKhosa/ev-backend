import { Router } from "express";
import { submitContactQuery, getAllQueriesAdmin, toggleQueryResolved } from "../controllers/queryController";
import { protect, adminOnly } from "../middlewares/authMiddleware";

const router = Router();

router.post("/", submitContactQuery);
router.get("/admin", protect, adminOnly, getAllQueriesAdmin);
router.put("/admin/:id/resolve", protect, adminOnly, toggleQueryResolved);

export default router;