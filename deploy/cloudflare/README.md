# Cloudflare hardening (justpeps.online)

These settings address HostedScan findings that Cloudflare controls (not the Next.js app).

## SSL/TLS

1. **SSL/TLS → Overview** — mode **Full (strict)** if origin has a valid cert.
2. **SSL/TLS → Edge Certificates** — **Minimum TLS Version: 1.2** (disables TLS 1.0/1.1).
3. **SSL/TLS → Edge Certificates** — enable **Always Use HTTPS**.
4. **SSL/TLS → Edge Certificates** — enable **HTTP Strict Transport Security (HSTS)** with:
   - Max age: 12 months
   - Include subdomains: on
   - Preload: optional

## Proxy both domains

Orange-cloud **justpeps.online** and **justpeps.store** so origin ports (2052, 8080, etc.) are not exposed on the VPS IP.

## Notes

- `/cdn-cgi/*` responses are served by Cloudflare; HSTS/CSP on those paths are configured in the Cloudflare dashboard, not the app.
- App security headers (CSP, X-Frame-Options, etc.) are set in `next.config.ts` on the origin.
