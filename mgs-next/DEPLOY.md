# Madibaev Studio production deployment

The production application is the Next.js 16 app in `mgs-next`. The repository-root Docker stack builds this app directly; the legacy Express prototype, MySQL, and Redis are not part of the production topology.

## Docker / VPS production

1. Copy `.env.example` to `.env` at the repository root.
2. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_GOOGLE_EMAILS`, and a strong unique `ADMIN_SESSION_SECRET`.
3. Keep `NEXT_PUBLIC_SITE_URL` on the canonical HTTPS domain.
4. Run:

```bash
docker compose up -d --build
```

The stack contains:

- `web`: Next.js standalone server on the internal port `3000`.
- `nginx`: reverse proxy exposed on host port `80`.
- `mgs_data`: persistent Docker volume mounted at `/data` for projects and enquiries.

`/api/health` returns HTTP 200 only when persistent storage is configured. Compose waits for this healthcheck before starting nginx.

TLS should terminate at the VPS ingress, load balancer, CDN, or an HTTPS-enabled nginx configuration. `MGS_COOKIE_SECURE=true` is the production default, so admin login expects HTTPS.

## Persistent content

Self-hosted Docker uses `MGS_DATA_DIR=/data` and stores:

```text
/data/mgs-admin/projects.json
/data/mgs-admin/enquiries/*.json
```

Writes are atomic and preserve optimistic concurrency checks. Removing or recreating the application container does not remove the named `mgs_data` volume.

## Vercel alternative

Vercel remains supported. Use:

- Branch: `main`
- Root Directory: `mgs-next`
- Framework preset: `Next.js`
- Build command: `next build`

Do not set `MGS_DATA_DIR` on Vercel. Connect a private Vercel Blob store and provide `BLOB_READ_WRITE_TOKEN`; the same content-store API will use Blob automatically.

## Required environment variables

```text
NEXT_PUBLIC_SITE_URL=https://studio.madibaev.online
ADMIN_SESSION_SECRET=<at least 32 random characters>
GOOGLE_CLIENT_ID=<google oauth client id>
GOOGLE_CLIENT_SECRET=<google oauth client secret>
ADMIN_GOOGLE_EMAILS=a.madibaev@gmail.com
MGS_COOKIE_SECURE=true
```

The Google OAuth web client must allow the site origin and the exact callback URL:

```text
https://studio.madibaev.online
https://studio.madibaev.online/api/auth/callback/google
```

`ADMIN_PASSWORD` is optional and should remain unset unless an emergency password fallback is intentionally required.

Optional admin AI tooling:

```text
OPENROUTER_API_KEY=<server-only token>
OPENROUTER_MODEL=openai/gpt-4o-mini
```

## Verification

After deployment verify:

1. `/api/health` returns `status: ok`.
2. `/admin/login` accepts the email addresses in `ADMIN_GOOGLE_EMAILS` through Google over HTTPS.
3. A project save survives `docker compose restart web`.
4. `/contact` creates an enquiry and `/admin/enquiries` lists it.
5. Only nginx is exposed publicly; the Next.js `3000` port remains internal.
