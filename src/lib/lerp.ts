/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Ease-out cubic for snappier settle */
export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/** Animate a numeric value with rAF lerp */
export function animateValue(
  from: number,
  to: number,
  durationMs: number,
  onFrame: (value: number) => void,
  onComplete?: () => void,
): () => void {
  let start: number | null = null;
  let raf = 0;

  const tick = (time: number) => {
    if (start === null) start = time;
    const elapsed = time - start;
    const t = Math.min(elapsed / durationMs, 1);
    const eased = easeOutCubic(t);
    onFrame(lerp(from, to, eased));
    if (t < 1) {
      raf = requestAnimationFrame(tick);
    } else {
      onComplete?.();
    }
  };

  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

type JitterKeyframe = { scale: number; rotate: number; ms: number };

function runJitterKeyframes(
  el: HTMLElement,
  keyframes: JitterKeyframe[],
  scaleOnly = false,
): void {
  el.style.transformOrigin = "center center";
  let i = 0;

  const run = () => {
    if (i >= keyframes.length - 1) {
      el.style.transform = "";
      return;
    }
    const from = keyframes[i]!;
    const to = keyframes[i + 1]!;
    const dur = to.ms - from.ms;
    i += 1;
    animateValue(
      0,
      1,
      dur,
      (t) => {
        const scale = lerp(from.scale, to.scale, t);
        if (scaleOnly) {
          el.style.transform = `scale(${scale})`;
          return;
        }
        const rotate = lerp(from.rotate, to.rotate, t);
        el.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
      },
      run,
    );
  };

  run();
}

/** Tiny press jitter — buttons/chips only (keeps layout box stable) */
export function playSubtleJitter(el: HTMLElement | null): void {
  if (!el) return;
  runJitterKeyframes(el, [
    { scale: 1, rotate: 0, ms: 0 },
    { scale: 0.992, rotate: -0.08, ms: 35 },
    { scale: 1.006, rotate: 0.06, ms: 75 },
    { scale: 1, rotate: 0, ms: 120 },
  ]);
}

/** Qty digit pulse — text scales in place, no container growth */
export function playTextPulse(el: HTMLElement | null): void {
  if (!el) return;
  runJitterKeyframes(
    el,
    [
      { scale: 1, rotate: 0, ms: 0 },
      { scale: 1.05, rotate: 0, ms: 45 },
      { scale: 0.99, rotate: 0, ms: 85 },
      { scale: 1, rotate: 0, ms: 130 },
    ],
    true,
  );
}

/** @deprecated Use playSubtleJitter or playTextPulse */
export const playBouncyPress = playSubtleJitter;
