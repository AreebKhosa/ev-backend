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

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (user.isSuspended) {
            return res.status(403).json({ message: "Account has been suspended." });
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
                orders: {
                    include: { items: true },
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        res.json(user);
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