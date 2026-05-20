import Link from "next/link";
import type { ReactNode } from "react";

type LegalPageProps = {
  title: string;
  children: ReactNode;
};

export function LegalPage({ title, children }: LegalPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="text-2xl font-medium text-foreground md:text-3xl">{title}</h1>
      <div className="glass-strong mt-8 space-y-4 p-6 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
      <Link href="/" className="mt-8 inline-block text-sm text-accent hover:underline">
        ← Back to home
      </Link>
    </div>
  );
}
