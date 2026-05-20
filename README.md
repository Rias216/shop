# Research Supply Store

Legal research-chemical e-commerce (peptides & nootropics) with guest checkout, PayPal, BTCPay Server crypto, COA documents, and an admin dashboard.

**Research use only** — not for human consumption. You are responsible for product legality in your jurisdiction.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- PostgreSQL + Prisma 7
- NextAuth (admin credentials)
- PayPal Checkout API
- BTCPay Server (self-hosted crypto)
- Resend (order emails; logs to console if unset)

## Quick start

**Default: SQLite** (no Docker). Creates `dev.db` in the project root.

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

### Optional: PostgreSQL via Docker

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. In `prisma/schema.prisma`, set `provider = "postgresql"`.
3. In `.env`, use `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/research_store"`.
4. Run `docker compose up -d`, then `npm run db:push` and `npm run db:seed`.

Open [http://localhost:3000](http://localhost:3000). Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login) — default `admin@example.com` / `admin123` (see `.env`).

Configure the store at **Admin → Settings**: site name, legal copy, blocked countries, PayPal, BTCPay, and Resend email. Secrets are stored in the database; leave a password field blank to keep the current value.

Only `DATABASE_URL` and `AUTH_SECRET` must stay in `.env` (session signing).

## PayPal sandbox

1. Create an app at [PayPal Developer](https://developer.paypal.com/dashboard/).
2. Set `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE=sandbox`.
3. Checkout with PayPal → approve in sandbox → capture on return URL.

## BTCPay Server

Run BTCPay (Docker) on a host you control:

```bash
# See https://docs.btcpayserver.org/Docker/
git clone https://github.com/btcpayserver/btcpayserver-docker
cd btcpayserver-docker
./btcpay-setup.sh -i
```

In BTCPay: create a store → **Settings → Access tokens** (Greenfield API) → add webhook pointing to:

`https://your-domain.com/api/webhooks/btcpay`

Set in `.env`:

- `BTCPAY_URL` — store base URL
- `BTCPAY_API_KEY` — Greenfield token
- `BTCPAY_STORE_ID` — store ID
- `BTCPAY_WEBHOOK_SECRET` — webhook secret

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite (`file:./dev.db`) or PostgreSQL URL |
| `AUTH_URL` / `AUTH_SECRET` | App URL and session secret |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded admin user |
| `SETTINGS_ENCRYPTION_KEY` | Encrypts payment/API secrets in the database |
| `PAYPAL_*` | PayPal REST credentials |
| `NOWPAYMENTS_*` | NOWPayments API + IPN webhook secret |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional email |
| `BLOCKED_COUNTRIES` | Comma-separated ISO country codes |
| `NEXT_PUBLIC_SITE_NAME` | Store branding |
| `PERF_LOG` | Enable server/API perf timing logs (`1` to enable) |
| `NEXT_PUBLIC_PERF_LOG` | Enable client Web Vitals + long-task logs (`1` to enable) |

### Performance baseline logging (optional)

Set these before profiling:

```bash
PERF_LOG=1
NEXT_PUBLIC_PERF_LOG=1
```

Then run through key flows (`/`, `/catalog`, `/products/[slug]`, `/cart`, `/checkout`).
The server prints `[perf:request]` timings for API routes and the browser console prints
`[perf:web-vital]` + `[perf:long-task]`.

Near-instant navigation is improved by:
- intent prefetch for hot routes in `src/components/instant-prefetch.tsx`
- client cache tuning via `experimental.staleTimes` in `next.config.ts`

## Security hardening essentials

- **Transport encryption:** run behind HTTPS only in production.
- **Session safety:** configure strong `AUTH_SECRET` and do not use defaults.
- **Settings encryption at rest:** set `SETTINGS_ENCRYPTION_KEY` in production.

Encrypt existing settings secrets once after setting `SETTINGS_ENCRYPTION_KEY`:

```bash
npm run db:encrypt-settings
```

Dry run:

```bash
npm run db:encrypt-settings -- --dry-run
```

## Free edge protection (Caddy + CrowdSec)

Cloudflare-like, open-source, and free stack:

- Caddy: TLS termination + reverse proxy
- CrowdSec: abusive IP detection/blocking signal engine

Files:
- `deploy/caddy/Caddyfile`
- `deploy/crowdsec/docker-compose.yml`
- `deploy/crowdsec/stack.env.example`

Quick VPS setup:

```bash
cd deploy/crowdsec
cp stack.env.example stack.env
# edit stack.env with real domain and email
docker compose up -d
```

Point your domain A/AAAA record to the VPS, then Caddy will auto-issue Let's Encrypt certs.

Admin toggle + key management:
- Go to `Admin -> Settings -> Edge protection (Cloudflare-like)`.
- Toggle `Enable edge protection mode` on/off.
- Set provider (`CrowdSec` or `None`).
- Save optional edge API key (stored encrypted at rest when `SETTINGS_ENCRYPTION_KEY` is configured).

## Routes

| Path | Description |
|------|-------------|
| `/` | Product catalog |
| `/products/[slug]` | Product detail + COA |
| `/cart` | Shopping cart |
| `/checkout` | Guest checkout |
| `/order/[id]?token=` | Order status / payment |
| `/admin` | Dashboard (auth required) |

## Compliance features

- Site-wide research-only disclaimer
- Age (18+) and terms checkboxes at checkout
- Configurable country blocklist (`BLOCKED_COUNTRIES`)
- Per-product legal notice + COA PDF downloads

## Production

- Use strong `AUTH_SECRET` and admin password
- Configure HTTPS and real payment keys
- Store uploads on S3 or similar for multi-instance deploys
- Review local laws before selling any chemical products

## Publishing to GitHub

1. Copy `.env.example` → `.env` locally (never commit `.env`, `dev.db`, or `.next/`).
2. Stage and push the app: `git add .` then `git commit` / `git push`.
3. On the server or CI, set production env vars and run `npm install`, `npm run db:push`, `npm run build`, `npm start`.
4. After setting `SETTINGS_ENCRYPTION_KEY` in production, run `npm run db:encrypt-settings` once.
