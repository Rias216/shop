import { CsrfProvider } from "@/components/shop/csrf-provider";
import { DisclaimerBanner } from "@/components/shop/disclaimer-banner";
import { ShopFooter } from "@/components/shop/footer";
import { ShopHeader } from "@/components/shop/header";
import { getCsrfToken } from "@/lib/csrf";
import { getStoreSettings } from "@/lib/settings";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, csrfToken] = await Promise.all([
    getStoreSettings(),
    getCsrfToken(),
  ]);

  return (
    <CsrfProvider token={csrfToken}>
      <DisclaimerBanner text={settings.researchDisclaimer} />
      <ShopHeader />
      <main className="shop-main-enter relative z-10 flex-1">{children}</main>
      <ShopFooter
        siteName={settings.siteName}
        siteUrl={settings.siteUrl}
        legalEntity={settings.legalEntity}
        disclaimer={settings.researchDisclaimer}
      />
    </CsrfProvider>
  );
}
