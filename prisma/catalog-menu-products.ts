import { ProductCategory } from "../src/generated/prisma/client";

/** Menu catalog: 2× list price per 10-vial kit (matches order step of 10 vials) */
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

function usd2x(dollars: number): number {
  return Math.round(dollars * 2 * 100);
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
    priceCents: usd2x(listUsd),
    stock: 100,
    purity: "≥98%",
    images: peptideImage,
    groupKey: base,
    variantLabel: `${mg}mg`,
  };
}

export const catalogMenuProducts: CatalogProductSeed[] = [
  // Retatrutide — 5–30 mg (menu list; store 2×, 5 vials/kit)
  glpKit("Retatrutide", 5, "RT5", 80),
  glpKit("Retatrutide", 10, "RT10", 130),
  glpKit("Retatrutide", 15, "RT15", 180),
  glpKit("Retatrutide", 20, "RT20", 198),
  glpKit("Retatrutide", 30, "RT30", 260),

  // Tirzepatide — 5–30 mg
  glpKit("Tirzepatide", 5, "TR5", 55),
  glpKit("Tirzepatide", 10, "TR10", 78),
  glpKit("Tirzepatide", 15, "TR15", 98),
  glpKit("Tirzepatide", 20, "TR20", 108),
  glpKit("Tirzepatide", 30, "TR30", 138),

  // Second sheet — one strength each (10mg unless noted)
  {
    name: "Sermorelin 10mg Research Kit",
    slug: "sermorelin-10mg",
    sku: "PEP-SERMO10",
    category: ProductCategory.GROWTH_SECRETAGOGUE,
    description: DESC("Sermorelin research peptide", 10),
    priceCents: usd2x(150),
    stock: 100,
    purity: "≥98%",
    images: peptideImage,
  },
  {
    name: "MOTS-c 10mg Research Kit",
    slug: "mots-c-10mg",
    sku: "PEP-MOTSC10",
    category: ProductCategory.MITOCHONDRIAL,
    description: DESC("MOTS-c mitochondrial peptide", 10),
    priceCents: usd2x(75),
    stock: 100,
    purity: "≥98%",
    images: peptideImage,
  },
  {
    name: "Semax 10mg Research Kit",
    slug: "semax-10mg",
    sku: "PEP-SX10",
    category: ProductCategory.NEUROPEPTIDE,
    description: DESC("Semax research peptide", 10),
    priceCents: usd2x(55),
    stock: 100,
    purity: "≥99%",
    images: peptideImage,
  },
  {
    name: "Selank 10mg Research Kit",
    slug: "selank-10mg",
    sku: "PEP-SK10",
    category: ProductCategory.NEUROPEPTIDE,
    description: DESC("Selank research peptide", 10),
    priceCents: usd2x(55),
    stock: 100,
    purity: "≥99%",
    images: peptideImage,
  },
  {
    name: "SLU-PP-332 5mg Research Kit",
    slug: "slu-pp-332-5mg",
    sku: "PEP-SLUPP332",
    category: ProductCategory.MITOCHONDRIAL,
    description: DESC("SLU-PP-332 research compound", 5),
    priceCents: usd2x(65),
    stock: 100,
    purity: "≥98%",
    images: peptideImage,
  },
  {
    name: "Epithalon 10mg Research Kit",
    slug: "epithalon-10mg",
    sku: "PEP-EPI10",
    category: ProductCategory.LONGEVITY,
    description: DESC("Epithalon research peptide", 10),
    priceCents: usd2x(55),
    stock: 100,
    purity: "≥98%",
    images: peptideImage,
  },
  {
    name: "SS-31 10mg Research Kit",
    slug: "ss-31-10mg",
    sku: "PEP-SS31",
    category: ProductCategory.MITOCHONDRIAL,
    description: DESC("SS-31 research peptide", 10),
    priceCents: usd2x(100),
    stock: 100,
    purity: "≥98%",
    images: peptideImage,
  },
  {
    name: "Ipamorelin 10mg Research Kit",
    slug: "ipamorelin-10mg",
    sku: "PEP-IPA10",
    category: ProductCategory.GROWTH_SECRETAGOGUE,
    description: DESC("Ipamorelin research peptide", 10),
    priceCents: usd2x(75),
    stock: 100,
    purity: "≥98%",
    images: peptideImage,
  },
  {
    name: "MT-2 10mg Research Kit",
    slug: "mt-2-10mg",
    sku: "PEP-MT2",
    category: ProductCategory.MELANOCORTIN,
    description: DESC("MT-2 research peptide", 10),
    priceCents: usd2x(55),
    stock: 100,
    purity: "≥98%",
    images: peptideImage,
  },
  {
    name: "CJC-1295 (no DAC) 10mg Research Kit",
    slug: "cjc-1295-10mg",
    sku: "PEP-CJC10",
    category: ProductCategory.GROWTH_SECRETAGOGUE,
    description: DESC("CJC-1295 without DAC research peptide", 10),
    priceCents: usd2x(155),
    stock: 100,
    purity: "≥98%",
    images: peptideImage,
  },
  {
    name: "TB-500 + BPC-157 Blend 10mg Research Kit",
    slug: "tb500-bpc157-10mg",
    sku: "PEP-BB10",
    category: ProductCategory.HEALING_REPAIR,
    description: DESC("TB-500 and BPC-157 blend", 10, "Dual-peptide research formulation."),
    priceCents: usd2x(120),
    stock: 100,
    purity: "≥98%",
    images: peptideImage,
  },
  {
    name: "KPV 10mg Research Kit",
    slug: "kpv-10mg",
    sku: "PEP-KPV",
    category: ProductCategory.HEALING_REPAIR,
    description: DESC("KPV research peptide", 10),
    priceCents: usd2x(55),
    stock: 100,
    purity: "≥98%",
    images: peptideImage,
  },
  {
    name: "Bacteriostatic Water 10ml Research Kit",
    slug: "bac-water-10ml",
    sku: "PEP-BAC10",
    category: ProductCategory.SUPPLIES,
    description:
      "Bacteriostatic water for laboratory reconstitution. 10ml/vial, 10 vials/kit. Not for injection or human use.",
    priceCents: usd2x(25),
    stock: 100,
    purity: "≥99%",
    images: peptideImage,
  },
];
