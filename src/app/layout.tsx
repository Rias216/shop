import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { WebVitals } from "@/components/web-vitals";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peptides",
  description: "Research peptides from peptides.cafe — in-vitro laboratory use only.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans text-foreground">
        <WebVitals />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
