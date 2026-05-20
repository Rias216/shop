"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  label: string;
  value: string;
  onDebouncedChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
};

/** Catalog-style search field with active pulse + typing dots. */
export function AnimatedSearchInput({
  id,
  label,
  value,
  onDebouncedChange,
  placeholder = "Search…",
  debounceMs = 280,
  className,
}: Props) {
  const [draft, setDraft] = useState(() => value);
  const [isTyping, setIsTyping] = useState(false);

  const push = useDebouncedCallback((next: string) => {
    onDebouncedChange(next);
    setIsTyping(false);
  }, debounceMs);

  const searchActive = isTyping;

  const handleChange = (next: string) => {
    setDraft(next);
    setIsTyping(true);
    push(next);
  };

  const handleClear = () => {
    setDraft("");
    setIsTyping(true);
    onDebouncedChange("");
    setIsTyping(false);
  };

  return (
    <div className={cn("catalog-search-wrap", searchActive && "catalog-search-wrap--active", className)}>
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <div className="relative mt-1.5">
        <Input
          id={id}
          type="search"
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className={cn("catalog-search-input pr-9", searchActive && "catalog-search-input--active")}
          autoComplete="off"
          spellCheck={false}
        />
        {searchActive && (
          <span className="catalog-search-indicator" aria-hidden>
            <span className="catalog-search-dot" />
            <span className="catalog-search-dot" />
            <span className="catalog-search-dot" />
          </span>
        )}
        {draft.length > 0 && !searchActive && (
          <button
            type="button"
            onClick={handleClear}
            className="pressable-float absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-0.5 text-xs font-medium text-muted-foreground hover:bg-[var(--nav-hover)] hover:text-foreground"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
