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

async function columnExistsSqlite(db: PrismaClient, table: string, column: string): Promise<boolean> {
  const rows = await db.$queryRawUnsafe<Array<{ name: string }>>(
    `PRAGMA table_info("${table}")`,
  );
  return rows.some((row) => row.name === column);
}

async function columnExistsPostgres(
  db: PrismaClient,
  table: string,
  column: string,
): Promise<boolean> {
  const rows = await db.$queryRawUnsafe<Array<{ column_name: string }>>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
    table.toLowerCase(),
    column,
  );
  return rows.length > 0;
}

async function addManualPaymentEmailColumn(db: PrismaClient, isSqlite: boolean) {
  const table = isSqlite ? "StoreSettings" : "StoreSettings";
  const exists = isSqlite
    ? await columnExistsSqlite(db, table, "manualPaymentEmail")
    : await columnExistsPostgres(db, table, "manualPaymentEmail");

  if (exists) {
    console.log("StoreSettings.manualPaymentEmail already exists — skipped.");
    return;
  }

  if (isSqlite) {
    await db.$executeRawUnsafe(
      `ALTER TABLE "StoreSettings" ADD COLUMN "manualPaymentEmail" TEXT NOT NULL DEFAULT ''`,
    );
  } else {
    await db.$executeRawUnsafe(
      `ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "manualPaymentEmail" TEXT NOT NULL DEFAULT ''`,
    );
  }

  console.log("Added StoreSettings.manualPaymentEmail");
}

async function main() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const isSqlite = url.startsWith("file:");
  const { db, cleanup } = createClient();

  try {
    await addManualPaymentEmailColumn(db, isSqlite);
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
