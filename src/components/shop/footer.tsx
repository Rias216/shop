export function ShopFooter({
  legalEntity,
  disclaimer,
}: {
  legalEntity: string;
  disclaimer: string;
}) {
  return (
    <footer className="relative z-10 mt-auto glass-subtle border-t border-[var(--glass-border)]">
      <aside className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">
          {legalEntity} ·{" "}
          <a
            href="https://peptides.cafe"
            className="text-accent hover:underline"
            rel="noopener noreferrer"
          >
            peptides.cafe
          </a>
        </p>
        <p className="mt-4 max-w-3xl leading-relaxed">{disclaimer}</p>
      </aside>
    </footer>
  );
}
