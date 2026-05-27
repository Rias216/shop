import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient, ProductCategory, ReviewStatus } from "../src/generated/prisma/client";
import { catalogMenuProducts } from "./catalog-menu-products";
import { DEFAULT_SETTINGS, SETTINGS_ID } from "../src/lib/settings";

function createSeedClient(): { db: PrismaClient; cleanup: () => Promise<void> } {
  const url = process.env.DATABASE_URL ?? "";

  if (url.startsWith("file:")) {
    const adapter = new PrismaBetterSqlite3({ url });
    const db = new PrismaClient({ adapter });
    return {
      db,
      cleanup: async () => db.$disconnect(),
    };
  }

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return {
    db: new PrismaClient({ adapter }),
    cleanup: async () => pool.end(),
  };
}

const LEGAL_NOTICE = DEFAULT_SETTINGS.defaultLegalNotice;

const products = [
  {
    name: "BPC-157 Research Peptide",
    slug: "bpc-157-research",
    category: ProductCategory.HEALING_REPAIR,
    sku: "REP-BPC157-5MG",
    description:
      "Synthetic pentadecapeptide for in-vitro laboratory research. Lyophilized powder, ≥98% purity by HPLC.",
    priceCents: 4999,
    stock: 9999,
    purity: "≥98%",
    casNumber: "137525-51-0",
    images: ["/products/peptide-placeholder.svg"],
  },
  {
    name: "Semaglutide Analog (Research)",
    slug: "semaglutide-analog-research",
    category: ProductCategory.GLP1_METABOLIC,
    sku: "GLP-SEMA-2MG",
    description:
      "GLP-1 receptor agonist analog supplied for non-clinical research applications only.",
    priceCents: 8999,
    stock: 9999,
    purity: "≥97%",
    images: ["/products/peptide-placeholder.svg"],
  },
  {
    name: "TB-500 Research Peptide",
    slug: "tb-500-research",
    category: ProductCategory.HEALING_REPAIR,
    sku: "REP-TB500-5MG",
    description:
      "Thymosin beta-4 fragment for cell migration and tissue repair research in vitro.",
    priceCents: 5499,
    stock: 9999,
    purity: "≥98%",
    images: ["/products/peptide-placeholder.svg"],
  },
];

const retiredSlugs = [
  "noopept-research",
  "piracetam-research",
  "semaglutide-analog-research",
  "tb-500-research",
  "retatrutide-60mg",
  "tirzepatide-60mg",
];

async function migrateLegacyCategories(db: PrismaClient) {
  const rules: { category: string; sql: string }[] = [
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
  for (const { category, sql } of rules) {
    await db.$executeRawUnsafe(`UPDATE Product SET category = ? WHERE ${sql}`, category);
  }
}

async function main() {
  const { db, cleanup } = createSeedClient();

  await migrateLegacyCategories(db);

  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const passwordHash = await hash(password, 12);

  await db.adminUser.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
  });

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? DEFAULT_SETTINGS.siteName;
  const legalEntity = process.env.NEXT_PUBLIC_LEGAL_ENTITY ?? DEFAULT_SETTINGS.legalEntity;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    DEFAULT_SETTINGS.siteUrl;

  await db.storeSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { siteName, legalEntity, siteUrl },
    create: {
      ...DEFAULT_SETTINGS,
      siteName,
      legalEntity,
      siteUrl,
      paypalClientId: process.env.PAYPAL_CLIENT_ID ?? "",
      paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET ?? "",
      paypalMode: process.env.PAYPAL_MODE ?? "sandbox",
      paypalEnabled: Boolean(process.env.PAYPAL_CLIENT_ID),
      nowpaymentsApiKey: process.env.NOWPAYMENTS_API_KEY ?? "",
      nowpaymentsIpnSecret: process.env.NOWPAYMENTS_IPN_SECRET ?? "",
      cryptoEnabled: Boolean(process.env.NOWPAYMENTS_API_KEY),
      resendApiKey: process.env.RESEND_API_KEY ?? "",
      emailFrom: process.env.EMAIL_FROM ?? DEFAULT_SETTINGS.emailFrom,
      blockedCountries: process.env.BLOCKED_COUNTRIES ?? DEFAULT_SETTINGS.blockedCountries,
    },
  });

  await db.coupon.upsert({
    where: { code: "FREESHIP" },
    update: { isActive: true, type: "FREE_SHIPPING" },
    create: {
      code: "FREESHIP",
      type: "FREE_SHIPPING",
      isActive: true,
    },
  });

  await db.product.updateMany({
    where: { slug: { in: retiredSlugs } },
    data: { isActive: false },
  });

  const allProducts = [...products, ...catalogMenuProducts];

  for (const p of allProducts) {
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        sku: p.sku,
        category: p.category,
        description: p.description,
        priceCents: p.priceCents,
        stock: p.stock,
        purity: p.purity,
        casNumber: p.casNumber ?? null,
        images: p.images,
        legalNotice: LEGAL_NOTICE,
        isActive: true,
        groupKey: "groupKey" in p ? (p.groupKey ?? null) : null,
        variantLabel: "variantLabel" in p ? (p.variantLabel ?? null) : null,
      },
      create: {
        ...p,
        casNumber: p.casNumber ?? null,
        legalNotice: LEGAL_NOTICE,
        groupKey: "groupKey" in p ? (p.groupKey ?? null) : null,
        variantLabel: "variantLabel" in p ? (p.variantLabel ?? null) : null,
      },
    });

    const coaExists = await db.coaDocument.findFirst({
      where: { productId: product.id, batchCode: "BATCH-2025-001" },
    });
    if (!coaExists) {
      await db.coaDocument.create({
        data: {
          productId: product.id,
          batchCode: "BATCH-2025-001",
          fileUrl: "/uploads/sample-coa.pdf",
          issuedAt: new Date("2025-01-15"),
          labName: "Independent Analytics Lab",
        },
      });
    }
  }

  const bpc = await db.product.findUnique({ where: { slug: "bpc-157-research" } });
  if (bpc) {
    const sampleReviews = [
      {
        authorName: "Lab Director",
        rating: 5,
        title: "Consistent quality",
        body: "We have ordered multiple batches for in-vitro studies. Purity reports match expectations and shipping was fast.",
        status: ReviewStatus.APPROVED,
      },
      {
        authorName: "Research Tech",
        rating: 4,
        title: "Solid for our workflow",
        body: "Reconstitution was straightforward and results were reproducible across three replicate plates in our assay.",
        status: ReviewStatus.APPROVED,
      },
      {
        authorName: "New Customer",
        rating: 5,
        title: "Awaiting moderation",
        body: "Just placed my first order and the vials arrived well packaged. Will update after we complete our QC run.",
        status: ReviewStatus.PENDING,
      },
    ] as const;

    for (const sample of sampleReviews) {
      const exists = await db.review.findFirst({
        where: { productId: bpc.id, authorName: sample.authorName, title: sample.title },
      });
      if (!exists) {
        await db.review.create({
          data: { productId: bpc.id, ...sample },
        });
      }
    }
  }

  await cleanup();
  console.log("Seed complete. Admin login:", username);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
