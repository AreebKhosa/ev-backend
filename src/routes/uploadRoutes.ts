import { Router, Request, Response } from "express";
import { uploadProductImage, uploadCategoryImage, uploadAvatarImage } from "../config/multer";

const router = Router();

// Helper to get base url
const getBaseUrl = (req: Request) => {
    const host = req.get("host") || "localhost:5000";
    const protocol = req.protocol === "https" ? "https" : "http";
    return `${protocol}://${host}`;
};

// Upload User / Admin Profile Picture (Avatar)
router.post("/avatar", uploadAvatarImage.single("image"), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided." });
        }
        const fileUrl = `${getBaseUrl(req)}/uploads/avatars/${req.file.filename}`;
        res.status(200).json({
            message: "Profile picture uploaded successfully",
            url: fileUrl,
            filename: req.file.filename,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Upload Single Product Image
router.post("/product", uploadProductImage.single("image"), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided." });
        }
        const fileUrl = `${getBaseUrl(req)}/uploads/products/${req.file.filename}`;
        res.status(200).json({
            message: "Product image uploaded successfully",
            url: fileUrl,
            filename: req.file.filename,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Upload Multiple Product Images
router.post("/products", uploadProductImage.array("images", 5), (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return res.status(400).json({ message: "No image files provided." });
        }
        const baseUrl = getBaseUrl(req);
        const urls = files.map((f) => `${baseUrl}/uploads/products/${f.filename}`);
        res.status(200).json({
            message: "Product images uploaded successfully",
            urls,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Upload Category Image
router.post("/category", uploadCategoryImage.single("image"), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided." });
        }
        const fileUrl = `${getBaseUrl(req)}/uploads/categories/${req.file.filename}`;
        res.status(200).json({
            message: "Category image uploaded successfully",
            url: fileUrl,
            filename: req.file.filename,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
