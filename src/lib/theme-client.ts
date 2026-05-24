"use client";

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const THEME_KEY = "theme";
const THEME_EVENT = "themechange";

export function getStoredThemeChoice(): ThemeChoice {
  const raw = window.localStorage.getItem(THEME_KEY);
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
}

export function resolveTheme(choice: ThemeChoice): ResolvedTheme {
  if (choice === "light" || choice === "dark") return choice;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyResolvedTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

export function setThemeChoice(choice: ThemeChoice) {
  window.localStorage.setItem(THEME_KEY, choice);
  applyResolvedTheme(resolveTheme(choice));
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function subscribeThemeChanges(callback: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onMedia = () => {
    if (getStoredThemeChoice() === "system") callback();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_KEY) callback();
  };
  const onThemeEvent = () => callback();

  media.addEventListener("change", onMedia);
  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_EVENT, onThemeEvent);

  return () => {
    media.removeEventListener("change", onMedia);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_EVENT, onThemeEvent);
  };
}
