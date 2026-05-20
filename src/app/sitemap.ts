import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { getStoreSettings } from "@/lib/settings";

const STATIC_PATHS = [
  "",
  "/catalog",
  "/support",
  "/contact",
  "/shipping",
  "/returns",
  "/privacy",
  "/terms",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getStoreSettings();
  const base = settings.siteUrl.replace(/\/$/, "");
  const now = new Date();

  const products = await db.product.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/catalog" ? "daily" : "monthly",
    priority: path === "" ? 1 : path === "/catalog" ? 0.9 : 0.5,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${base}/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...productEntries];
}
