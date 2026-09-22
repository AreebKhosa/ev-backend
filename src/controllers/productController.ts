import { Request, Response } from "express";
import { prisma } from "../config/prisma";

// 1. Get All Products (with filtering, search, category)
export const getProducts = async (req: Request, res: Response) => {
    try {
        const { category, search, maxPrice } = req.query;

        const filters: any = {};
        if (category && category !== "all") {
            filters.category = { equals: String(category), mode: "insensitive" };
        }
        if (maxPrice) {
            filters.price = { lte: parseFloat(String(maxPrice)) };
        }
        if (search) {
            const query = String(search).trim();
            filters.OR = [
                { name: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
                { modelCode: { contains: query, mode: "insensitive" } },
                { category: { contains: query, mode: "insensitive" } },
            ];
        }

        const products = await prisma.product.findMany({
            where: filters,
            orderBy: { createdAt: "desc" },
        });

        res.json(products);
    } catch (error: any) {
        console.error("getProducts error:", error);
        res.status(500).json({ message: error.message });
    }
};

// 2. Get Single Product by ID or modelCode
export const getProductById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findFirst({
            where: {
                OR: [{ id }, { modelCode: id }],
            },
        });

        if (!product) {
            return res.status(404).json({ message: "Vehicle model not found" });
        }

        res.json(product);
    } catch (error: any) {
        console.error("getProductById error:", error);
        res.status(500).json({ message: error.message });
    }
};

// 3. Admin: Create Product (with complete rich specifications)
export const createProduct = async (req: Request, res: Response) => {
    try {
        const {
            name,
            modelCode,
            category,
            badge,
            price,
            originalPrice,
            stock,
            speed,
            range,
            power,
            shortDescription,
            description,
            image,
            gallery,
            videoUrl,
            colors,
            batteryVariants,
            features,
            specifications,
            whatsInTheBox,
            warrantyAndShipping,
        } = req.body;

        if (!name || price === undefined || !category) {
            return res.status(400).json({ message: "Name, price, and category are required." });
        }

        // Auto-generate model code if not provided
        const generatedModelCode =
            modelCode?.trim() ||
            `VOLT-${name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)}-${Math.floor(100 + Math.random() * 900)}`;

        const existing = await prisma.product.findUnique({ where: { modelCode: generatedModelCode } });
        if (existing) {
            return res.status(400).json({ message: `Product with model code ${generatedModelCode} already exists` });
        }

        // Auto-ensure category exists in Category table
        const catName = category.trim();
        const catSlug = catName.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");
        const existingCat = await prisma.category.findFirst({
            where: {
                OR: [
                    { name: { equals: catName, mode: "insensitive" } },
                    { slug: { equals: catSlug, mode: "insensitive" } }
                ]
            }
        });
        if (!existingCat && catName.length > 0) {
            await prisma.category.create({
                data: {
                    name: catName,
                    slug: catSlug,
                    description: `Fleet classification for ${catName} models.`,
                }
            }).catch(() => null);
        }

        const product = await prisma.product.create({
            data: {
                name: name.trim(),
                modelCode: generatedModelCode,
                category: catName,
                badge: badge || null,
                price: parseFloat(price),
                originalPrice: originalPrice ? parseFloat(originalPrice) : null,
                stock: parseInt(stock || "10", 10),
                speed: speed || "45 km/h",
                range: range || "85 km",
                power: power || "750W",
                shortDescription: shortDescription || "",
                description: description || "",
                image: image || "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=600&auto=format&fit=crop",
                gallery: Array.isArray(gallery) ? gallery : [],
                videoUrl: videoUrl || null,
                colors: colors || [{ id: "volt", name: "Acid Lime", hex: "#D4FF00", image: "" }],
                batteryVariants: batteryVariants || [{ name: "Standard Range", range: range || "85 km", extraPrice: 0 }],
                features: Array.isArray(features) ? features : [],
                specifications: specifications || [],
                whatsInTheBox: Array.isArray(whatsInTheBox) ? whatsInTheBox : [],
                warrantyAndShipping: warrantyAndShipping || {
                    warranty: "2 Years Full Comprehensive Warranty",
                    trialPeriod: "30-Day Risk-Free Trial",
                    shipping: "Free Express Freight Shipping",
                    dispatchTime: "Ships within 24 Hours",
                },
            },
        });

        res.status(201).json({ message: "Vehicle added to fleet successfully", product });
    } catch (error: any) {
        console.error("createProduct error:", error);
        res.status(500).json({ message: error.message });
    }
};

// 4. Admin: Update Product (including all specifications and variants)
export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Find existing product by ID or modelCode
        const existing = await prisma.product.findFirst({
            where: {
                OR: [{ id }, { modelCode: id }],
            },
        });

        if (!existing) {
            return res.status(404).json({ message: `Vehicle #${id} not found.` });
        }

        // Whitelist and sanitize fields for Prisma update
        const updateData: any = {};

        if (data.name !== undefined) updateData.name = String(data.name).trim();
        if (data.modelCode !== undefined && data.modelCode.trim() !== "") {
            updateData.modelCode = String(data.modelCode).trim();
        }
        if (data.category !== undefined && String(data.category).trim() !== "") {
            const catName = String(data.category).trim();
            updateData.category = catName;

            // Auto-ensure category exists in Category table
            const catSlug = catName.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");
            const existingCat = await prisma.category.findFirst({
                where: {
                    OR: [
                        { name: { equals: catName, mode: "insensitive" } },
                        { slug: { equals: catSlug, mode: "insensitive" } }
                    ]
                }
            });
            if (!existingCat && catName.length > 0) {
                await prisma.category.create({
                    data: {
                        name: catName,
                        slug: catSlug,
                        description: `Fleet classification for ${catName} models.`,
                    }
                }).catch(() => null);
            }
        }
        if (data.badge !== undefined) updateData.badge = data.badge ? String(data.badge).trim() : null;
        if (data.price !== undefined) updateData.price = parseFloat(data.price);
        if (data.originalPrice !== undefined) updateData.originalPrice = data.originalPrice ? parseFloat(data.originalPrice) : null;
        if (data.stock !== undefined) updateData.stock = parseInt(data.stock, 10);
        if (data.speed !== undefined) updateData.speed = String(data.speed);
        if (data.range !== undefined) updateData.range = String(data.range);
        if (data.power !== undefined) updateData.power = String(data.power);
        if (data.shortDescription !== undefined) updateData.shortDescription = String(data.shortDescription);
        if (data.description !== undefined) updateData.description = String(data.description);
        if (data.image !== undefined && data.image) updateData.image = String(data.image);
        if (data.gallery !== undefined) updateData.gallery = Array.isArray(data.gallery) ? data.gallery : [];
        if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl ? String(data.videoUrl).trim() : null;
        if (data.colors !== undefined) updateData.colors = data.colors;
        if (data.batteryVariants !== undefined) updateData.batteryVariants = data.batteryVariants;
        if (data.features !== undefined) updateData.features = Array.isArray(data.features) ? data.features : [];
        if (data.specifications !== undefined) updateData.specifications = data.specifications;
        if (data.whatsInTheBox !== undefined) updateData.whatsInTheBox = Array.isArray(data.whatsInTheBox) ? data.whatsInTheBox : [];
        if (data.warrantyAndShipping !== undefined) updateData.warrantyAndShipping = data.warrantyAndShipping;

        const updated = await prisma.product.update({
            where: { id: existing.id },
            data: updateData,
        });

        res.json({ message: "Vehicle specifications updated successfully", product: updated });
    } catch (error: any) {
        console.error("updateProduct error:", error);
        res.status(500).json({ message: error.message });
    }
};

// 5. Admin: Delete Product
export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const existing = await prisma.product.findFirst({
            where: {
                OR: [{ id }, { modelCode: id }],
            },
        });

        if (!existing) {
            return res.status(404).json({ message: `Vehicle #${id} not found.` });
        }

        await prisma.product.delete({ where: { id: existing.id } });
        res.json({ message: "Vehicle removed from fleet successfully" });
    } catch (error: any) {
        console.error("deleteProduct error:", error);
        res.status(500).json({ message: error.message });
    }
};