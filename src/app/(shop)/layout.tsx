import { DisclaimerBanner } from "@/components/shop/disclaimer-banner";
import { ShopFooter } from "@/components/shop/footer";
import { ShopHeader } from "@/components/shop/header";
import { getStoreSettings } from "@/lib/settings";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getStoreSettings();

  return (
    <>
      <DisclaimerBanner text={settings.researchDisclaimer} />
      <ShopHeader />
      <main className="shop-main-enter relative z-10 flex-1">{children}</main>
      <ShopFooter
        legalEntity={settings.legalEntity}
        disclaimer={settings.researchDisclaimer}
      />
    </>
  );
}
