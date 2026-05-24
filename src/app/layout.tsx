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
    <html lang="en" className="h-full antialiased light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var theme=t==='dark'?'dark':'light';document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(theme);document.documentElement.style.colorScheme=theme;}catch(e){document.documentElement.classList.add('light');}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans text-foreground">
        <WebVitals />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
