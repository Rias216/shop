import { cn } from "@/lib/utils";

/** Simple takeaway paper cup — white cup, kraft sleeve, dark lid. */
export function PaperCupIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-6 shrink-0", className)}
      aria-hidden
    >
      <path
        d="M4 9h16l-1.2 18H5.2L4 9z"
        fill="#faf9f7"
        stroke="#c4bcb0"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />
      <path d="M5.5 14h13v5H5.5v-5z" fill="#d4b896" />
      <path d="M4 6h16l-1-3h-2H5L4 6z" fill="#2e2a26" />
      <path d="M5 6.5h14" stroke="#4a4540" strokeWidth="0.5" strokeLinecap="round" />
    </svg>
  );
}
