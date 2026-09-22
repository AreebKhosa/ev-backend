import { Request, Response } from "express";
import { prisma } from "../config/prisma";

// 1. Admin: Get All Users & Rider Stats
export const getAllUsersAdmin = async (_req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                tier: true,
                isSuspended: true,
                createdAt: true,
                orders: {
                    select: { id: true, totalDue: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const formatted = users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: u.role,
            tier: u.tier,
            isSuspended: u.isSuspended,
            vehiclesCount: u.orders.length,
            totalSpent: u.orders.reduce((sum, ord) => sum + ord.totalDue, 0),
            createdAt: u.createdAt,
        }));

        res.json(formatted);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Admin: Toggle User Suspension Status
export const toggleUserSuspension = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({ where: { id } });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const updated = await prisma.user.update({
            where: { id },
            data: { isSuspended: !user.isSuspended },
        });

        res.json({ message: `User status changed to ${updated.isSuspended ? "Suspended" : "Active"}` });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};