"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AppliedCoupon } from "@/lib/coupons";

type Props = {
  subtotalCents: number;
  initialCode?: string | null;
  applied: AppliedCoupon | null;
  onApplied: (coupon: AppliedCoupon | null, code: string | null) => void;
};

export function CouponField({ subtotalCents, initialCode, applied, onApplied }: Props) {
  const [input, setInput] = useState(initialCode ?? applied?.code ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function apply() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: input, subtotalCents }),
      });
      const json = (await res.json()) as { error?: string; coupon?: AppliedCoupon };
      if (!res.ok) {
        onApplied(null, null);
        setError(json.error ?? "Invalid coupon");
        return;
      }
      if (json.coupon) {
        setInput(json.coupon.code);
        onApplied(json.coupon, json.coupon.code);
      }
    } catch {
      setError("Could not validate coupon.");
    } finally {
      setLoading(false);
    }
  }

  function remove() {
    setInput("");
    setError(null);
    onApplied(null, null);
  }

  return (
    <div className="space-y-2 border-b border-[var(--outline)] pb-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Coupon
      </p>
      <div className="flex flex-wrap gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder="Code"
          className="min-w-0 flex-1 font-mono uppercase"
          disabled={loading}
        />
        <Button type="button" variant="outline" size="sm" onClick={apply} disabled={loading}>
          {loading ? "…" : "Apply"}
        </Button>
        {applied && (
          <Button type="button" variant="ghost" size="sm" onClick={remove}>
            Remove
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {applied && (
        <p className="text-xs text-accent">
          {applied.label} — <span className="font-mono">{applied.code}</span>
        </p>
      )}
    </div>
  );
}
