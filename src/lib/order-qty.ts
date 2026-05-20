export const ORDER_QTY_STEP = 10;
export const ORDER_QTY_UNIT = "vials";
export const ORDER_QTY_UNIT_SINGULAR = "vial";

/** Human-readable quantity, e.g. "10 vials" */
export function formatOrderQty(qty: number): string {
  const unit = qty === 1 ? ORDER_QTY_UNIT_SINGULAR : ORDER_QTY_UNIT;
  return `${qty} ${unit}`;
}

/** Step button label, e.g. "+10" (pair with unit line below) */
export function formatOrderQtyStep(delta: number): string {
  const n = Math.abs(delta);
  return `${delta < 0 ? "−" : "+"}${n}`;
}

export const ORDER_QTY_CATALOG_NOTE =
  "Order in +10 vial kits — quantity is vials, not mg strength on the label.";

export const ORDER_QTY_MIN_NOTE = `Minimum order ${ORDER_QTY_STEP} vials`;

export const ORDER_QTY_STOCK_NOTE = (stock: number) =>
  `${stock} vials in stock · sold in +${ORDER_QTY_STEP} vial increments`;

/** Largest multiple of 10 that fits in stock */
export function maxOrderQty(stock: number): number {
  return Math.floor(stock / ORDER_QTY_STEP) * ORDER_QTY_STEP;
}

export function canOrderProduct(stock: number): boolean {
  return maxOrderQty(stock) >= ORDER_QTY_STEP;
}

export function clampOrderQty(qty: number, stock: number): number {
  const max = maxOrderQty(stock);
  if (max < ORDER_QTY_STEP) return 0;
  const snapped = Math.round(qty / ORDER_QTY_STEP) * ORDER_QTY_STEP;
  return Math.min(max, Math.max(ORDER_QTY_STEP, snapped));
}

export function normalizeOrderQty(qty: number, stock: number): number {
  return clampOrderQty(Math.floor(qty), stock);
}

export function isValidOrderQty(qty: number, stock: number): boolean {
  if (qty < ORDER_QTY_STEP || qty % ORDER_QTY_STEP !== 0) return false;
  return qty <= maxOrderQty(stock);
}

export function roundStockToOrderStep(stock: number): number {
  if (stock < ORDER_QTY_STEP) return 0;
  return Math.floor(stock / ORDER_QTY_STEP) * ORDER_QTY_STEP;
}
