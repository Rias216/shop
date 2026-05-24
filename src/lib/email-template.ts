import { formatPrice } from "@/lib/utils";

export type EmailTheme = "light" | "dark";

export type OrderEmailLine = {
  name: string;
  qty: number;
  unitPriceCents: number;
};

export type OrderEmailSummary = {
  orderId: string;
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  shippingLabel?: string;
  lines: OrderEmailLine[];
};

type EmailPalette = {
  pageBg: string;
  cardBg: string;
  cardBorder: string;
  heading: string;
  text: string;
  muted: string;
  divider: string;
  tableHead: string;
  tableRow: string;
  accent: string;
  accentText: string;
  link: string;
  badgeBg: string;
  badgeText: string;
};

const PALETTES: Record<EmailTheme, EmailPalette> = {
  light: {
    pageBg: "#f4f4f5",
    cardBg: "#ffffff",
    cardBorder: "#e4e4e7",
    heading: "#09090b",
    text: "#3f3f46",
    muted: "#71717a",
    divider: "#e4e4e7",
    tableHead: "#71717a",
    tableRow: "#f4f4f5",
    accent: "#18181b",
    accentText: "#ffffff",
    link: "#2563eb",
    badgeBg: "#f4f4f5",
    badgeText: "#52525b",
  },
  dark: {
    pageBg: "#09090b",
    cardBg: "#18181b",
    cardBorder: "#3f3f46",
    heading: "#fafafa",
    text: "#d4d4d8",
    muted: "#a1a1aa",
    divider: "#3f3f46",
    tableHead: "#a1a1aa",
    tableRow: "#27272a",
    accent: "#fafafa",
    accentText: "#18181b",
    link: "#93c5fd",
    badgeBg: "#27272a",
    badgeText: "#e4e4e7",
  },
};

export function normalizeEmailTheme(value: string | null | undefined): EmailTheme {
  return value === "dark" ? "dark" : "light";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function palette(theme: EmailTheme): EmailPalette {
  return PALETTES[theme];
}

export function orderRef(orderId: string): string {
  return orderId.slice(-8).toUpperCase();
}

export function renderEmailButton(params: {
  href: string;
  label: string;
  theme: EmailTheme;
}): string {
  const p = palette(params.theme);
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px">
      <tr>
        <td style="border-radius:10px;background:${p.accent}">
          <a href="${params.href}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:${p.accentText};text-decoration:none;border-radius:10px">
            ${escapeHtml(params.label)}
          </a>
        </td>
      </tr>
    </table>
  `;
}

export function renderOrderLinesTable(summary: OrderEmailSummary, theme: EmailTheme): string {
  const p = palette(theme);
  const rows = summary.lines
    .map(
      (line, index) => `
      <tr style="background:${index % 2 === 0 ? "transparent" : p.tableRow}">
        <td style="padding:12px 0 12px 4px;font-size:14px;color:${p.text};border-bottom:1px solid ${p.divider}">${escapeHtml(line.name)}</td>
        <td style="padding:12px 8px;font-size:14px;color:${p.muted};text-align:center;border-bottom:1px solid ${p.divider}">${line.qty}</td>
        <td style="padding:12px 4px 12px 0;font-size:14px;color:${p.heading};text-align:right;border-bottom:1px solid ${p.divider}">${formatPrice(line.unitPriceCents * line.qty)}</td>
      </tr>`,
    )
    .join("");

  const discountRow =
    summary.discountCents > 0
      ? `<tr><td colspan="2" style="padding:10px 4px;color:${p.muted};font-size:14px">Discount</td><td style="padding:10px 4px;text-align:right;color:${p.heading};font-size:14px">-${formatPrice(summary.discountCents)}</td></tr>`
      : "";

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;border-collapse:collapse">
      <thead>
        <tr>
          <th style="padding:0 0 10px 4px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${p.tableHead};text-align:left">Item</th>
          <th style="padding:0 8px 10px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${p.tableHead};text-align:center">Qty</th>
          <th style="padding:0 4px 10px 0;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${p.tableHead};text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><td colspan="2" style="padding:14px 4px 6px;color:${p.muted};font-size:14px">Subtotal</td><td style="padding:14px 4px 6px 0;text-align:right;color:${p.heading};font-size:14px">${formatPrice(summary.subtotalCents)}</td></tr>
        <tr><td colspan="2" style="padding:6px 4px;color:${p.muted};font-size:14px">${escapeHtml(summary.shippingLabel ?? "Shipping")}</td><td style="padding:6px 4px 0;text-align:right;color:${p.heading};font-size:14px">${formatPrice(summary.shippingCents)}</td></tr>
        ${discountRow}
        <tr><td colspan="2" style="padding:16px 4px 0;font-size:16px;font-weight:700;color:${p.heading}">Total</td><td style="padding:16px 4px 0;text-align:right;font-size:16px;font-weight:700;color:${p.heading}">${formatPrice(summary.totalCents)}</td></tr>
      </tfoot>
    </table>
  `;
}

export function renderEmailLayout(params: {
  theme: EmailTheme;
  siteName: string;
  eyebrow?: string;
  title: string;
  bodyHtml: string;
  footerHtml: string;
}): string {
  const p = palette(params.theme);
  const eyebrow = params.eyebrow
    ? `<p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${p.muted}">${escapeHtml(params.eyebrow)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="${params.theme}" />
  <meta name="supported-color-schemes" content="${params.theme}" />
  <title>${escapeHtml(params.title)}</title>
</head>
<body style="margin:0;padding:0;background:${p.pageBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${p.pageBg};padding:40px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${p.cardBg};border:1px solid ${p.cardBorder};border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,${params.theme === "dark" ? "0.35" : "0.08"})">
          <tr>
            <td style="padding:28px 28px 0">
              <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${p.muted}">${escapeHtml(params.siteName)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px">
              ${eyebrow}
              <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;font-weight:700;color:${p.heading}">${escapeHtml(params.title)}</h1>
              <div style="font-size:15px;line-height:1.65;color:${p.text}">${params.bodyHtml}</div>
              <hr style="margin:28px 0;border:none;border-top:1px solid ${p.divider}" />
              <div style="font-size:12px;line-height:1.6;color:${p.muted}">${params.footerHtml}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderInfoBadge(text: string, theme: EmailTheme): string {
  const p = palette(theme);
  return `<span style="display:inline-block;margin:4px 0;padding:6px 10px;border-radius:999px;background:${p.badgeBg};color:${p.badgeText};font-size:13px;font-weight:600">${escapeHtml(text)}</span>`;
}

export function renderMutedLink(href: string, label: string, theme: EmailTheme): string {
  const p = palette(theme);
  return `<a href="${href}" style="color:${p.link};text-decoration:underline">${escapeHtml(label)}</a>`;
}
