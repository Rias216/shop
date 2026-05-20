import { LegalPage } from "@/components/shop/legal-page";
import { getStoreSettings } from "@/lib/settings";

export default async function ShippingPage() {
  const settings = await getStoreSettings();

  return (
    <LegalPage title="Shipping">
      <p>
        Orders ship after payment is confirmed. Processing time depends on stock and batch
        verification. You will receive an email when your order ships, including a tracking number
        when available.
      </p>
      <p>
        Shipping carriers and delivery times vary by destination. International orders may be
        subject to customs delays outside our control. Contact{" "}
        <a href={`mailto:${settings.emailFrom}`} className="text-accent hover:underline">
          {settings.emailFrom}
        </a>{" "}
        with your order ID for status updates.
      </p>
      <p className="text-xs">{settings.researchDisclaimer}</p>
    </LegalPage>
  );
}
