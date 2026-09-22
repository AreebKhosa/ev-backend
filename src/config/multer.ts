import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";

// Detect serverless environment (Vercel / AWS Lambda)
const isServerless =
    process.env.VERCEL === "1" ||
    process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined ||
    process.env.NOW_REGION !== undefined;

export const baseUploadDir = isServerless
    ? path.join(os.tmpdir(), "uploads")
    : path.join(process.cwd(), "uploads");

const receiptsDir = path.join(baseUploadDir, "receipts");
const productsDir = path.join(baseUploadDir, "products");
const categoriesDir = path.join(baseUploadDir, "categories");
const avatarsDir = path.join(baseUploadDir, "avatars");

// Safely ensure destination directories exist without crashing on read-only environments
const ensureDir = (dirPath: string) => {
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    } catch (e) {
        // Suppress warning if running on read-only container
    }
};

ensureDir(baseUploadDir);
ensureDir(receiptsDir);
ensureDir(productsDir);
ensureDir(categoriesDir);
ensureDir(avatarsDir);

const imageFilter = (_req: any, file: any, cb: any) => {
    const filetypes = /jpeg|jpg|png|webp|svg|gif|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error("Only image files (PNG, JPG, WEBP, SVG, GIF) and PDF are allowed!"));
    }
};

// Storage for Receipts
const receiptStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        ensureDir(receiptsDir);
        cb(null, receiptsDir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `receipt-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
});

// Storage for Products
const productStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        ensureDir(productsDir);
        cb(null, productsDir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
});

// Storage for Categories
const categoryStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        ensureDir(categoriesDir);
        cb(null, categoriesDir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `category-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
});

// Storage for Avatars
const avatarStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        ensureDir(avatarsDir);
        cb(null, avatarsDir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
});

export const uploadReceipt = multer({
    storage: receiptStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: imageFilter,
});

export const uploadProductImage = multer({
    storage: productStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: imageFilter,
});

export const uploadCategoryImage = multer({
    storage: categoryStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: imageFilter,
});

export const uploadAvatarImage = multer({
    storage: avatarStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: imageFilter,
});