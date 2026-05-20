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
};

/** Cache tags for product-related data. */
export const PRODUCT_CACHE_TAGS = {
  homePopular: "home:popular",
  homeNew: "home:new",
  catalog: "catalog",
} as const;
