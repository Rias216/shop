import type { ProductCategory } from "@/generated/prisma/client";

export type ProductPalette = {
  id: number;
  blob1: string;
  blob2: string;
  blob3: string;
  base: string;
  textLabel: string;
  textCode: string;
};

export {
  getCategoryLabel,
  getCategoryTextColor,
} from "@/lib/product-categories";

/** Distinct palette sets per category — slug picks a variant within the category. */
const CATEGORY_PALETTES: Record<ProductCategory, ProductPalette[]> = {
  GLP1_METABOLIC: [
    {
      id: 0,
      base: "linear-gradient(145deg, #1e3a5f 0%, #3b82f6 45%, #93c5fd 100%)",
      blob1: "#2563eb",
      blob2: "#60a5fa",
      blob3: "#bfdbfe",
      textLabel: "rgba(239, 246, 255, 0.9)",
      textCode: "#ffffff",
    },
    {
      id: 1,
      base: "linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #38bdf8 100%)",
      blob1: "#0369a1",
      blob2: "#0ea5e9",
      blob3: "#7dd3fc",
      textLabel: "rgba(224, 242, 254, 0.9)",
      textCode: "#f0f9ff",
    },
    {
      id: 2,
      base: "linear-gradient(150deg, #312e81 0%, #6366f1 55%, #a5b4fc 100%)",
      blob1: "#4f46e5",
      blob2: "#818cf8",
      blob3: "#c7d2fe",
      textLabel: "rgba(238, 242, 255, 0.88)",
      textCode: "#ffffff",
    },
  ],
  GROWTH_SECRETAGOGUE: [
    {
      id: 10,
      base: "linear-gradient(145deg, #14532d 0%, #22c55e 45%, #86efac 100%)",
      blob1: "#15803d",
      blob2: "#4ade80",
      blob3: "#bbf7d0",
      textLabel: "rgba(220, 252, 231, 0.9)",
      textCode: "#ffffff",
    },
    {
      id: 11,
      base: "linear-gradient(135deg, #064e3b 0%, #10b981 50%, #6ee7b7 100%)",
      blob1: "#047857",
      blob2: "#34d399",
      blob3: "#a7f3d0",
      textLabel: "rgba(236, 253, 245, 0.88)",
      textCode: "#ecfdf5",
    },
  ],
  HEALING_REPAIR: [
    {
      id: 20,
      base: "linear-gradient(145deg, #7c2d12 0%, #ea580c 40%, #fdba74 100%)",
      blob1: "#c2410c",
      blob2: "#fb923c",
      blob3: "#fed7aa",
      textLabel: "rgba(255, 247, 237, 0.9)",
      textCode: "#fff7ed",
    },
    {
      id: 21,
      base: "linear-gradient(135deg, #78350f 0%, #d97706 50%, #fcd34d 100%)",
      blob1: "#b45309",
      blob2: "#f59e0b",
      blob3: "#fde68a",
      textLabel: "rgba(254, 243, 199, 0.9)",
      textCode: "#fffbeb",
    },
  ],
  MITOCHONDRIAL: [
    {
      id: 30,
      base: "linear-gradient(145deg, #4c1d95 0%, #8b5cf6 50%, #c4b5fd 100%)",
      blob1: "#6d28d9",
      blob2: "#a78bfa",
      blob3: "#ddd6fe",
      textLabel: "rgba(245, 243, 255, 0.9)",
      textCode: "#faf5ff",
    },
    {
      id: 31,
      base: "linear-gradient(135deg, #5b21b6 0%, #a855f7 45%, #e9d5ff 100%)",
      blob1: "#7e22ce",
      blob2: "#c084fc",
      blob3: "#f3e8ff",
      textLabel: "rgba(250, 245, 255, 0.88)",
      textCode: "#ffffff",
    },
  ],
  NEUROPEPTIDE: [
    {
      id: 40,
      base: "linear-gradient(145deg, #164e63 0%, #0891b2 45%, #67e8f9 100%)",
      blob1: "#0e7490",
      blob2: "#22d3ee",
      blob3: "#a5f3fc",
      textLabel: "rgba(236, 254, 255, 0.9)",
      textCode: "#ecfeff",
    },
    {
      id: 41,
      base: "linear-gradient(135deg, #134e4a 0%, #14b8a6 50%, #5eead4 100%)",
      blob1: "#0f766e",
      blob2: "#2dd4bf",
      blob3: "#99f6e4",
      textLabel: "rgba(240, 253, 250, 0.9)",
      textCode: "#ffffff",
    },
  ],
  LONGEVITY: [
    {
      id: 50,
      base: "linear-gradient(145deg, #831843 0%, #db2777 45%, #f9a8d4 100%)",
      blob1: "#9d174d",
      blob2: "#ec4899",
      blob3: "#fbcfe8",
      textLabel: "rgba(253, 242, 248, 0.9)",
      textCode: "#fff1f2",
    },
    {
      id: 51,
      base: "linear-gradient(135deg, #701a75 0%, #c026d3 50%, #e879f9 100%)",
      blob1: "#a21caf",
      blob2: "#d946ef",
      blob3: "#f0abfc",
      textLabel: "rgba(253, 244, 255, 0.88)",
      textCode: "#ffffff",
    },
  ],
  MELANOCORTIN: [
    {
      id: 60,
      base: "linear-gradient(145deg, #713f12 0%, #ca8a04 45%, #fde047 100%)",
      blob1: "#a16207",
      blob2: "#eab308",
      blob3: "#fef08a",
      textLabel: "rgba(254, 252, 232, 0.9)",
      textCode: "#422006",
    },
    {
      id: 61,
      base: "linear-gradient(135deg, #7f1d1d 0%, #dc2626 40%, #fca5a5 100%)",
      blob1: "#b91c1c",
      blob2: "#ef4444",
      blob3: "#fecaca",
      textLabel: "rgba(254, 242, 242, 0.88)",
      textCode: "#ffffff",
    },
  ],
  SUPPLIES: [
    {
      id: 70,
      base: "linear-gradient(145deg, #1e293b 0%, #475569 50%, #94a3b8 100%)",
      blob1: "#334155",
      blob2: "#64748b",
      blob3: "#cbd5e1",
      textLabel: "rgba(248, 250, 252, 0.85)",
      textCode: "#f8fafc",
    },
    {
      id: 71,
      base: "linear-gradient(135deg, #0f172a 0%, #334155 45%, #64748b 100%)",
      blob1: "#1e293b",
      blob2: "#475569",
      blob3: "#94a3b8",
      textLabel: "rgba(226, 232, 240, 0.8)",
      textCode: "#f1f5f9",
    },
  ],
};

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Category-first palette with slug-based variation inside each category. */
export function getProductPalette(category: ProductCategory, slug: string): ProductPalette {
  const variants = CATEGORY_PALETTES[category] ?? CATEGORY_PALETTES.GLP1_METABOLIC;
  return variants[hashSlug(slug) % variants.length]!;
}

/** @deprecated Use getProductPalette(category, slug) */
export function getProductPaletteBySlug(slug: string): ProductPalette {
  return CATEGORY_PALETTES.GLP1_METABOLIC[hashSlug(slug) % CATEGORY_PALETTES.GLP1_METABOLIC.length]!;
}

export function getCompoundName(name: string): string {
  const base = name
    .replace(/\s*\(.*?\)\s*/g, "")
    .replace(/\s+research\s+kit/gi, "")
    .replace(/\s+kit/gi, "")
    .trim();
  const beforeMg = base.split(/\s+\d+(?:\.\d+)?\s*mg/i)[0]?.trim();
  return beforeMg || base.split(/\s+/)[0] || name;
}

export function getStrengthLabel(name: string, variantLabel?: string | null): string | null {
  if (variantLabel?.trim()) {
    const v = variantLabel.trim();
    return /mg$/i.test(v) ? v.toUpperCase() : `${v.toUpperCase()}MG`;
  }
  const m = name.match(/(\d+(?:\.\d+)?)\s*mg/i);
  return m ? `${m[1]}MG` : null;
}

export function getDisplayCode(params: { name: string; sku: string }): string {
  const compound = getCompoundName(params.name);
  const words = compound.split(/\s+/).filter(Boolean);
  if (words.length === 1 && words[0]!.length >= 3) {
    return words[0]!.toUpperCase();
  }
  if (words.length > 1) {
    return words.map((w) => w.toUpperCase()).join(" ");
  }

  const sku = params.sku.trim();
  if (/^GLP-(RT|TR)\d+$/i.test(sku)) {
    return sku.toUpperCase().startsWith("GLP-RT") ? "RETATRUTIDE" : "TIRZEPATIDE";
  }

  return sku.slice(0, 16).toUpperCase() || "PEPTIDE";
}
