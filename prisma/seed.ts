import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding admin user...");

  const hashedPassword = await bcrypt.hash("admin@rsrg.com", 10);

  const adminUser = await prisma.admin_users.upsert({
    where: { email: "admin@rsrg.com" },
    update: {
      password: hashedPassword,
      updated_at: new Date(),
    },
    create: {
      email: "admin@rsrg.com",
      password: hashedPassword,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  console.log("Admin user created/updated:", adminUser.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
