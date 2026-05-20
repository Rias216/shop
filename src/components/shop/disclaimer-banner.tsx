export function DisclaimerBanner({ text }: { text: string }) {
  return (
    <aside className="relative z-40 border-b border-[var(--warning-border)] bg-[var(--warning-bg)] px-4 py-2.5 text-center text-xs leading-relaxed text-[var(--warning-text)] backdrop-blur-md">
      {text}
    </aside>
  );
}
