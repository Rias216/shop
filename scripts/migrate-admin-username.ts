import "dotenv/config";
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
    await db.$executeRawUnsafe(`ALTER TABLE AdminUser RENAME COLUMN email TO username`);
    console.log("Renamed AdminUser.email -> username");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/no such column|duplicate column|already exists/i.test(message)) {
      console.log("AdminUser.username migration skipped:", message);
      return;
    }
    throw error;
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
