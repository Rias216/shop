"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { getStoredThemeChoice, resolveTheme, setThemeChoice, subscribeThemeChanges } from "@/lib/theme-client";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const update = () => {
      setResolvedTheme(resolveTheme(getStoredThemeChoice()));
    };
    update();
    return subscribeThemeChanges(update);
  }, []);

  if (!resolvedTheme) {
    return (
      <span
        className={cn("inline-flex h-9 w-9 items-center justify-center rounded-md", className)}
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setThemeChoice(isDark ? "light" : "dark")}
      className={cn(
        "pressable inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-[var(--nav-hover)] hover:text-foreground",
        className,
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
