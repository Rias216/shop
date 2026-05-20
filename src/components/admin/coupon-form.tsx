import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveCouponAction } from "@/lib/admin-actions";

export function CouponForm() {
  return (
    <form action={saveCouponAction} className="glass-strong space-y-4 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-foreground">Create coupon</h2>
      <p>
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          name="code"
          required
          placeholder="FREESHIP"
          className="mt-1 font-mono uppercase"
        />
      </p>
      <p>
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          name="type"
          defaultValue="FREE_SHIPPING"
          className="mt-1 flex h-10 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg-subtle)] px-3 text-sm"
        >
          <option value="FREE_SHIPPING">Free shipping</option>
        </select>
      </p>
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
