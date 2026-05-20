"use server";

import { hash, compare } from "bcryptjs";
import { revalidatePath, revalidateTag } from "next/cache";
import { PRODUCT_CACHE_TAGS } from "@/lib/product-include";
import { redirect } from "next/navigation";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  ensureUniqueSku,
  ensureUniqueSlug,
  normalizePurityInput,
  skuBaseFromName,
  slugFromName,
} from "@/lib/product-identifiers";
import { sendOrderShippedEmail } from "@/lib/email";
import { orderPublicUrl } from "@/lib/orders";
import { DEFAULT_SETTINGS, getStoreSettings, SETTINGS_ID } from "@/lib/settings";
import type { ProductCategory } from "@/generated/prisma/client";
import { encryptSettingValue } from "@/lib/secure-settings";

function pickSecret(incoming: FormDataEntryValue | null, existing: string): string {
  const value = String(incoming ?? "").trim();
  return value.length > 0 ? value : existing;
}

function checkbox(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

function invalidateProductCaches() {
  revalidateTag(PRODUCT_CACHE_TAGS.homePopular, "max");
  revalidateTag(PRODUCT_CACHE_TAGS.homeNew, "max");
  revalidateTag(PRODUCT_CACHE_TAGS.catalog, "max");
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

function parseProductForm(formData: FormData) {
  const id = (formData.get("id") as string | null) || null;
  const name = String(formData.get("name") ?? "").trim();
  const category = formData.get("category") as ProductCategory;
  const description = String(formData.get("description") ?? "").trim();
  const priceUsd = Number(formData.get("priceCents"));
  const stock = Number(formData.get("stock"));
  const purity = normalizePurityInput(formData.get("purity") as string);
  const casNumber = String(formData.get("casNumber") ?? "").trim() || null;
  const skuOverride = String(formData.get("sku") ?? "").trim();
  const isActive = formData.get("isActive") === "on";
  const useDefaultLegalNotice = formData.get("useDefaultLegalNotice") === "on";
  const legalNoticeRaw = String(formData.get("legalNotice") ?? "").trim();
  const legalNotice = useDefaultLegalNotice ? null : legalNoticeRaw || null;
  const groupKey = String(formData.get("groupKey") ?? "").trim() || null;
  const variantLabel = String(formData.get("variantLabel") ?? "").trim() || null;

  if (!name) throw new Error("Product name is required");
  if (!description) throw new Error("Description is required");
  if (!Number.isFinite(priceUsd) || priceUsd < 0) throw new Error("Invalid price");
  if (!Number.isFinite(stock) || stock < 0) throw new Error("Invalid stock");

  return {
    id,
    name,
    category,
    description,
    priceCents: Math.round(priceUsd * 100),
    stock: Math.max(0, Math.floor(stock)),
    purity,
    casNumber,
    skuOverride,
    isActive,
    legalNotice,
    groupKey,
    variantLabel,
  };
}

export async function checkProductDraftAction(input: {
  name: string;
  excludeProductId?: string;
}): Promise<{
  duplicateName: boolean;
  similar: { id: string; name: string; sku: string }[];
}> {
  await requireAdmin();

  const name = input.name.trim();
  if (!name) {
    return { duplicateName: false, similar: [] };
  }

  const exclude = input.excludeProductId
    ? { NOT: { id: input.excludeProductId } }
    : {};

  const needle = name.toLowerCase();
  const candidates = await db.product.findMany({
    where: {
      ...exclude,
      OR: [{ name: { contains: name } }, { name: { contains: name.split(/\s+/)[0] ?? name } }],
    },
    take: 12,
    orderBy: { name: "asc" },
    select: { id: true, name: true, sku: true },
  });

  const exact = candidates.find((p) => p.name.toLowerCase() === needle);
  const similar = candidates
    .filter((p) => p.id !== exact?.id)
    .slice(0, 3);

  return {
    duplicateName: Boolean(exact),
    similar: exact ? [exact, ...similar].slice(0, 3) : similar,
  };
}

export async function saveProductAction(formData: FormData) {
  await requireAdmin();

  const parsed = parseProductForm(formData);
  const { id, name, category, skuOverride, groupKey, variantLabel, ...rest } = parsed;

  const skuBase = skuOverride || skuBaseFromName(name, category);
  const sku = await ensureUniqueSku(db, skuBase, id ?? undefined);
  const slug = await ensureUniqueSlug(db, slugFromName(name), id ?? undefined);

  const data = {
    name,
    slug,
    category,
    description: rest.description,
    priceCents: rest.priceCents,
    stock: rest.stock,
    purity: rest.purity,
    casNumber: rest.casNumber,
    sku,
    isActive: rest.isActive,
    legalNotice: rest.legalNotice,
    groupKey,
    variantLabel,
    images: ["/products/peptide-placeholder.svg"],
  };

  try {
    if (id) {
      const { slug: _slug, ...updateData } = data;
      await db.product.update({ where: { id }, data: updateData });
      revalidatePath("/admin/products");
      revalidatePath(`/admin/products/${id}`);
      revalidatePath("/");
      invalidateProductCaches();
      redirect(`/admin/products/${id}?saved=1`);
    } else {
      const product = await db.product.create({ data });
      revalidatePath("/admin/products");
      revalidatePath("/");
      invalidateProductCaches();
      redirect(`/admin/products/${product.id}?saved=1`);
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = id ? `/admin/products/${id}` : "/admin/products/new";
      redirect(`${target}?error=duplicate`);
    }
    throw error;
  }
}

type VariantInput = {
  mg: number;
  priceUsd: number;
  stock: number;
};

export async function saveProductGroupAction(formData: FormData) {
  await requireAdmin();

  const base = String(formData.get("base") ?? "").trim();
  const groupKeyRaw = String(formData.get("groupKey") ?? "").trim();
  const category = formData.get("category") as ProductCategory;
  const description = String(formData.get("description") ?? "").trim();
  const purity = normalizePurityInput(formData.get("purity") as string);
  const casNumber = String(formData.get("casNumber") ?? "").trim() || null;
  const useDefaultLegalNotice = formData.get("useDefaultLegalNotice") === "on";
  const legalNoticeRaw = String(formData.get("legalNotice") ?? "").trim();
  const legalNotice = useDefaultLegalNotice ? null : legalNoticeRaw || null;
  const isActive = formData.get("isActive") === "on";

  if (!base) throw new Error("Base name is required");
  if (!description) throw new Error("Description is required");

  const groupKey = (groupKeyRaw || slugFromName(base)).toLowerCase();

  const variantsRaw = formData.getAll("variants").map((v) => String(v));
  const variants: VariantInput[] = variantsRaw
    .map((raw) => {
      try {
        const parsed = JSON.parse(raw) as VariantInput;
        return parsed;
      } catch {
        return null;
      }
    })
    .filter((v): v is VariantInput => {
      if (!v) return false;
      return (
        Number.isFinite(v.mg) &&
        v.mg > 0 &&
        Number.isFinite(v.priceUsd) &&
        v.priceUsd >= 0 &&
        Number.isFinite(v.stock) &&
        v.stock >= 0
      );
    });

  if (variants.length === 0) {
    throw new Error("Add at least one dosage variant");
  }

  // Deduplicate by mg
  const seen = new Set<number>();
  const uniqueVariants = variants.filter((v) => {
    if (seen.has(v.mg)) return false;
    seen.add(v.mg);
    return true;
  });

  type Prepared = {
    name: string;
    slug: string;
    sku: string;
    category: ProductCategory;
    description: string;
    priceCents: number;
    stock: number;
    purity: string | null;
    casNumber: string | null;
    isActive: boolean;
    legalNotice: string | null;
    images: string[];
    groupKey: string;
    variantLabel: string;
  };

  const prepared: Prepared[] = [];
  for (const v of uniqueVariants) {
    const name = `${base} ${v.mg}mg Research Kit`;
    const slug = await ensureUniqueSlug(db, slugFromName(name));
    const sku = await ensureUniqueSku(db, skuBaseFromName(name, category));
    prepared.push({
      name,
      slug,
      sku,
      category,
      description,
      priceCents: Math.round(v.priceUsd * 100),
      stock: Math.max(0, Math.floor(v.stock)),
      purity,
      casNumber,
      isActive,
      legalNotice,
      images: ["/products/peptide-placeholder.svg"],
      groupKey,
      variantLabel: `${v.mg}mg`,
    });
  }

  try {
    await db.$transaction(prepared.map((p) => db.product.create({ data: p })));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect(`/admin/products/new-group?error=duplicate`);
    }
    throw error;
  }

  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  revalidatePath("/");
  invalidateProductCaches();
  redirect(`/admin/products?group=${groupKey}`);
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  await db.product.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/admin/products");
  revalidatePath("/");
  invalidateProductCaches();
  redirect("/admin/products");
}

export async function uploadCoaAction(formData: FormData) {
  await requireAdmin();
  const productId = formData.get("productId") as string;
  const batchCode = formData.get("batchCode") as string;
  const labName = (formData.get("labName") as string) || null;
  const file = formData.get("file") as File;

  if (!file?.size) throw new Error("No file");

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const filename = `${productId}-${batchCode}-${Date.now()}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), buffer);

  await db.coaDocument.create({
    data: {
      productId,
      batchCode,
      labName,
      fileUrl: `/uploads/${filename}`,
      issuedAt: new Date(),
    },
  });

  revalidatePath(`/admin/products/${productId}`);
  const product = await db.product.findUnique({ where: { id: productId } });
  if (product) revalidatePath(`/products/${product.slug}`);
  revalidatePath("/");
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const orderId = formData.get("orderId") as string;
  const status = formData.get("status") as string;
  const trackingNumber = (formData.get("trackingNumber") as string) || null;

  const order = await db.order.update({
    where: { id: orderId },
    data: {
      status: status as "SHIPPED" | "CANCELLED" | "PAID" | "AWAITING_PAYMENT",
      trackingNumber,
    },
  });

  if (status === "SHIPPED") {
    await sendOrderShippedEmail({
      to: order.email,
      orderId: order.id,
      trackingNumber,
      orderUrl: await orderPublicUrl(order.id, order.accessToken),
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}`);
}

export async function saveStoreSettingsAction(formData: FormData) {
  await requireAdmin();
  const existing = await getStoreSettings();

  const data = {
    siteName: String(formData.get("siteName") ?? existing.siteName),
    legalEntity: String(formData.get("legalEntity") ?? existing.legalEntity),
    siteUrl: String(formData.get("siteUrl") ?? existing.siteUrl).replace(/\/$/, ""),
    researchDisclaimer: String(formData.get("researchDisclaimer") ?? existing.researchDisclaimer),
    defaultLegalNotice: String(formData.get("defaultLegalNotice") ?? existing.defaultLegalNotice),
    blockedCountries: String(formData.get("blockedCountries") ?? existing.blockedCountries),
    paypalEnabled: checkbox(formData, "paypalEnabled"),
    paypalClientId: String(formData.get("paypalClientId") ?? existing.paypalClientId),
    paypalClientSecret: encryptSettingValue(
      pickSecret(formData.get("paypalClientSecret"), existing.paypalClientSecret),
    ),
    paypalMode: String(formData.get("paypalMode") ?? existing.paypalMode),
    cryptoEnabled: checkbox(formData, "cryptoEnabled"),
    manualPaymentEnabled: checkbox(formData, "manualPaymentEnabled"),
    manualPaymentInstructions: String(
      formData.get("manualPaymentInstructions") ?? existing.manualPaymentInstructions,
    ),
    nowpaymentsApiKey: encryptSettingValue(
      pickSecret(formData.get("nowpaymentsApiKey"), existing.nowpaymentsApiKey),
    ),
    nowpaymentsIpnSecret: encryptSettingValue(
      pickSecret(formData.get("nowpaymentsIpnSecret"), existing.nowpaymentsIpnSecret),
    ),
    resendApiKey: encryptSettingValue(
      pickSecret(formData.get("resendApiKey"), existing.resendApiKey),
    ),
    edgeProtectionEnabled: checkbox(formData, "edgeProtectionEnabled"),
    edgeProvider: String(formData.get("edgeProvider") ?? existing.edgeProvider),
    edgeApiKey: encryptSettingValue(
      pickSecret(formData.get("edgeApiKey"), existing.edgeApiKey),
    ),
    emailFrom: String(formData.get("emailFrom") ?? existing.emailFrom),
  };

  await db.storeSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { ...DEFAULT_SETTINGS, ...data },
    update: data,
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}

export async function updateAdminPasswordAction(formData: FormData) {
  await requireAdmin();
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!newPassword || newPassword.length < 8) {
    redirect("/admin/settings?passwordError=short");
  }
  if (newPassword !== confirmPassword) {
    redirect("/admin/settings?passwordError=mismatch");
  }

  const admin = await db.adminUser.findUnique({
    where: { email: session.user.email },
  });
  if (!admin) redirect("/admin/settings?passwordError=invalid");

  const valid = await compare(currentPassword, admin.passwordHash);
  if (!valid) redirect("/admin/settings?passwordError=invalid");

  await db.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash: await hash(newPassword, 12) },
  });

  redirect("/admin/settings?passwordSaved=1");
}

export async function saveCouponAction(formData: FormData) {
  await requireAdmin();
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  const type = String(formData.get("type") ?? "FREE_SHIPPING");
  const maxUsesRaw = String(formData.get("maxUses") ?? "").trim();
  const expiresRaw = String(formData.get("expiresAt") ?? "").trim();

  if (!code || code.length < 3) {
    redirect("/admin/coupons?error=code");
  }
  if (type !== "FREE_SHIPPING") {
    redirect("/admin/coupons?error=type");
  }

  const maxUses = maxUsesRaw ? Number(maxUsesRaw) : null;
  if (maxUsesRaw && (!Number.isFinite(maxUses) || maxUses! < 1)) {
    redirect("/admin/coupons?error=maxUses");
  }

  const expiresAt = expiresRaw ? new Date(expiresRaw) : null;
  if (expiresRaw && Number.isNaN(expiresAt?.getTime())) {
    redirect("/admin/coupons?error=expires");
  }

  await db.coupon.upsert({
    where: { code },
    create: {
      code,
      type: "FREE_SHIPPING",
      isActive: true,
      maxUses,
      expiresAt,
    },
    update: {
      type: "FREE_SHIPPING",
      maxUses,
      expiresAt,
    },
  });

  revalidatePath("/admin/coupons");
  redirect("/admin/coupons?saved=1");
}

export async function toggleCouponAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const coupon = await db.coupon.findUnique({ where: { id } });
  if (!coupon) redirect("/admin/coupons");

  await db.coupon.update({
    where: { id },
    data: { isActive: !coupon.isActive },
  });

  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}

export async function deleteCouponAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await db.coupon.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}
