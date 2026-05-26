import Link from "next/link";
import { getStoreSettings } from "@/lib/settings";

const FAQ = [
  {
    q: "Are these products for human use?",
    a: "No. All kits are sold strictly for in-vitro laboratory research. They are not drugs, foods, or cosmetics.",
  },
  {
    q: "How do I order?",
    a: "Choose your product and dosage, set quantity in steps of 10 vials, and add to cart. Checkout is available when payment methods are enabled in store settings.",
  },
  {
    q: "Where are COAs?",
    a: "Certificates of Analysis are linked on product pages when we have a batch on file. Not every SKU has a COA uploaded yet.",
  },
  {
    q: "Where do you ship?",
    a: "We ship to the United States and Europe only. Orders outside these regions cannot be fulfilled.",
  },
  {
    q: "Shipping times",
    a: "Orders ship from our warehouse in the United States (for US orders) or our warehouse in China (for European orders). Delivery takes 5–14 business days after payment is confirmed, depending on destination and carrier.",
  },
] as const;

export default async function SupportPage() {
  const settings = await getStoreSettings();
  const contactEmail = settings.emailFrom;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="text-2xl font-medium text-foreground md:text-3xl">Support</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Questions about orders, COAs, or research use — reach out below.
      </p>

      <section className="glass-strong mt-8 p-6">
        <h2 className="text-lg font-medium text-foreground">Contact</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Email{" "}
          <a href={`mailto:${contactEmail}`} className="font-medium text-accent hover:underline">
            {contactEmail}
          </a>
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          {settings.siteName} · {settings.legalEntity}
        </p>
      </section>

      <section className="glass-strong mt-6 p-6">
        <h2 className="text-lg font-medium text-foreground">FAQ</h2>
        <dl className="mt-4 space-y-5">
          {FAQ.map((item) => (
            <div key={item.q}>
              <dt className="text-sm font-medium text-foreground">{item.q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="glass-strong mt-6 p-6">
        <h2 className="text-lg font-medium text-foreground">Legal</h2>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {settings.researchDisclaimer}
        </p>
      </section>

      <Link href="/" className="mt-8 inline-block text-sm text-accent hover:underline">
        ← Back to home
      </Link>
    </div>
  );
}
