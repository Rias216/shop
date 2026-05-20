"use client";

import { useCallback, useState, useTransition } from "react";
import { updateCartAction } from "@/lib/cart-actions";
import {
  ORDER_QTY_STEP,
  clampOrderQty,
  formatOrderQty,
  formatOrderQtyStep,
  maxOrderQty,
} from "@/lib/order-qty";
import { cn } from "@/lib/utils";

type Props = {
  productId: string;
  initialQty: number;
  stock: number;
  /** Compact layout for cart rows (smaller stepper, no unit sublabels on +/-) */
  compact?: boolean;
  className?: string;
};

export function CartQtyStepper({
  productId,
  initialQty,
  stock,
  compact = false,
  className,
}: Props) {
  const [qty, setQty] = useState(initialQty);
  const [isPending, startTransition] = useTransition();

  const submit = useCallback(
    (next: number) => {
      const safe = clampOrderQty(next, stock);
      setQty(safe);
      const formData = new FormData();
      formData.set("productId", productId);
      formData.set("qty", String(safe));
      startTransition(async () => {
        await updateCartAction(formData);
      });
    },
    [productId, stock],
  );

  const remove = () => {
    setQty(0);
    const formData = new FormData();
    formData.set("productId", productId);
    formData.set("qty", "0");
    startTransition(async () => {
      await updateCartAction(formData);
    });
  };

  const canDec = qty > ORDER_QTY_STEP;
  const canInc = qty < maxOrderQty(stock);

  return (
    <div
      className={cn("cart-qty-row", compact && "cart-qty-row--compact", className)}
      aria-busy={isPending}
    >
      <div
        className={cn("cart-stepper", compact && "cart-stepper--compact")}
        aria-label="Quantity in vials"
      >
        <button
          type="button"
          className="cart-stepper-btn pressable-jitter"
          onClick={() => submit(qty - ORDER_QTY_STEP)}
          disabled={!canDec || isPending}
          aria-label={`Remove ${ORDER_QTY_STEP} vials`}
        >
          {compact ? (
            <span className="cart-stepper-step-num">{formatOrderQtyStep(-ORDER_QTY_STEP)}</span>
          ) : (
            <span className="cart-stepper-step">
              <span className="cart-stepper-step-num">{formatOrderQtyStep(-ORDER_QTY_STEP)}</span>
              <span className="cart-stepper-step-unit">vials</span>
            </span>
          )}
        </button>
        <span className="cart-qty-digit" title={formatOrderQty(qty)}>
          <span className="cart-qty-value">{qty}</span>
          {!compact && <span className="cart-qty-unit">vials</span>}
        </span>
        <button
          type="button"
          className="cart-stepper-btn pressable-jitter"
          onClick={() => submit(qty + ORDER_QTY_STEP)}
          disabled={!canInc || isPending}
          aria-label={`Add ${ORDER_QTY_STEP} vials`}
        >
          {compact ? (
            <span className="cart-stepper-step-num">{formatOrderQtyStep(ORDER_QTY_STEP)}</span>
          ) : (
            <span className="cart-stepper-step">
              <span className="cart-stepper-step-num">{formatOrderQtyStep(ORDER_QTY_STEP)}</span>
              <span className="cart-stepper-step-unit">vials</span>
            </span>
          )}
        </button>
      </div>
      <button
        type="button"
        onClick={remove}
        disabled={isPending}
        className="text-xs font-medium text-muted-foreground hover:text-[var(--warning-text)]"
      >
        Remove
      </button>
    </div>
  );
}
