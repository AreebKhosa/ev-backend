import { Router } from "express";
import {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
} from "../controllers/categoryController";
import { protect, adminOnly } from "../middlewares/authMiddleware";

const router = Router();

// Public routes
router.get("/", getCategories);
router.get("/:id", getCategoryById);

// Admin Protected routes
router.post("/", protect, adminOnly, createCategory);
router.put("/:id", protect, adminOnly, updateCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);

export default router;
