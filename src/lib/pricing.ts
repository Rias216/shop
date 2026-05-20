import { ORDER_QTY_STEP } from "@/lib/order-qty";
import { formatPrice } from "@/lib/utils";

/** `priceCents` on products = price for one order block (10 vials). */
export function lineTotalCents(blockPriceCents: number, vialQty: number): number {
  return Math.round((blockPriceCents * vialQty) / ORDER_QTY_STEP);
}

export function unitPricePerVialCents(blockPriceCents: number): number {
  return Math.round(blockPriceCents / ORDER_QTY_STEP);
}

export function formatBlockPrice(blockPriceCents: number): string {
  return `${formatPrice(blockPriceCents)} / ${ORDER_QTY_STEP} vials`;
}

export function formatPerVialPrice(blockPriceCents: number): string {
  return `${formatPrice(unitPricePerVialCents(blockPriceCents))} / 1 vial`;
}
