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
    table,
    column,
  );
  return rows.length > 0;
}

async function renameEmailToUsername(db: PrismaClient, isSqlite: boolean) {
  const hasUsername = isSqlite
    ? await columnExistsSqlite(db, "AdminUser", "username")
    : await columnExistsPostgres(db, "AdminUser", "username");

  if (hasUsername) {
    console.log("AdminUser.username already exists — skipped.");
    return;
  }

  const hasEmail = isSqlite
    ? await columnExistsSqlite(db, "AdminUser", "email")
    : await columnExistsPostgres(db, "AdminUser", "email");

  if (!hasEmail) {
    console.log("AdminUser.email not found — skipped.");
    return;
  }

  await db.$executeRawUnsafe(
    `ALTER TABLE "AdminUser" RENAME COLUMN "email" TO "username"`,
  );
  console.log("Renamed AdminUser.email -> username");
}

async function main() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const isSqlite = url.startsWith("file:");
  const { db, cleanup } = createClient();

  try {
    await renameEmailToUsername(db, isSqlite);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      /no such column|duplicate column|already exists|relation .* does not exist|does not exist/i.test(
        message,
      )
    ) {
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
