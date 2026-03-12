import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@lms.com" },
  });

  if (existingAdmin) {
    console.log("✅ Admin user already exists, skipping creation.");
    return;
  }

  // Create admin user
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@lms.com",
      password: hashedPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  console.log("✅ Admin user created successfully!");
  console.log(`   Email: ${admin.email}`);
  console.log(`   Password: ${adminPassword} (default)`);
  console.log(`   Role: ${admin.role}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

