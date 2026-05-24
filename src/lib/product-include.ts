/** Shared Prisma include for product list queries — coa preview only. */
export const productListInclude = {
  coaDocuments: {
    orderBy: { issuedAt: "desc" as const },
    take: 1,
    select: {
      id: true,
      fileUrl: true,
      batchCode: true,
      issuedAt: true,
      labName: true,
    },
  },
} as const;

/** Fields required for catalog/home cards and grouping (excludes description, legalNotice, images). */
export const productListSelect = {
  id: true,
  slug: true,
  sku: true,
  name: true,
  category: true,
  variantLabel: true,
  groupKey: true,
  priceCents: true,
  purity: true,
  stock: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  coaDocuments: productListInclude.coaDocuments,
} as const;

/** PDP / variant picker — list fields plus description, legal copy, full COA list. */
export const productDetailSelect = {
  ...productListSelect,
  description: true,
  legalNotice: true,
  casNumber: true,
  images: true,
  coaDocuments: {
    orderBy: { issuedAt: "desc" as const },
    select: {
      id: true,
      fileUrl: true,
      batchCode: true,
      issuedAt: true,
      labName: true,
    },
  },
} as const;

/** Cache tags for product-related data. */
export const PRODUCT_CACHE_TAGS = {
  homePopular: "home:popular",
  homeNew: "home:new",
  catalog: "catalog",
} as const;
