import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";

export interface AuthRequest extends Request {
    user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({ message: "Not authorized, token missing" });
    }

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, name: true, email: true, role: true, tier: true, isSuspended: true },
        });

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        if (user.isSuspended) {
            return res.status(403).json({ message: "Your account is suspended. Contact support." });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === "ADMIN") {
        next();
    } else {
        res.status(403).json({ message: "Access denied. Admin privileges required." });
    }
};