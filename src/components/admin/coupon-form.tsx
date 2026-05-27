"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveCouponAction } from "@/lib/admin-actions";

export function CouponForm() {
  const [type, setType] = useState<"FREE_SHIPPING" | "PERCENT_OFF">("FREE_SHIPPING");

  return (
    <form action={saveCouponAction} className="glass-strong space-y-4 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-foreground">Create coupon</h2>
      <p>
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          name="code"
          required
          placeholder="MYCODE"
          className="mt-1 font-mono uppercase"
        />
      </p>
      <p>
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className="mt-1 flex h-10 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg-subtle)] px-3 text-sm text-foreground"
        >
          <option value="FREE_SHIPPING">Free shipping</option>
          <option value="PERCENT_OFF">Percent off</option>
        </select>
      </p>
      {type === "PERCENT_OFF" && (
        <p>
          <Label htmlFor="percent">Discount %</Label>
          <Input
            id="percent"
            name="percent"
            type="number"
            min={0.01}
            max={100}
            step={0.01}
            required
            placeholder="9.09"
            className="mt-1"
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            Use 9.09 to undo a 10% markup. Up to 2 decimal places.
          </span>
        </p>
      )}
      <p>
        <Label htmlFor="maxUses">Max uses (optional)</Label>
        <Input id="maxUses" name="maxUses" type="number" min={1} className="mt-1" />
      </p>
      <p>
        <Label htmlFor="expiresAt">Expires (optional)</Label>
        <Input id="expiresAt" name="expiresAt" type="date" className="mt-1" />
      </p>
      <Button type="submit">Save coupon</Button>
    </form>
  );
}
