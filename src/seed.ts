import { prisma } from "./config/prisma";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("Seeding Admin user...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    const admin = await prisma.user.upsert({
        where: { email: "admin@voltstudio.com" },
        update: {
            role: "ADMIN",
            password: hashedPassword,
        },
        create: {
            name: "Chief Operations Director",
            email: "admin@voltstudio.com",
            password: hashedPassword,
            role: "ADMIN",
            tier: "Executive Master",
        },
    });

    console.log("Admin account synced:", admin.email, "Role:", admin.role);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
