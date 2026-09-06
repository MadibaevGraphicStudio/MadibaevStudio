# Madibaev Studio — VPS Docker

The VPS deployment lives in this folder, but the application source is **not duplicated here anymore**. Docker builds the canonical `../mgs-next` tree using `vps/Dockerfile`, so local development, Vercel and VPS use the same Next.js code.

## Production stack

- Next.js 16 standalone build from `mgs-next`
- Caddy reverse proxy with automatic HTTPS
- persistent `mgs_data` Docker volume for projects, enquiries and uploaded media
- `/admin/media` file manager with VPS uploads and reusable `/media/...` URLs
- non-root web process
- read-only web container filesystem with writable data/cache tmpfs only
- `no-new-privileges`, dropped Linux capabilities and process/CPU/memory limits
- enquiry rate limiting + honeypot + optional Cloudflare Turnstile
- admin-login brute-force protection
- authenticated, payload-limited and rate-limited OpenRouter endpoint
- CSP, HSTS and standard browser security headers
- daily off-site backup script via rclone

No MySQL, Redis, Kubernetes or separate Express server are required for the current scale.

## First deploy

```bash
git clone https://github.com/AlexMadibaev/MadibaevStudio.git
cd MadibaevStudio/vps
cp .env.example .env
nano .env
```

Set at minimum:

- `SITE_DOMAIN` — domain without `https://`
- `NEXT_PUBLIC_SITE_URL` — canonical full URL
- `ADMIN_SESSION_SECRET` — at least 64 random characters
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` — the server-side Google OAuth credentials
- `ADMIN_GOOGLE_EMAILS` — comma-separated Google accounts allowed into `/admin`
- `ACME_EMAIL` — TLS certificate notices

Before starting, point the apex domain DNS A/AAAA records to the VPS and open TCP 80/443 and UDP 443. The old experimental `work.`, `services.` and `about.` rewrite logic is intentionally removed; the supported production hosts are the apex domain and `www` redirect only.

Start:

```bash
docker compose up -d --build
```

Check:

```bash
docker compose ps
docker compose logs --tail=100 web
docker compose logs --tail=100 caddy
```

The `web` service must become `healthy` before Caddy begins proxying traffic.

## Turnstile anti-spam

Create a Cloudflare Turnstile widget for the production hostname. Add both keys to `.env`:

```dotenv
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
TURNSTILE_REQUIRED=true
```

Then rebuild the web image because `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is embedded into the browser bundle:

```bash
docker compose up -d --build web
docker compose up -d caddy
```

If the entire website is actually proxied through Cloudflare, you may additionally set:

```dotenv
MGS_TRUST_CLOUDFLARE=true
```

Do not enable it when clients can connect directly to the VPS while spoofing Cloudflare headers.

## Persistent data and media

Projects, enquiries and uploaded files are stored under `/app/data` and backed by the named volume `mgs_data`.

Media uploaded through `/admin/media` is stored under `/app/data/media/YYYY/MM/...` and is served through `/media/...`. Rebuilding the web image does not delete the volume.

Never run:

```bash
docker compose down -v
```

unless permanent deletion of site data and Caddy state is intentional.

## Daily off-site backups

The repository includes:

```bash
sh ./scripts/backup-data.sh
```

By default it creates a local tarball. Production should set an `RCLONE_REMOTE` pointing to S3, Backblaze B2, another VPS, or another rclone-compatible target:

```dotenv
RCLONE_REMOTE=my-backup:madibaevstudio-production
BACKUP_LOCAL_DAYS=7
BACKUP_REMOTE_DAYS=30
```

Install and configure `rclone` on the host, test one backup manually, then add a daily cron entry. Example at 03:20 UTC:

```cron
20 3 * * * cd /opt/MadibaevStudio/vps && /bin/sh ./scripts/backup-data.sh >> /var/log/mgs-backup.log 2>&1
```

Check the off-site destination after the first run. A backup stored only on the same VPS is not considered sufficient disaster recovery.

## Admin protection

Admin access uses Google OAuth and an explicit `ADMIN_GOOGLE_EMAILS` allowlist. An optional password fallback still limits failed attempts to 5 per 15 minutes per client IP and adds a delay on failed authentication. Cloudflare Access or Tailscale can optionally be placed in front of `/admin` for another perimeter layer.

Rotating `ADMIN_SESSION_SECRET` immediately invalidates all current admin sessions.

## Security headers

Caddy sends CSP and HSTS in addition to `nosniff`, frame, referrer and permissions policies. HSTS is currently scoped to the production hostname rather than `includeSubDomains`, so unrelated future subdomains are not forced into HTTPS before they are configured.

## Update

From the existing repository on the VPS:

```bash
cd /opt/MadibaevStudio
git fetch origin
git checkout main
git pull --ff-only origin main
cd vps
docker compose build --pull web
docker compose up -d
docker compose ps
```

Because Docker now builds `mgs-next` directly, there is no manual copy/sync step between `mgs-next` and `vps/app`.

## Health check

```bash
curl -fsS https://madibaevstudio.online/api/health
curl -I https://madibaevstudio.online/
curl -I https://madibaevstudio.online/admin
```

Also inspect recent logs after every production update:

```bash
docker compose logs --tail=100 web
docker compose logs --tail=100 caddy
```

## Stop

```bash
docker compose down
```
