import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductGridSection } from "@/components/shop/product-grid-section";
import { catalogHref } from "@/lib/catalog";
import { getNewArrivalGroups, getPopularProductGroups } from "@/lib/home-products";
import { getProductRatingSummaries } from "@/lib/reviews";

const QUICK_LINKS = [
  { label: "Weight loss", slug: "weight-loss" as const },
  { label: "Cognitive", slug: "cognitive" as const },
  { label: "Recovery", slug: "recovery" as const },
  { label: "Supplies", slug: "supplies" as const },
];

export async function HomeLanding() {
  const [popular, newArrivals] = await Promise.all([
    getPopularProductGroups(8),
    getNewArrivalGroups(8),
  ]);

  const allIds = [...popular, ...newArrivals].flatMap((g) =>
    g.variants.map((v) => v.id),
  );
  const ratingSummaries = await getProductRatingSummaries([...new Set(allIds)]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
      <section className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-[2.5rem]">
          Research peptide kits
        </h1>
        <div className="mt-5">
          <Button asChild size="lg">
            <Link href={catalogHref({})} prefetch={false}>
              Shop all
            </Link>
          </Button>
        </div>
        <ul className="mt-5 flex flex-wrap gap-2">
          {QUICK_LINKS.map((l) => (
            <li key={l.slug}>
              <Link
                href={catalogHref({ category: l.slug })}
                prefetch={false}
                className="home-quick-link"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {popular.length > 0 && (
        <section className="home-section mt-10">
          <HomeSectionHeader title="Popular" href={catalogHref({ sort: "popular" })} />
          <ProductGridSection
            groups={popular}
            ratingSummaries={ratingSummaries}
            columns="home"
          />
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="home-section mt-10">
          <HomeSectionHeader title="New arrivals" href={catalogHref({ sort: "new" })} />
          <ProductGridSection
            groups={newArrivals}
            ratingSummaries={ratingSummaries}
            columns="home"
          />
        </section>
      )}
    </div>
  );
}

function HomeSectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="home-section-header">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <span className="home-section-divider" aria-hidden />
      <Link href={href} prefetch={false} className="home-section-link">
        View all
      </Link>
    </div>
  );
}
