import { Request, Response } from "express";
import { prisma } from "../config/prisma";

// 1. Get Corporate Bank & USDT Deposit Details (For Checkout & Admin)
export const getBankDetails = async (_req: Request, res: Response) => {
    try {
        let settings = await prisma.bankSetting.findFirst();
        if (!settings) {
            settings = await prisma.bankSetting.create({
                data: {
                    id: "singleton-id",
                    bankName: "Silicon Valley Commercial Bank",
                    accountTitle: "Volt Studio Mobility Inc.",
                    accountNumberOrIban: "US89 SVBK 0001 2948 5829 01",
                    swiftBic: "SVBKUS6SXXX",
                    branchAddress: "3003 Tasman Dr, Santa Clara, CA 95054",
                    cryptoUsdtAddress: "0x71C2B...9482A (ERC20 / TRC20)",
                },
            });
        }
        res.json(settings);
    } catch (error: any) {
        console.error("getBankDetails error:", error);
        res.status(500).json({ message: error.message });
    }
};

// 2. Admin: Update Corporate Bank Details
export const updateBankDetails = async (req: Request, res: Response) => {
    try {
        const {
            bankName,
            accountTitle,
            accountNumberOrIban,
            swiftBic,
            branchAddress,
            cryptoUsdtAddress,
        } = req.body;

        let existing = await prisma.bankSetting.findFirst();
        let updated;

        if (existing) {
            updated = await prisma.bankSetting.update({
                where: { id: existing.id },
                data: {
                    bankName: bankName !== undefined ? bankName : existing.bankName,
                    accountTitle: accountTitle !== undefined ? accountTitle : existing.accountTitle,
                    accountNumberOrIban: accountNumberOrIban !== undefined ? accountNumberOrIban : existing.accountNumberOrIban,
                    swiftBic: swiftBic !== undefined ? swiftBic : existing.swiftBic,
                    branchAddress: branchAddress !== undefined ? branchAddress : existing.branchAddress,
                    cryptoUsdtAddress: cryptoUsdtAddress !== undefined ? cryptoUsdtAddress : existing.cryptoUsdtAddress,
                },
            });
        } else {
            updated = await prisma.bankSetting.create({
                data: {
                    id: "singleton-id",
                    bankName: bankName || "Silicon Valley Commercial Bank",
                    accountTitle: accountTitle || "Volt Studio Mobility Inc.",
                    accountNumberOrIban: accountNumberOrIban || "US89 SVBK 0001 2948 5829 01",
                    swiftBic: swiftBic || "SVBKUS6SXXX",
                    branchAddress: branchAddress || "",
                    cryptoUsdtAddress: cryptoUsdtAddress || "",
                },
            });
        }

        res.json({ message: "Bank deposit telemetry updated successfully", settings: updated });
    } catch (error: any) {
        console.error("updateBankDetails error:", error);
        res.status(500).json({ message: error.message });
    }
};