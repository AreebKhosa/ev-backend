import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { baseUploadDir } from "./config/multer";

// Route imports
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import orderRoutes from "./routes/orderRoutes";
import queryRoutes from "./routes/queryRoutes";
import userRoutes from "./routes/userRoutes";
import bankRoutes from "./routes/bankRoutes";
import uploadRoutes from "./routes/uploadRoutes";

import { errorHandler } from "./middlewares/errorMiddleware";

export const app = express();

// Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Static Folder for Image and Receipt uploads with CORS headers
app.use(
    "/uploads",
    express.static(baseUploadDir, {
        setHeaders: (res) => {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        },
    })
);

// ================= API ENDPOINTS =================
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/queries", queryRoutes);
app.use("/api/admin/users", userRoutes);
app.use("/api/bank-details", bankRoutes);
app.use("/api/upload", uploadRoutes);

// Health Check
app.get("/api", (_req, res) => {
    res.json({ status: "Volt Studio Mobility API Active", version: "1.0.0", timestamp: new Date() });
});

app.get("/", (_req, res) => {
    res.json({ status: "Volt Studio Mobility API Active", timestamp: new Date() });
});

// Global Error Handler
app.use(errorHandler);

export default app;