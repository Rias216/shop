# Cloudflare + origin firewall (justpeps.online)

Block **direct IP access** (`http://YOUR_VPS_IP:3001`) while keeping the site working through Cloudflare.

## How it works

```
Visitor → Cloudflare (443) → your VPS :443 (nginx) → 127.0.0.1:3001 (PM2/Next.js)
```

1. Next.js listens on **localhost only** (not the public IP).
2. **nginx** (or Caddy) listens on **80/443** and proxies to the app.
3. **UFW** allows **SSH** + **80/443 from Cloudflare IPs only**; denies **3001** from the internet.

## Step 1 — Bind the app to localhost

On the VPS in `~/shop`, set in `.env`:

```bash
HOSTNAME=127.0.0.1
PORT=3001
AUTH_URL=https://justpeps.online
```

Restart PM2:

```bash
cd ~/shop
git pull
npm run build
pm2 restart justpeps
```

Confirm the app is **not** on the public interface:

```bash
ss -tlnp | grep 3001
# should show 127.0.0.1:3001  (NOT 0.0.0.0:3001)
```

## Step 2 — Reverse proxy on 443

If nginx is not set up yet, copy the example and enable TLS:

```bash
sudo cp deploy/cloudflare/nginx-origin.conf.example /etc/nginx/sites-available/justpeps
sudo ln -sf /etc/nginx/sites-available/justpeps /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

In **Cloudflare → DNS**, both domains should be **Proxied** (orange cloud).  
**SSL/TLS → Overview** → **Full (strict)** with an origin certificate on nginx.

Fix **justpeps.store** redirect: it must send users to `https://justpeps.online`, not `http://`.

## Step 3 — Apply firewall rules

From the repo on the VPS:

```bash
cd ~/shop
chmod +x deploy/cloudflare/setup-origin-firewall.sh
sudo bash deploy/cloudflare/setup-origin-firewall.sh --dry-run   # preview
sudo bash deploy/cloudflare/setup-origin-firewall.sh             # apply
```

**Warning:** Run this from an **SSH session**. Do not close the terminal until you confirm SSH still works (`ufw status`).

### What the script does

| Rule | Purpose |
|------|---------|
| `ufw allow OpenSSH` | Keep SSH access |
| `ufw allow from <Cloudflare CIDR> to any port 80,443` | Only Cloudflare hits the origin |
| `ufw deny 3001/tcp` | Block direct Next.js port |
| `ufw default deny incoming` | Drop everything else |

Cloudflare IP lists: https://www.cloudflare.com/ips-v4 and https://www.cloudflare.com/ips-v6

Re-run the script after Cloudflare publishes IP changes (rare).

## Step 4 — Verify

```bash
# Should work
curl -sI https://justpeps.online/ | head

# Should fail (timeout or connection refused)
curl -sI --max-time 5 http://46.202.194.222:3001/
```

## Cloudflare dashboard (HostedScan / TLS)

1. **SSL/TLS → Overview** — **Full (strict)**.
2. **SSL/TLS → Edge Certificates** — **Minimum TLS Version: 1.2**.
3. **SSL/TLS → Edge Certificates** — **Always Use HTTPS**.
4. **SSL/TLS → Edge Certificates** — enable **HSTS** (optional preload).

## Manual UFW (if you prefer not to use the script)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH

# For each Cloudflare IPv4 range from https://www.cloudflare.com/ips-v4 :
sudo ufw allow from 173.245.48.0/20 to any port 443 proto tcp
# ... repeat for all ranges ...

sudo ufw deny 3001/tcp
sudo ufw enable
```

Use the script instead of copying ranges by hand — the list is long and changes.

## Notes

- `/cdn-cgi/*` is served by Cloudflare, not your app.
- App security headers are in `next.config.ts`.
- If you **SSH from a non-standard port**, edit `setup-origin-firewall.sh` and replace `OpenSSH` with your port before enabling UFW.
