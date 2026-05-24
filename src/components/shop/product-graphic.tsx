import { cn } from "@/lib/utils";
import {
  getCategoryLabel,
  getCategoryTextColor,
  getDisplayCode,
  getProductPalette,
  getStrengthLabel,
} from "@/lib/product-graphic";
import type { ProductCategory } from "@/generated/prisma/client";

const sizeClasses = {
  xs: "h-14 w-14 min-h-0 shrink-0 rounded-md aspect-square",
  sm: "min-h-[5rem] rounded-md",
  md: "aspect-[4/5] min-h-[12rem] rounded-t-lg rounded-b-none",
  lg: "aspect-square min-h-[16rem] rounded-lg",
} as const;

const codeSizeClasses = {
  xs: "text-[0.65rem]",
  sm: "text-sm",
  md: "text-2xl md:text-3xl",
  lg: "text-3xl md:text-4xl",
} as const;

type Props = {
  slug: string;
  name: string;
  sku: string;
  category: ProductCategory;
  size?: keyof typeof sizeClasses;
  variantLabel?: string | null;
  /** Catalog cards: show category label instead of mg strength. */
  preferCategorySubtitle?: boolean;
  className?: string;
};

export function ProductGraphic({
  slug,
  name,
  sku,
  category,
  size = "md",
  variantLabel,
  preferCategorySubtitle = false,
  className,
}: Props) {
  const palette = getProductPalette(category, slug);
  const displayCode = getDisplayCode({ name, sku });
  const strengthLabel = preferCategorySubtitle
    ? null
    : getStrengthLabel(name, variantLabel);
  const categoryLabel = getCategoryLabel(category);
  const categoryColor = getCategoryTextColor(category);
  const compact = size === "xs" || size === "sm";

  return (
    <div
      className={cn("product-graphic relative overflow-hidden", sizeClasses[size], className)}
      style={{ background: palette.base }}
      aria-hidden
    >
      <span
        className="product-graphic-blob absolute -left-[8%] -top-[15%] h-[55%] w-[55%] rounded-full opacity-80"
        style={{ background: palette.blob1 }}
      />
      <span
        className="product-graphic-blob absolute -bottom-[10%] -right-[8%] h-[50%] w-[50%] rounded-full opacity-75"
        style={{ background: palette.blob2 }}
      />
      <span
        className="product-graphic-blob absolute left-[35%] top-[45%] h-[40%] w-[40%] rounded-full opacity-65"
        style={{ background: palette.blob3 }}
      />

      <div
        className={cn(
          "relative z-10 flex h-full flex-col",
          size === "xs" ? "p-1" : "p-3 md:p-4",
        )}
      >
        {!compact && (
          <span
            className="text-[10px] font-semibold uppercase tracking-widest md:text-xs"
            style={{ color: palette.textLabel }}
          >
            Research
          </span>
        )}
        <span
          className={cn(
            "flex flex-col items-center justify-center text-center",
            size === "xs" ? "py-0" : "flex-1 py-4",
            size === "sm" && "py-1",
          )}
        >
          <span
            className={cn(
              "product-graphic-code font-bold leading-none tracking-tight",
              codeSizeClasses[size],
            )}
            style={{ color: palette.textCode }}
          >
            {displayCode}
          </span>
          {size !== "xs" && (strengthLabel || !compact) && (
            <span
              className={cn(
                "font-semibold uppercase tracking-wider",
                compact
                  ? "mt-0.5 text-[0.55rem]"
                  : "mt-2 text-xs md:text-sm",
              )}
              style={{ color: strengthLabel ? palette.textCode : categoryColor }}
            >
              {strengthLabel ?? categoryLabel}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
