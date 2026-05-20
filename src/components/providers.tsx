"use client";

import { InstantPrefetch } from "@/components/instant-prefetch";
import { PageScrollField } from "@/components/page-scroll-field";
import { applyResolvedTheme, getStoredThemeChoice, resolveTheme, subscribeThemeChanges } from "@/lib/theme-client";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const perfEnabled = process.env.NEXT_PUBLIC_PERF_LOG === "1";

  useEffect(() => {
    const syncTheme = () => {
      const choice = getStoredThemeChoice();
      applyResolvedTheme(resolveTheme(choice));
    };
    syncTheme();
    return subscribeThemeChanges(syncTheme);
  }, []);

  return (
    <>
      {perfEnabled ? <PageScrollField /> : null}
      <InstantPrefetch />
      <SessionProvider>{children}</SessionProvider>
    </>
  );
}
