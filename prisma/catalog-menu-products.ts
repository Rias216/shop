import { ProductCategory } from "../src/generated/prisma/client";

/** Menu catalog: 1.5× wholesale list price per 10-vial kit (50% markup). */
export type CatalogProductSeed = {
  name: string;
  slug: string;
  sku: string;
  category: ProductCategory;
  description: string;
  priceCents: number;
  stock: number;
  purity: string;
  casNumber?: string;
  images: string[];
  groupKey?: string;
  variantLabel?: string;
};

const KIT = "10 vials/kit";
const DESC = (compound: string, mg: number, extra?: string) =>
  `${compound} for in-vitro laboratory research only. Lyophilized powder, ${mg}mg/vial, ${KIT}.${extra ? ` ${extra}` : ""} ≥98% purity by HPLC where applicable.`;

const peptideImage = ["/products/peptide-placeholder.svg"];

/** Apply 50% markup over the wholesale list price, in cents. */
function kitPriceCents(listUsd: number): number {
  return Math.round(listUsd * 1.5 * 100);
}

function glpKit(
  compound: "Retatrutide" | "Tirzepatide",
  mg: number,
  code: string,
  listUsd: number,
): CatalogProductSeed {
  const base = compound.toLowerCase();
  return {
    name: `${compound} ${mg}mg Research Kit`,
    slug: `${base}-${mg}mg`,
    sku: `GLP-${code}`,
    category: ProductCategory.GLP1_METABOLIC,
    description: DESC(`${compound} research peptide`, mg),
    priceCents: kitPriceCents(listUsd),
    stock: 9999,
    purity: "≥98%",
    images: peptideImage,
    groupKey: base,
    variantLabel: `${mg}mg`,
  };
}

function groupedPeptideKit(args: {
  name: string;
  slug: string;
  sku: string;
  category: ProductCategory;
  mg: number;
  listUsd: number;
  purity?: string;
  groupKey: string;
  extra?: string;
}): CatalogProductSeed {
  return {
    name: `${args.name} ${args.mg}mg Research Kit`,
    slug: args.slug,
    sku: args.sku,
    category: args.category,
    description: DESC(`${args.name} research peptide`, args.mg, args.extra),
    priceCents: kitPriceCents(args.listUsd),
    stock: 9999,
    purity: args.purity ?? "≥98%",
    images: peptideImage,
    groupKey: args.groupKey,
    variantLabel: `${args.mg}mg`,
  };
}

export const catalogMenuProducts: CatalogProductSeed[] = [
  // Retatrutide — 5–60 mg
  glpKit("Retatrutide", 5, "RT5", 80),
  glpKit("Retatrutide", 10, "RT10", 130),
  glpKit("Retatrutide", 15, "RT15", 180),
  glpKit("Retatrutide", 20, "RT20", 198),
  glpKit("Retatrutide", 30, "RT30", 260),
  glpKit("Retatrutide", 40, "RT40", 290),
  glpKit("Retatrutide", 50, "RT50", 340),
  glpKit("Retatrutide", 60, "RT60", 380),

  // Tirzepatide — 5–120 mg
  glpKit("Tirzepatide", 5, "TR5", 55),
  glpKit("Tirzepatide", 10, "TR10", 78),
  glpKit("Tirzepatide", 15, "TR15", 98),
  glpKit("Tirzepatide", 20, "TR20", 108),
  glpKit("Tirzepatide", 30, "TR30", 138),
  glpKit("Tirzepatide", 40, "TR40", 170),
  glpKit("Tirzepatide", 60, "TR60", 250),
  glpKit("Tirzepatide", 120, "TR120", 450),

  // Sermorelin — 5 mg, 10 mg
  groupedPeptideKit({
    name: "Sermorelin",
    slug: "sermorelin-5mg",
    sku: "SERMO5",
    category: ProductCategory.GROWTH_SECRETAGOGUE,
    mg: 5,
    listUsd: 121,
    groupKey: "sermorelin",
  }),
  groupedPeptideKit({
    name: "Sermorelin",
    slug: "sermorelin-10mg",
    sku: "SERMO10",
    category: ProductCategory.GROWTH_SECRETAGOGUE,
    mg: 10,
    listUsd: 150,
    groupKey: "sermorelin",
  }),

  // MOTS-c — 10 mg, 40 mg
  groupedPeptideKit({
    name: "MOTS-c",
    slug: "mots-c-10mg",
    sku: "MOTS-C10",
    category: ProductCategory.MITOCHONDRIAL,
    mg: 10,
    listUsd: 75,
    groupKey: "mots-c",
  }),
  groupedPeptideKit({
    name: "MOTS-c",
    slug: "mots-c-40mg",
    sku: "MOTS-C40",
    category: ProductCategory.MITOCHONDRIAL,
    mg: 40,
    listUsd: 200,
    groupKey: "mots-c",
  }),

  // Single-strength entries from second sheet
  {
    name: "Semax 10mg Research Kit",
    slug: "semax-10mg",
    sku: "SX10",
    category: ProductCategory.NEUROPEPTIDE,
    description: DESC("Semax research peptide", 10),
    priceCents: kitPriceCents(55),
    stock: 9999,
    purity: "≥99%",
    images: peptideImage,
  },
  {
    name: "Selank 10mg Research Kit",
    slug: "selank-10mg",
    sku: "SK10",
    category: ProductCategory.NEUROPEPTIDE,
    description: DESC("Selank research peptide", 10),
    priceCents: kitPriceCents(55),
    stock: 9999,
    purity: "≥99%",
    images: peptideImage,
  },
  {
    name: "SLU-PP-332 5mg Research Kit",
    slug: "slu-pp-332-5mg",
    sku: "SLUPP332",
    category: ProductCategory.MITOCHONDRIAL,
    description: DESC("SLU-PP-332 research compound", 5),
    priceCents: kitPriceCents(65),
    stock: 9999,
    purity: "≥98%",
    images: peptideImage,
  },
  {
    name: "Epithalon 10mg Research Kit",
    slug: "epithalon-10mg",
    sku: "EPI10",
    category: ProductCategory.LONGEVITY,
    description: DESC("Epithalon research peptide", 10),
    priceCents: kitPriceCents(55),
    stock: 9999,
    purity: "≥98%",
    images: peptideImage,
  },
  {
    name: "SS-31 10mg Research Kit",
    slug: "ss-31-10mg",
    sku: "SS31",
    category: ProductCategory.MITOCHONDRIAL,
    description: DESC("SS-31 research peptide", 10),
    priceCents: kitPriceCents(100),
    stock: 9999,
    purity: "≥98%",
    images: peptideImage,
  },
  {
    name: "Ipamorelin 10mg Research Kit",
    slug: "ipamorelin-10mg",
    sku: "IPA10",
    category: ProductCategory.GROWTH_SECRETAGOGUE,
    description: DESC("Ipamorelin research peptide", 10),
    priceCents: kitPriceCents(75),
    stock: 9999,
    purity: "≥98%",
    images: peptideImage,
  },
  {
    name: "MT-2 10mg Research Kit",
    slug: "mt-2-10mg",
    sku: "MT2",
    category: ProductCategory.MELANOCORTIN,
    description: DESC("MT-2 research peptide", 10),
    priceCents: kitPriceCents(55),
    stock: 9999,
    purity: "≥98%",
    images: peptideImage,
  },
  groupedPeptideKit({
    name: "CJC-1295 (no DAC)",
    slug: "cjc-1295-5mg",
    sku: "CJC5",
    category: ProductCategory.GROWTH_SECRETAGOGUE,
    mg: 5,
    listUsd: 90,
    groupKey: "cjc-1295-no-dac",
    extra: "Without DAC.",
  }),
  groupedPeptideKit({
    name: "CJC-1295 (no DAC)",
    slug: "cjc-1295-10mg",
    sku: "CJC10",
    category: ProductCategory.GROWTH_SECRETAGOGUE,
    mg: 10,
    listUsd: 155,
    groupKey: "cjc-1295-no-dac",
    extra: "Without DAC.",
  }),
  {
    name: "TB-500 + BPC-157 Blend 10mg Research Kit",
    slug: "tb500-bpc157-10mg",
    sku: "BB10",
    category: ProductCategory.HEALING_REPAIR,
    description: DESC("TB-500 and BPC-157 blend", 10, "Dual-peptide research formulation."),
    priceCents: kitPriceCents(120),
    stock: 9999,
    purity: "≥98%",
    images: peptideImage,
  },
  {
    name: "KPV 10mg Research Kit",
    slug: "kpv-10mg",
    sku: "KPV",
    category: ProductCategory.HEALING_REPAIR,
    description: DESC("KPV research peptide", 10),
    priceCents: kitPriceCents(55),
    stock: 9999,
    purity: "≥98%",
    images: peptideImage,
  },
  {
    name: "Bacteriostatic Water 3ml Research Kit",
    slug: "bac-water-3ml",
    sku: "BAC3",
    category: ProductCategory.SUPPLIES,
    description:
      "Bacteriostatic water for laboratory reconstitution. 3ml/vial, 10 vials/kit. Not for injection or human use.",
    priceCents: kitPriceCents(10),
    stock: 9999,
    purity: "≥99%",
    images: peptideImage,
    groupKey: "bac-water",
    variantLabel: "3ml",
  },
  {
    name: "Bacteriostatic Water 10ml Research Kit",
    slug: "bac-water-10ml",
    sku: "BAC10",
    category: ProductCategory.SUPPLIES,
    description:
      "Bacteriostatic water for laboratory reconstitution. 10ml/vial, 10 vials/kit. Not for injection or human use.",
    priceCents: kitPriceCents(25),
    stock: 9999,
    purity: "≥99%",
    images: peptideImage,
    groupKey: "bac-water",
    variantLabel: "10ml",
  },
];
