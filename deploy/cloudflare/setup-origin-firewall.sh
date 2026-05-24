#!/usr/bin/env bash
# Lock the VPS origin so only SSH + Cloudflare can reach HTTP(S).
# Run on the VPS as root after nginx (or Caddy) proxies to 127.0.0.1:3001.
#
# Usage:
#   sudo bash deploy/cloudflare/setup-origin-firewall.sh
#   sudo bash deploy/cloudflare/setup-origin-firewall.sh --dry-run
#
# Prereqs:
#   - Next.js / PM2 bound to 127.0.0.1:3001 (not 0.0.0.0)
#   - Reverse proxy on :80 / :443 → 127.0.0.1:3001
#   - Cloudflare DNS orange-clouded; origin connects to :443 (not :3001)

set -euo pipefail

DRY_RUN=0
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
fi

run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[dry-run] $*"
  else
    "$@"
  fi
}

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root: sudo bash $0" >&2
  exit 1
fi

if ! command -v ufw >/dev/null 2>&1; then
  echo "Installing ufw..."
  run apt-get update -qq
  run apt-get install -y ufw
fi

CF_V4_URL="https://www.cloudflare.com/ips-v4"
CF_V6_URL="https://www.cloudflare.com/ips-v6"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

curl -fsSL "$CF_V4_URL" -o "$TMP_DIR/ips-v4.txt"
curl -fsSL "$CF_V6_URL" -o "$TMP_DIR/ips-v6.txt"

echo "==> Resetting UFW (SSH stays allowed first)"
run ufw --force reset
run ufw default deny incoming
run ufw default allow outgoing

echo "==> SSH (change port below if you use a non-default port)"
run ufw allow OpenSSH comment "SSH"

echo "==> HTTP/HTTPS from Cloudflare IPv4 only"
while IFS= read -r cidr; do
  [[ -z "$cidr" ]] && continue
  run ufw allow from "$cidr" to any port 80 proto tcp comment "CF HTTP"
  run ufw allow from "$cidr" to any port 443 proto tcp comment "CF HTTPS"
done < "$TMP_DIR/ips-v4.txt"

echo "==> HTTP/HTTPS from Cloudflare IPv6 only"
while IFS= read -r cidr; do
  [[ -z "$cidr" ]] && continue
  run ufw allow from "$cidr" to any port 80 proto tcp comment "CF HTTP v6"
  run ufw allow from "$cidr" to any port 443 proto tcp comment "CF HTTPS v6"
done < "$TMP_DIR/ips-v6.txt"

echo "==> Explicitly deny public access to the app port"
run ufw deny 3001/tcp comment "Block direct Next.js"

echo "==> Enable UFW"
if [[ "$DRY_RUN" == "1" ]]; then
  echo "[dry-run] ufw --force enable"
  echo "[dry-run] ufw status numbered"
else
  ufw --force enable
  ufw status numbered
fi

echo ""
echo "Done. Verify:"
echo "  - curl -sI https://justpeps.online/          # should work (via Cloudflare)"
echo "  - curl -sI http://46.202.194.222:3001/       # should fail / timeout"
echo "  - ss -tlnp | grep 3001                       # should show 127.0.0.1:3001"
