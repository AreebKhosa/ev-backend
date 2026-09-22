import { Request, Response } from "express";
import { prisma } from "../config/prisma";

// 1. Submit Inquiry (Public Contact Page)
export const submitContactQuery = async (req: Request, res: Response) => {
    try {
        const { name, email, phone, topic, model, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ message: "Name, email and message are required." });
        }

        const query = await prisma.contactQuery.create({
            data: {
                name,
                email,
                phone,
                topic: topic || "General",
                model: model || "N/A",
                message,
            },
        });

        res.status(201).json({ message: "Transmission received by engineering desk", query });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Admin: Get All Inquiries
export const getAllQueriesAdmin = async (_req: Request, res: Response) => {
    try {
        const queries = await prisma.contactQuery.findMany({
            orderBy: { createdAt: "desc" },
        });
        res.json(queries);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Admin: Toggle Resolved Status
export const toggleQueryResolved = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const current = await prisma.contactQuery.findUnique({ where: { id } });

        if (!current) {
            return res.status(404).json({ message: "Query not found" });
        }

        const updated = await prisma.contactQuery.update({
            where: { id },
            data: { isResolved: !current.isResolved },
        });

        res.json({ message: "Inquiry status updated", query: updated });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};