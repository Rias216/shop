"use client";

import { createContext, useContext, useTransition } from "react";
import { useRouter } from "next/navigation";

type CatalogPendingContextValue = {
  isPending: boolean;
  navigate: (href: string) => void;
  prefetch: (href: string) => void;
};

const CatalogPendingContext = createContext<CatalogPendingContextValue | null>(null);

export function CatalogPendingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = (href: string) => {
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  };

  const prefetch = (href: string) => {
    router.prefetch(href);
  };

  return (
    <CatalogPendingContext.Provider value={{ isPending, navigate, prefetch }}>
      {children}
    </CatalogPendingContext.Provider>
  );
}

export function useCatalogPending() {
  const ctx = useContext(CatalogPendingContext);
  if (!ctx) {
    throw new Error("useCatalogPending must be used within CatalogPendingProvider");
  }
  return ctx;
}
