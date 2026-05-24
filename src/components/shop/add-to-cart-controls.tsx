"use client";

import { useCallback, useState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import { useCsrfToken } from "@/components/shop/csrf-provider";
import { addToCartAction } from "@/lib/cart-actions";
import { CSRF_FORM_FIELD } from "@/lib/csrf-constants";
import {
  ORDER_QTY_STEP,
  ORDER_QTY_MIN_NOTE,
  canOrderProduct,
  clampOrderQty,
  formatOrderQty,
  formatOrderQtyStep,
  maxOrderQty,
} from "@/lib/order-qty";
import { cn } from "@/lib/utils";

type Props = {
  productId: string;
  stock: number;
  className?: string;
  buttonSize?: "sm" | "default" | "lg";
  /** Stack (default) or horizontal row beside dosage select */
  layout?: "stack" | "inline";
};

export function AddToCartControls({
  productId,
  stock,
  className,
  buttonSize = "sm",
  layout = "stack",
}: Props) {
  const csrfToken = useCsrfToken();
  const [qty, setQty] = useState(() =>
    canOrderProduct(stock) ? ORDER_QTY_STEP : 0,
  );

  const clamp = useCallback(
    (n: number) => clampOrderQty(n, stock),
    [stock],
  );

  const bump = (delta: number) => {
    setQty((q) => clamp(q + delta));
  };

  if (!canOrderProduct(stock)) {
    return (
      <p className={cn("product-card-cart-note", className)}>{ORDER_QTY_MIN_NOTE}</p>
    );
  }

  const isInline = layout === "inline";

  return (
    <form
      action={addToCartAction}
      className={cn("product-card-cart", isInline && "product-card-cart--inline", className)}
    >
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="qty" value={qty} readOnly />
      <input type="hidden" name={CSRF_FORM_FIELD} value={csrfToken} />

      <div className="cart-stepper" aria-label="Quantity in vials">
        <QtyButton
          type="button"
          aria-label={`Remove ${ORDER_QTY_STEP} vials`}
          onClick={() => bump(-ORDER_QTY_STEP)}
          disabled={qty <= ORDER_QTY_STEP}
        >
          <StepLabel delta={-ORDER_QTY_STEP} />
        </QtyButton>
        <span className="cart-qty-digit" title={formatOrderQty(qty)}>
          <span className="cart-qty-value">{qty}</span>
          <span className="cart-qty-unit">vials</span>
        </span>
        <QtyButton
          type="button"
          aria-label={`Add ${ORDER_QTY_STEP} vials`}
          onClick={() => bump(ORDER_QTY_STEP)}
          disabled={qty >= maxOrderQty(stock)}
        >
          <StepLabel delta={ORDER_QTY_STEP} />
        </QtyButton>
      </div>

      <SubmitButton
        size={buttonSize}
        pendingLabel="Adding…"
        className="product-card-cart-btn pressable-jitter"
      >
        Add to cart
      </SubmitButton>
    </form>
  );
}

function StepLabel({ delta }: { delta: number }) {
  return (
    <span className="cart-stepper-step">
      <span className="cart-stepper-step-num">{formatOrderQtyStep(delta)}</span>
      <span className="cart-stepper-step-unit">vials</span>
    </span>
  );
}

function QtyButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn("cart-stepper-btn pressable-jitter", className)}
      {...props}
    >
      {children}
    </button>
  );
}
