/** Lightweight placeholder for the shop home route — not the catalog grid. */
export function HomePageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <section
          className="max-w-2xl animate-pulse space-y-3 py-6 md:py-10"
          aria-busy="true"
          aria-label="Loading home"
        >
          <div className="h-4 w-24 rounded-md bg-[var(--glass-bg-subtle)]" />
          <div className="h-9 w-4/5 max-w-md rounded-md bg-[var(--glass-bg-subtle)]" />
          <div className="h-4 w-full max-w-lg rounded-md bg-[var(--glass-bg-subtle)]" />
          <div className="h-4 w-11/12 max-w-md rounded-md bg-[var(--glass-bg-subtle)]" />
          <div className="flex gap-3 pt-2">
            <div className="h-10 w-28 rounded-md bg-[var(--glass-bg-hover)]" />
            <div className="h-10 w-24 rounded-md bg-[var(--glass-bg-subtle)]" />
          </div>
      </section>
    </div>
  );
}
