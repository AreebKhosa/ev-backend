import { Request, Response } from "express";
import { prisma } from "../config/prisma";

// Helper function to create URL-friendly slug
const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-");
};

// 1. Get All Categories (Public with product count)
export const getCategories = async (_req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: "asc" },
        });

        // Count products for each category
        const products = await prisma.product.findMany({
            select: { category: true },
        });

        const counts: Record<string, number> = {};
        for (const p of products) {
            const catNameLower = (p.category || "").trim().toLowerCase();
            if (catNameLower) {
                counts[catNameLower] = (counts[catNameLower] || 0) + 1;
            }
        }

        const categoriesWithCount = categories.map((cat) => ({
            ...cat,
            productCount: counts[cat.name.trim().toLowerCase()] || 0,
        }));

        res.json(categoriesWithCount);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Get Single Category by ID or Slug
export const getCategoryById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const category = await prisma.category.findFirst({
            where: {
                OR: [{ id }, { slug: id }, { name: id }],
            },
        });

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json(category);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Admin: Create Category
export const createCategory = async (req: Request, res: Response) => {
    try {
        const { name, description, image } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Category name is required" });
        }

        const slug = slugify(name);
        const existing = await prisma.category.findFirst({
            where: { OR: [{ name: name.trim() }, { slug }] },
        });

        if (existing) {
            return res.status(400).json({ message: "Category with this name already exists" });
        }

        const category = await prisma.category.create({
            data: {
                name: name.trim(),
                slug,
                description: description || "",
                image: image || "",
            },
        });

        res.status(201).json({ message: "Category created successfully", category });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// 4. Admin: Update Category (with product cascade)
export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, image } = req.body;

        const existing = await prisma.category.findFirst({
            where: {
                OR: [{ id }, { slug: id }, { name: id }],
            },
        });

        if (!existing) {
            return res.status(404).json({ message: "Category not found" });
        }

        const updateData: any = {};
        if (name && name.trim()) {
            const newName = name.trim();
            const newSlug = slugify(newName);

            // Check if name is taken by another category
            const conflict = await prisma.category.findFirst({
                where: {
                    id: { not: existing.id },
                    OR: [{ name: newName }, { slug: newSlug }],
                },
            });

            if (conflict) {
                return res.status(400).json({ message: "Another category with this name already exists" });
            }

            updateData.name = newName;
            updateData.slug = newSlug;
        }
        if (description !== undefined) updateData.description = description;
        if (image !== undefined) updateData.image = image;

        const updated = await prisma.category.update({
            where: { id: existing.id },
            data: updateData,
        });

        // Cascade category name change to all assigned products
        if (updateData.name && updateData.name !== existing.name) {
            await prisma.product.updateMany({
                where: {
                    category: {
                        equals: existing.name,
                        mode: "insensitive",
                    },
                },
                data: {
                    category: updateData.name,
                },
            });
        }

        res.json({ message: "Category updated successfully", category: updated });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// 5. Admin: Delete Category
export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const existing = await prisma.category.findFirst({
            where: {
                OR: [{ id }, { slug: id }, { name: id }],
            },
        });

        if (!existing) {
            return res.status(404).json({ message: "Category not found" });
        }

        await prisma.category.delete({ where: { id: existing.id } });
        res.json({ message: "Category removed successfully" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
