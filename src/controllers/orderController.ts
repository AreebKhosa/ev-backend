import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { transporter } from "../config/mailer";
import { AuthRequest } from "../middlewares/authMiddleware";

// 1. Checkout: Submit Order & Upload Bank Transfer Receipt
export const checkoutOrder = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Bank transfer receipt screenshot or PDF is required" });
        }

        const {
            orderNumber,
            customerName,
            customerEmail,
            customerPhone,
            shippingAddress,
            city,
            postalCode,
            country,
            subtotal,
            discountAmount,
            tax,
            totalDue,
            senderAccountName,
            transactionRef,
            items,
        } = req.body;

        const parsedItems = typeof items === "string" ? JSON.parse(items) : items;
        const receiptFileUrl = `/uploads/receipts/${req.file.filename}`;
        const generatedOrderNo = orderNumber || `VT-${Math.floor(100000 + Math.random() * 900000)}`;

        // Save in PostgreSQL
        const order = await prisma.order.create({
            data: {
                orderNumber: generatedOrderNo,
                userId: req.user ? req.user.id : null,
                customerName,
                customerEmail,
                customerPhone,
                shippingAddress,
                city,
                postalCode,
                country: country || "United States",
                subtotal: parseFloat(subtotal),
                discountAmount: parseFloat(discountAmount || "0"),
                tax: parseFloat(tax || "0"),
                totalDue: parseFloat(totalDue),
                senderAccountName,
                transactionRef,
                receiptFileUrl,
                status: "PENDING",
                items: {
                    create: parsedItems.map((it: any) => ({
                        productId: it.productId || null,
                        name: it.name,
                        colorName: it.color || "Standard",
                        price: parseFloat(it.price),
                        quantity: parseInt(it.quantity),
                    })),
                },
            },
            include: { items: true },
        });

        // Send Automated Email Confirmation with Receipt details
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_FROM || "orders@voltstudio.com",
                to: customerEmail,
                subject: `[Volt Studio] Order Confirmation & Receipt Proof #${order.orderNumber}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0E0E11; color: #ffffff; padding: 25px; border-radius: 16px;">
            <h1 style="color: #D4FF00; font-size: 24px; margin-bottom: 5px;">VOLT STUDIO MOBILITY</h1>
            <p style="color: #888888; font-size: 12px; margin-top: 0;">OFFICIAL DEPOSIT INVOICE & PROOF</p>
            <hr style="border: 1px solid #222;" />
            <p>Dear <strong>${customerName}</strong>,</p>
            <p>Thank you for your fleet reservation. We have successfully received your bank transfer receipt proof for order <strong>#${order.orderNumber}</strong>.</p>
            
            <div style="background: #181920; padding: 15px; border-radius: 10px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Total Amount:</strong> $${order.totalDue.toFixed(2)}</p>
              <p style="margin: 5px 0;"><strong>Sender Account:</strong> ${senderAccountName}</p>
              <p style="margin: 5px 0;"><strong>Payment Status:</strong> Pending Verification</p>
            </div>

            <p style="font-size: 12px; color: #999;">Our financial desk will verify the transaction and dispatch your vehicle with live tracking.</p>
          </div>
        `,
            });
        } catch (mailErr) {
            console.error("Nodemailer error:", mailErr);
        }

        res.status(201).json({ message: "Order placed successfully!", order });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Admin: Get All Orders
export const getAllOrdersAdmin = async (_req: Request, res: Response) => {
    try {
        const orders = await prisma.order.findMany({
            include: { items: true, user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: "desc" },
        });
        res.json(orders);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Admin: Update Order Status
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const existing = await prisma.order.findFirst({
            where: {
                OR: [
                    { id: id },
                    { orderNumber: id },
                ],
            },
        });

        if (!existing) {
            return res.status(404).json({ message: `Order #${id} not found.` });
        }

        const validStatuses = ["PENDING", "ASSEMBLED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];
        const normalizedStatus = status ? status.toUpperCase().replace(/\s+/g, "_") : "PENDING";
        const finalStatus = validStatuses.includes(normalizedStatus) ? (normalizedStatus as any) : "PENDING";

        const updated = await prisma.order.update({
            where: { id: existing.id },
            data: { status: finalStatus },
        });

        res.json({ message: "Order status updated", order: updated });
    } catch (error: any) {
        console.error("updateOrderStatus error:", error);
        res.status(500).json({ message: error.message });
    }
};