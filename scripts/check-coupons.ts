import { db } from "../src/lib/db";
import { validateCouponCode } from "../src/lib/coupons";
import { quoteOrder } from "../src/lib/shipping";

async function main() {
  const all = await db.coupon.findMany();
  console.log("All coupons:");
  console.log(JSON.stringify(all, null, 2));

  console.log("\nValidating ILOVEMOM at subtotal 16500 cents ($165):");
  const v = await validateCouponCode("ILOVEMOM", 16500);
  console.log(JSON.stringify(v, null, 2));

  if (v.ok) {
    const q = quoteOrder(16500, {
      freeShipping: v.coupon.freeShipping,
      couponLabel: v.coupon.label,
      percentBps: v.coupon.percentBps,
      discountLabel: v.coupon.label,
    });
    console.log("\nQuote:");
    console.log(JSON.stringify(q, null, 2));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
