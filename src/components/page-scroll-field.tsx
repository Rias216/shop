"use client";

import { useEffect } from "react";

/** Drives --page-scroll-* on <html> so the blurred color field shifts with scroll. */
export function PageScrollField() {
  useEffect(() => {
    const reducedMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotionMedia.matches) return;

    const root = document.documentElement;
    let frame = 0;
    let active = true;
    let lastP = -1;
    let lastWave = Number.NaN;

    const paint = () => {
      frame = 0;
      if (!active) return;
      if (reducedMotionMedia.matches) {
        root.style.removeProperty("--page-scroll-p");
        root.style.removeProperty("--page-field-x");
        root.style.removeProperty("--page-field-y");
        root.style.removeProperty("--page-field-rotate");
        root.style.removeProperty("--page-field-hue");
        return;
      }

      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const p = window.scrollY / maxScroll;
      const wave = Math.sin(p * Math.PI * 1.5);
      if (Math.abs(p - lastP) < 0.0015 && Math.abs(wave - lastWave) < 0.0025) {
        return;
      }
      lastP = p;
      lastWave = wave;

      root.style.setProperty("--page-scroll-p", p.toFixed(4));
      root.style.setProperty("--page-field-x", (wave * 1).toFixed(2));
      root.style.setProperty("--page-field-y", (p * 2 + wave * 0.75).toFixed(2));
      root.style.setProperty("--page-field-rotate", (wave * 0.75 - p * 0.4).toFixed(2));
      root.style.setProperty("--page-field-hue", (p * 2 + wave * 0.75).toFixed(2));
    };

    const schedule = () => {
      if (!active) return;
      if (frame) return;
      frame = requestAnimationFrame(paint);
    };

    const onVisibilityChange = () => {
      active = document.visibilityState === "visible";
      if (active) {
        schedule();
      } else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    paint();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      active = false;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      root.style.removeProperty("--page-scroll-p");
      root.style.removeProperty("--page-field-x");
      root.style.removeProperty("--page-field-y");
      root.style.removeProperty("--page-field-rotate");
      root.style.removeProperty("--page-field-hue");
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
