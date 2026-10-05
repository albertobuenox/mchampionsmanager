import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@mchampions.local" },
    update: {},
    create: {
      email: "admin@mchampions.local",
      name: "Admin",
      passwordHash,
      role: "admin",
    },
  });
  console.log("Seed OK — admin@mchampions.local / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
