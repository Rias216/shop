import { redirect } from "next/navigation";
import { HomeLanding } from "@/components/shop/home-landing";
import { catalogHref } from "@/lib/catalog";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  if (params.category || params.q?.trim()) {
    redirect(catalogHref({ category: params.category, q: params.q }));
  }

  return <HomeLanding />;
}
