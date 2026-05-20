/**
 * Fix rows still using removed ProductCategory values PEPTIDE / NOOTROPIC.
 * Run: npx tsx prisma/migrate-legacy-categories.ts
 */
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const RULES: { category: string; sql: string }[] = [
  { category: "NEUROPEPTIDE", sql: `category = 'NOOTROPIC'` },
  { category: "SUPPLIES", sql: `category = 'PEPTIDE' AND (lower(slug) LIKE '%bac-water%' OR lower(name) LIKE '%bacteriostatic%')` },
  { category: "GLP1_METABOLIC", sql: `category = 'PEPTIDE' AND (lower(slug) LIKE '%retatrutide%' OR lower(slug) LIKE '%tirzepatide%' OR lower(slug) LIKE '%semaglutide%')` },
  { category: "GROWTH_SECRETAGOGUE", sql: `category = 'PEPTIDE' AND (lower(slug) LIKE '%sermorelin%' OR lower(slug) LIKE '%ipamorelin%' OR lower(slug) LIKE '%cjc%')` },
  { category: "HEALING_REPAIR", sql: `category = 'PEPTIDE' AND (lower(slug) LIKE '%bpc%' OR lower(slug) LIKE '%tb%' OR lower(slug) LIKE '%kpv%' OR lower(slug) LIKE '%blend%')` },
  { category: "MITOCHONDRIAL", sql: `category = 'PEPTIDE' AND (lower(slug) LIKE '%mots%' OR lower(slug) LIKE '%ss-31%')` },
  { category: "NEUROPEPTIDE", sql: `category = 'PEPTIDE' AND (lower(slug) LIKE '%semax%' OR lower(slug) LIKE '%selank%')` },
  { category: "LONGEVITY", sql: `category = 'PEPTIDE' AND (lower(slug) LIKE '%epithalon%' OR lower(slug) LIKE '%slu-pp%')` },
  { category: "MELANOCORTIN", sql: `category = 'PEPTIDE' AND lower(slug) LIKE '%mt-2%'` },
  { category: "GLP1_METABOLIC", sql: `category = 'PEPTIDE'` },
];

async function main() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  let db: PrismaClient;
  let cleanup: () => Promise<void>;

  if (url.startsWith("file:")) {
    const adapter = new PrismaBetterSqlite3({ url });
    db = new PrismaClient({ adapter });
    cleanup = async () => db.$disconnect();
  } else {
    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);
    db = new PrismaClient({ adapter });
    cleanup = async () => pool.end();
  }

  let total = 0;
  for (const { category, sql } of RULES) {
    const count = await db.$executeRawUnsafe(
      `UPDATE Product SET category = ? WHERE ${sql}`,
      category,
    );
    if (typeof count === "number" && count > 0) {
      console.log(`Updated ${count} row(s) → ${category} (${sql})`);
      total += count;
    }
  }

  await cleanup();
  console.log(total > 0 ? `Done. ${total} row(s) migrated.` : "No legacy categories found.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
