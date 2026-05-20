import { SettingsForm } from "@/components/admin/settings-form";
import { getStoreSettings } from "@/lib/settings";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
    passwordSaved?: string;
    passwordError?: string;
  }>;
}) {
  const settings = await getStoreSettings();
  const params = await searchParams;

  return (
    <article>
      <h1 className="text-2xl font-bold text-foreground">Store settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Configure branding, payments, email, and compliance. Changes apply immediately.
      </p>
      <div className="mt-8">
        <SettingsForm
          settings={settings}
          saved={params.saved === "1"}
          passwordSaved={params.passwordSaved === "1"}
          passwordError={params.passwordError ?? null}
        />
      </div>
    </article>
  );
}
