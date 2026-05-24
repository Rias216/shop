export function CatalogHero() {
  return (
    <header className="catalog-hero glass-strong relative mb-8 overflow-hidden rounded-lg">
      <div className="catalog-hero-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative border-b border-[var(--divider)] px-6 py-6 md:px-9 md:py-7">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-accent">
          Just Peps
        </p>
        <h1 className="mt-2 text-balance text-xl font-medium tracking-tight text-foreground md:text-2xl">
          Research peptide catalog
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
          In-vitro laboratory use only. Search by name or SKU, or browse by type.
        </p>
      </div>
    </header>
  );
}
