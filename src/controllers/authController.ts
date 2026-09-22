import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { AuthRequest } from "../middlewares/authMiddleware";

const generateToken = (id: string, role: string) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || "secret", {
        expiresIn: "30d",
    });
};

// 1. Register User
export const registerUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password, phone, avatar } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                avatar: avatar || null,
                role: "USER",
                tier: "Customer",
            },
            select: { id: true, name: true, email: true, role: true, tier: true, avatar: true },
        });

        const token = generateToken(user.id, user.role);

        res.status(201).json({
            message: "Account created successfully",
            user,
            token,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Login User / Admin
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        // Auto-seed default admin account if not present in database
        if (!user && normalizedEmail === "admin@voltstudio.com") {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("admin123", salt);
            user = await prisma.user.create({
                data: {
                    name: "Chief Operations Director",
                    email: "admin@voltstudio.com",
                    password: hashedPassword,
                    role: "ADMIN",
                    tier: "Executive Master",
                },
            });
        }

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password. Account not found." });
        }

        if (user.isSuspended) {
            return res.status(403).json({ message: "Account has been suspended. Please contact support." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = generateToken(user.id, user.role);

        res.json({
            message: "Authentication successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                tier: user.tier,
                avatar: user.avatar,
                shippingAddress: user.shippingAddress,
            },
            token,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Get Current User Profile & Orders
export const getUserProfile = async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
                role: true,
                tier: true,
                shippingAddress: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Fetch all orders placed by this user (by userId or matched customerEmail)
        const orders = await prisma.order.findMany({
            where: {
                OR: [
                    { userId: user.id },
                    { customerEmail: { equals: user.email, mode: "insensitive" } },
                ],
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                modelCode: true,
                                image: true,
                                speed: true,
                                range: true,
                                power: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Auto-link any orders that had null userId but matching email
        const unlinkedIds = orders.filter((o) => !o.userId).map((o) => o.id);
        if (unlinkedIds.length > 0) {
            await prisma.order.updateMany({
                where: { id: { in: unlinkedIds } },
                data: { userId: user.id },
            }).catch(() => {});
        }

        res.json({
            ...user,
            orders,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// 4. Update Profile & Avatar & Shipping Address
export const updateUserProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { name, phone, shippingAddress, avatar } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(name ? { name } : {}),
                ...(phone !== undefined ? { phone } : {}),
                ...(shippingAddress !== undefined ? { shippingAddress } : {}),
                ...(avatar !== undefined ? { avatar } : {}),
            },
            select: { id: true, name: true, email: true, phone: true, avatar: true, shippingAddress: true, tier: true },
        });

        res.json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};