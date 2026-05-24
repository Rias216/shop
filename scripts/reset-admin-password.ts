import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

function createClient(): { db: PrismaClient; cleanup: () => Promise<void> } {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";

  if (url.startsWith("file:")) {
    const adapter = new PrismaBetterSqlite3({ url });
    const db = new PrismaClient({ adapter });
    return { db, cleanup: async () => db.$disconnect() };
  }

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });
  return {
    db,
    cleanup: async () => {
      await db.$disconnect();
      await pool.end();
    },
  };
}

async function main() {
  const { db, cleanup } = createClient();

  try {
    const existing = await db.adminUser.findMany({
      select: { id: true, username: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    if (existing.length === 0) {
      console.log("No admin users in the database yet.");
    } else {
      console.log("Existing admin users:");
      for (const admin of existing) {
        console.log(`  - ${admin.username} (${admin.id})`);
      }
    }

    const username = process.env.ADMIN_USERNAME ?? "admin";
    const password = process.env.ADMIN_PASSWORD ?? "admin123";
    const passwordHash = await hash(password, 12);

    await db.adminUser.upsert({
      where: { username },
      update: { passwordHash },
      create: { username, passwordHash },
    });

    console.log(`Admin login reset: username="${username}" password="${password}"`);
    console.log("If login still fails over HTTP, set AUTH_URL=http://your-ip:3001 in .env and restart.");
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
