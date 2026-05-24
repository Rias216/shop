import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  saveStoreSettingsAction,
  sendTestEmailAction,
  updateAdminPasswordAction,
} from "@/lib/admin-actions";
import { isEmailConfigured } from "@/lib/settings";
import type { StoreSettings } from "@/generated/prisma/client";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-strong rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function SettingsForm({
  settings,
  saved,
  passwordSaved,
  passwordError,
  emailTest,
  emailTestTo,
  emailTestError,
}: {
  settings: StoreSettings;
  saved?: boolean;
  passwordSaved?: boolean;
  passwordError?: string | null;
  emailTest?: "ok" | "fail" | "invalid";
  emailTestTo?: string;
  emailTestError?: string;
}) {
  const emailReady = isEmailConfigured(settings);
  return (
    <div className="space-y-8">
      {saved && (
        <p className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          Settings saved.
        </p>
      )}

      <form action={saveStoreSettingsAction} className="space-y-8">
        <Section title="Store & branding">
          <p>
            <Label htmlFor="siteName">Store name</Label>
            <Input id="siteName" name="siteName" defaultValue={settings.siteName} required className="mt-1" />
          </p>
          <p>
            <Label htmlFor="legalEntity">Legal entity name</Label>
            <Input id="legalEntity" name="legalEntity" defaultValue={settings.legalEntity} required className="mt-1" />
          </p>
          <p>
            <Label htmlFor="siteUrl">Public site URL</Label>
            <Input
              id="siteUrl"
              name="siteUrl"
              type="url"
              defaultValue={settings.siteUrl}
              required
              className="mt-1"
              placeholder="https://peptides.cafe"
            />
            <span className="mt-1 block text-xs text-zinc-500">
              Used for order links and PayPal return URLs.
            </span>
          </p>
          <p>
            <Label htmlFor="researchDisclaimer">Site-wide disclaimer</Label>
            <textarea
              id="researchDisclaimer"
              name="researchDisclaimer"
              defaultValue={settings.researchDisclaimer}
              rows={3}
              className="mt-1 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg-subtle)] px-3 py-2 text-sm text-foreground backdrop-blur-sm"
            />
          </p>
          <p>
            <Label htmlFor="defaultLegalNotice">Default product legal notice</Label>
            <textarea
              id="defaultLegalNotice"
              name="defaultLegalNotice"
              defaultValue={settings.defaultLegalNotice}
              rows={3}
              className="mt-1 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg-subtle)] px-3 py-2 text-sm text-foreground backdrop-blur-sm"
            />
          </p>
        </Section>

        <Section title="Compliance">
          <p>
            <Label htmlFor="blockedCountries">Blocked countries (ISO codes, comma-separated)</Label>
            <Input
              id="blockedCountries"
              name="blockedCountries"
              defaultValue={settings.blockedCountries}
              className="mt-1"
              placeholder="US,CA,AU"
            />
          </p>
        </Section>

        <Section title="PayPal">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="paypalEnabled" defaultChecked={settings.paypalEnabled} />
            Enable PayPal checkout
          </label>
          <p>
            <Label htmlFor="paypalMode">Mode</Label>
            <select
              id="paypalMode"
              name="paypalMode"
              defaultValue={settings.paypalMode}
              className="mt-1 flex h-10 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg-subtle)] px-3 text-sm text-foreground"
            >
              <option value="sandbox">Sandbox</option>
              <option value="live">Live</option>
            </select>
          </p>
          <p>
            <Label htmlFor="paypalClientId">Client ID</Label>
            <Input id="paypalClientId" name="paypalClientId" defaultValue={settings.paypalClientId} className="mt-1" />
          </p>
          <p>
            <Label htmlFor="paypalClientSecret">Client secret</Label>
            <Input
              id="paypalClientSecret"
              name="paypalClientSecret"
              type="password"
              placeholder={settings.paypalClientSecret ? "•••••••• (leave blank to keep)" : ""}
              className="mt-1"
            />
          </p>
        </Section>

        <Section title="NOWPayments (crypto)">
          <p className="text-xs text-muted-foreground">
            Free to sign up at nowpayments.io — supports Monero (XMR), Bitcoin, Ethereum, Litecoin,
            USDC, and 300+ coins. No server to host.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="cryptoEnabled" defaultChecked={settings.cryptoEnabled} />
            Enable cryptocurrency checkout
          </label>
          <p>
            <Label htmlFor="nowpaymentsApiKey">API key</Label>
            <Input
              id="nowpaymentsApiKey"
              name="nowpaymentsApiKey"
              type="password"
              placeholder={settings.nowpaymentsApiKey ? "•••••••• (leave blank to keep)" : ""}
              className="mt-1 font-mono text-sm"
            />
          </p>
          <p>
            <Label htmlFor="nowpaymentsIpnSecret">IPN secret</Label>
            <Input
              id="nowpaymentsIpnSecret"
              name="nowpaymentsIpnSecret"
              type="password"
              placeholder={settings.nowpaymentsIpnSecret ? "•••••••• (leave blank to keep)" : ""}
              className="mt-1 font-mono text-sm"
            />
            <span className="mt-1 block text-xs text-zinc-500">
              IPN callback URL: {settings.siteUrl.replace(/\/$/, "")}/api/webhooks/nowpayments
            </span>
          </p>
        </Section>

        <Section title="Manual payment (wire / ACH)">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="manualPaymentEnabled"
              defaultChecked={settings.manualPaymentEnabled}
            />
            Enable bank transfer / wire at checkout
          </label>
          <p>
            <Label htmlFor="manualPaymentInstructions">Instructions (shown on order page)</Label>
            <textarea
              id="manualPaymentInstructions"
              name="manualPaymentInstructions"
              defaultValue={settings.manualPaymentInstructions}
              rows={3}
              className="mt-1 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg-subtle)] px-3 py-2 text-sm"
            />
          </p>
          <p>
            <Label htmlFor="manualPaymentEmail">Wire / bank contact email</Label>
            <Input
              id="manualPaymentEmail"
              name="manualPaymentEmail"
              type="email"
              defaultValue={settings.manualPaymentEmail}
              placeholder="payments@justpeps.online"
              className="mt-1"
            />
            <span className="mt-1 block text-xs text-zinc-500">
              Shown at checkout and on wire orders. Leave blank to auto-use payments@your-domain.
            </span>
          </p>
        </Section>

        <Section title="Email (Resend)">
          <p className="text-xs text-muted-foreground">
            1. Add your domain at{" "}
            <a href="https://resend.com/domains" className="text-accent underline" target="_blank" rel="noreferrer">
              resend.com/domains
            </a>{" "}
            and set DNS (SPF + DKIM). 2. Create an API key. 3. Use a from address on that domain (e.g.{" "}
            <code className="text-xs">orders@justpeps.online</code>).
          </p>
          <p>
            <Label htmlFor="emailFrom">From address</Label>
            <Input
              id="emailFrom"
              name="emailFrom"
              type="email"
              defaultValue={settings.emailFrom}
              placeholder="orders@justpeps.online"
              className="mt-1"
            />
          </p>
          <p>
            <Label htmlFor="resendApiKey">Resend API key</Label>
            <Input
              id="resendApiKey"
              name="resendApiKey"
              type="password"
              placeholder={settings.resendApiKey ? "•••••••• (leave blank to keep)" : "re_..."}
              className="mt-1 font-mono text-sm"
            />
            <span className="mt-1 block text-xs text-zinc-500">
              {emailReady
                ? "Configured — order confirmation emails send on checkout."
                : "Without a key, emails are logged to the server console only."}
            </span>
          </p>
          {emailTest === "ok" && (
            <p className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
              Test email sent to {emailTestTo}.
            </p>
          )}
          {emailTest === "invalid" && (
            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              Enter a valid email address for the test.
            </p>
          )}
          {emailTest === "fail" && (
            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              Test failed: {emailTestError ?? "Unknown error"}
            </p>
          )}
        </Section>

        <Section title="Edge protection (Cloudflare-like)">
          <p className="text-xs text-muted-foreground">
            Use with Caddy + CrowdSec on your VPS. Toggle here without redeploying app code.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="edgeProtectionEnabled"
              defaultChecked={settings.edgeProtectionEnabled}
            />
            Enable edge protection mode
          </label>
          <p>
            <Label htmlFor="edgeProvider">Provider</Label>
            <select
              id="edgeProvider"
              name="edgeProvider"
              defaultValue={settings.edgeProvider}
              className="mt-1 flex h-10 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg-subtle)] px-3 text-sm text-foreground"
            >
              <option value="crowdsec">CrowdSec</option>
              <option value="none">None</option>
            </select>
          </p>
          <p>
            <Label htmlFor="edgeApiKey">Edge API key</Label>
            <Input
              id="edgeApiKey"
              name="edgeApiKey"
              type="password"
              placeholder={settings.edgeApiKey ? "•••••••• (leave blank to keep)" : ""}
              className="mt-1 font-mono text-sm"
            />
          </p>
        </Section>

        <Button type="submit" size="lg">
          Save all settings
        </Button>
      </form>

      <Section title="Test email">
        <p className="text-sm text-muted-foreground">
          Save your Resend key and from address first, then send a test.
        </p>
        <form action={sendTestEmailAction} className="mt-4 flex max-w-md flex-col gap-3 sm:flex-row sm:items-end">
          <p className="flex-1">
            <Label htmlFor="testEmailTo">Send to</Label>
            <Input id="testEmailTo" name="testEmailTo" type="email" required placeholder="you@example.com" className="mt-1" />
          </p>
          <Button type="submit" variant="outline" disabled={!emailReady}>
            Send test
          </Button>
        </form>
      </Section>

      <Section title="Admin password">
        {passwordSaved && (
          <p className="mb-4 text-sm text-green-700">Password updated.</p>
        )}
        {passwordError === "invalid" && (
          <p className="mb-4 text-sm text-red-600">Current password is incorrect.</p>
        )}
        {passwordError === "mismatch" && (
          <p className="mb-4 text-sm text-red-600">New passwords do not match.</p>
        )}
        {passwordError === "short" && (
          <p className="mb-4 text-sm text-red-600">Password must be at least 8 characters.</p>
        )}
        <form action={updateAdminPasswordAction} className="max-w-md space-y-4">
          <p>
            <Label htmlFor="currentPassword">Current password</Label>
            <Input id="currentPassword" name="currentPassword" type="password" required className="mt-1" />
          </p>
          <p>
            <Label htmlFor="newPassword">New password</Label>
            <Input id="newPassword" name="newPassword" type="password" required className="mt-1" />
          </p>
          <p>
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required className="mt-1" />
          </p>
          <Button type="submit" variant="outline">
            Update password
          </Button>
        </form>
      </Section>
    </div>
  );
}
