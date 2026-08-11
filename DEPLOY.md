# Task Manager — Production Deployment Runbook

Step-by-step guide to go from "code committed" to "live at
`https://yourdomain.com`". It assumes you picked the **Docker** path from
[SETUP.md](./SETUP.md). Every command below is copy-pasteable; replace the
`yourdomain.com` / `SERVER_IP` / provider placeholders.

> **One-time shopping list (you need these before you start):**
> 1. A **domain** you can edit DNS for.
> 2. A **VPS** (any provider: DigitalOcean, Hetzner, Lightsail, Linode…).
>    1–2 GB RAM / 1 vCPU is plenty for SQLite + FPM + Nginx + Caddy.
>    Ubuntu 24.04 is assumed below.
> 3. A **mail provider** (Resend, Mailgun, Postmark, SES…) — see
>    [MAIL_PROVIDERS.md](./MAIL_PROVIDERS.md). Sender email must be verified.
> 4. *(Optional)* a **GitHub** repo so CI/CD can build and push the image.

---

## 1. DNS

Point your domain at the VPS. In your registrar's DNS panel add:

| Type | Name | Value | Notes |
|------|------|-------|-------|
| A    | `@`  | `SERVER_IP` | root domain |
| A    | `www`| `SERVER_IP` | optional |

Then add the mail provider's DNS records (SPF, DKIM, sometimes DMARC) — the
provider's dashboard gives you the exact values. Set these **now** so email
verification is done by the time you finish section 6.

---

## 2. One-time server setup

```bash
# 1. SSH in as root (or your provider's default user)
ssh root@SERVER_IP

# 2. Create a normal user and give it sudo (optional but recommended)
adduser deployer
usermod -aG sudo deployer
exit

# 3. Copy your SSH key over (from your local machine)
ssh-copy-id deployer@SERVER_IP

# 4. Log in as the deploy user
ssh deployer@SERVER_IP

# 5. Update the OS
sudo apt update && sudo apt upgrade -y

# 6. Install Docker + Compose plugin
curl -fsSL https://get.docker.com | sh

# 7. Let your user run docker without sudo
sudo usermod -aG docker $USER

# 8. Firewall: SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw --force enable

# 9. Reboot, then verify
sudo reboot
# ...reconnect ...
docker --version
docker compose version        # must be v2.24+ (for the Caddy override)
```

> If your provider has its own security group / firewall (DigitalOcean
> firewall, AWS SG, Hetzner firewall), open 22/80/443 there **and** keep the
> `ufw` rules above.

---

## 3. Install the app

```bash
# Clone the repo into /opt (or anywhere you like)
sudo mkdir -p /opt && sudo chown $USER /opt
cd /opt
git clone <repo-url> task-manager
cd task-manager

# Create the environment file
cp backend/.env.example backend/.env
nano backend/.env
```

Set `backend/.env` to the values below. `APP_KEY` may stay **empty** — the
container generates one and persists it in the storage volume on first boot
(so you never need PHP on the server):

```dotenv
APP_NAME="Task Manager"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

APP_FORCE_HTTPS=true
TRUST_PROXIES=*
CORS_ALLOWED_ORIGINS=https://yourdomain.com
SESSION_SECURE_COOKIE=true
SESSION_DOMAIN=yourdomain.com
LOG_LEVEL=warning
LOG_CHANNEL=daily

DB_CONNECTION=sqlite
SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database

MAIL_MAILER=smtp
MAIL_HOST=smtp.yourprovider.com
MAIL_PORT=587
MAIL_USERNAME=<provider username>
MAIL_PASSWORD=<provider password>
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=no-reply@yourdomain.com
MAIL_FROM_NAME="${APP_NAME}"
```

> For a provider using an API key instead of SMTP (SES, Postmark, Resend),
> use the matching `MAIL_MAILER` block from `backend/.env.example` instead of
> `smtp`.

Optionally create a root `.env` for Docker Compose interpolation (it's
gitignored). This avoids retyping the domain on every command:

```dotenv
# /opt/task-manager/.env
DOMAIN=yourdomain.com
# APP_IMAGE=ghcr.io/yourorg/task-manager:latest   # uncomment to use CI image
```

---

## 4. Start the stack with TLS (Caddy)

```bash
cd /opt/task-manager
DOMAIN=yourdomain.com docker compose \
  -f docker-compose.yml \
  -f deploy/docker-compose.caddy.yml \
  up -d --build
```

What happens automatically on first boot (see `backend/docker/entrypoint.sh`):

1. `APP_KEY` is generated and saved to `storage/.docker-app-key` if missing.
2. `php artisan migrate --force` runs once (guarded by a lockfile).
3. `php artisan optimize` builds config/route/view caches.
4. Caddy fetches a Let's Encrypt certificate for your domain (needs DNS +
   ports 80/443 reachable — if it fails, fix DNS and run `docker compose up -d`
   again).

Wait ~30–60s, then check everything is healthy:

```bash
docker compose ps
curl -sS https://yourdomain.com/up        # expect: {"status":"healthy"} (or 200)
```

> **Prefer Cloudflare / your provider's LB instead of Caddy?** Skip the
> `deploy/docker-compose.caddy.yml` file and use only `docker-compose.yml`
> (Nginx listens on host port 80). Put Cloudflare/LB in front, set
> Cloudflare SSL mode to "Full (strict)", and keep `APP_FORCE_HTTPS=true` +
> `TRUST_PROXIES=*` — the app will detect HTTPS from the proxy headers.

---

## 5. Verify the deployment

Run the smoke test from **your local checkout** (needs `curl` + `grep`):

```bash
./deploy/smoke-test.sh https://yourdomain.com
```

Expected output — all OK:

```
  OK  /up (health)              (HTTP 200)
  OK  / (SPA)                   (HTTP 200)
  OK  /privacy                  (HTTP 200)
  OK  /terms                    (HTTP 200)
  OK  /dashboard (SPA fallback)
  OK  /api/* 404 (no SPA leak)
All checks passed.
```

Then do a real end-to-end check in the browser:

1. Open `https://yourdomain.com/register` and create your first account.
2. Log in, create a task, check the dashboard renders.
3. Log out → "Forgot password?" → request a reset code → confirm the email
   arrives → reset the password.

---

## 6. Email deliverability

1. Finish the provider's domain verification (SPF/DKIM records — set in step 1).
2. Send a test from inside the container:

```bash
docker compose exec app php artisan tinker --execute="Mail::raw('Mail provider check', function (\$m) { \$m->to('you@example.com'); });"
```

3. Confirm it lands in your inbox (not spam). If not, check
   `docker compose logs app | grep -i mail` and SPF/DKIM with a lookup tool
   (`dig txt yourdomain.com`, MXToolbox, etc.).

---

## 7. Backups

**On-server (automatic):** every night at 02:00 the scheduler runs
`app:backup --prune=30` — copies `database.sqlite` (+ WAL sidecars), `.env`,
and uploaded files into `storage/app/backups/<timestamp>/`. Run one now:

```bash
docker compose exec app php artisan app:backup
docker compose exec app ls -1 storage/app/backups
```

**Off-site (do this — the server can die):** from any machine with SSH access
to the server, pull the archives locally. Add it to cron to run after the
server's 02:00 backup:

```bash
./deploy/backup-offsite.sh   # needs DEPLOY_HOST, DEPLOY_DIR, DEST_DIR env vars
```

Example cron (on your own machine): `30 3 * * * DEPLOY_HOST=deployer@server DEPLOY_DIR=/opt/task-manager DEST_DIR=~/task-manager-backups /path/to/repo/deploy/backup-offsite.sh`

**Restore:** stop the app, replace the database, start it again:

```bash
docker compose stop app schedule queue
docker compose run --rm app sh -c \
  "cp storage/app/backups/<timestamp>/database.sqlite database/database.sqlite"
docker compose start app schedule queue
docker compose exec app php artisan config:clear
```

---

## 8. Updates

```bash
cd /opt/task-manager
git pull --ff-only
DOMAIN=yourdomain.com docker compose \
  -f docker-compose.yml -f deploy/docker-compose.caddy.yml \
  up -d --build --pull always --remove-orphans
./deploy/smoke-test.sh https://yourdomain.com
```

Migrations run automatically on containers that already migrated (the lockfile
is already in the storage volume), so nothing extra to do. If a deploy
introduces new migration files, they run on the next container start.

---

## 9. Optional: CI/CD with GitHub Actions + GHCR

The workflow (`.github/workflows/deploy.yml`) runs on every push to `main`:
tests → build & push `ghcr.io/<owner>/<repo>:latest` → *(optional)* SSH deploy.

To enable auto-deploy to this server, add repository secrets:

| Secret              | Example                        | Purpose |
|---------------------|--------------------------------|---------|
| `DEPLOY_HOST`       | `deployer@yourdomain.com`      | setting this enables the deploy job |
| `DEPLOY_SSH_KEY`    | `-----BEGIN OPENSSH...`        | private key the server trusts |
| `DEPLOY_DIR`        | `/opt/task-manager`            | repo location on the server |
| `DEPLOY_BASE_URL`   | `https://yourdomain.com`       | URL the smoke test hits |

On the server, tell Compose to pull the CI image instead of building:

```dotenv
# /opt/task-manager/.env
APP_IMAGE=ghcr.io/<owner>/<repo>:latest
```

**GHCR access:** images are private by default. Either grant the server read
access in the package settings, or log in on the server:
`echo <PAT> | docker login ghcr.io -u <user> --password-stdin` (a fine-grained
PAT with `packages:read` is enough).

Then every push to `main` deploys and smoke-tests automatically.

---

## 10. Monitoring

- **Uptime:** point UptimeRobot / Better Stack / your provider's monitor at
  `https://yourdomain.com/up` (expect 200).
- **Health:** `docker compose exec app php artisan app:health` exits `0`/`1`
  and checks DB + storage writability.
- **Logs:**
  - App: `docker compose logs -f --tail=100 app`
  - Web: `docker compose logs -f --tail=100 web`
  - Caddy (cert errors etc.): `docker compose logs -f --tail=100 caddy`
  - Laravel log (rotated daily, 14 days): `storage/logs/laravel-*.log`
- **Disk:** SQLite + backups grow; watch free space
  (`df -h /`, backups are pruned to the last 30).

---

## 11. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `docker compose up` fails: "expected sequence" / `!override` | Compose < 2.24 — upgrade the plugin, or skip the Caddy override. |
| Caddy can't get a certificate | DNS record missing/not propagated (`dig +short yourdomain.com`); port 443 blocked (`ufw status`, provider firewall). |
| `up` returns 404 | Only happens if `storage/.migrated.lock` exists but the DB was wiped — delete the lock in the volume and restart. |
| Email never arrives | `MAIL_MAILER=log` still set? Then it only writes to the log. Check provider verification + SPF/DKIM, run the section-6 test. |
| Login says "Too many attempts" | Rate limits are per-IP; wait a minute (login 10/min). |
| Cert error in browser after Cloudflare | Set SSL mode to **Full (strict)**, keep `TRUST_PROXIES=*`. |
| Want to blow everything away | `docker compose down -v` deletes the volumes — this **deletes your data**; restore from backups (section 7). |

---

## 12. Launch checklist

- [ ] DNS A records + mail provider SPF/DKIM set and propagated
- [ ] `backend/.env` is production values; `APP_DEBUG=false`; `APP_KEY` set or auto-persisted
- [ ] `docker compose ps` shows all services healthy (Caddy variant)
- [ ] `./deploy/smoke-test.sh` passes all checks
- [ ] Register → login → task → reset-password flow works live
- [ ] Test email delivered from provider, not spam
- [ ] Off-site backup cron configured and first archive pulled
- [ ] Uptime monitor pointed at `/up`
- [ ] `LEGAL_*` env vars set with real company details (`LEGAL_COMPANY_NAME`, `LEGAL_ADDRESS`, `LEGAL_CONTACT_EMAIL`, `LEGAL_JURISDICTION` — see `backend/.env.example`)
- [ ] *(Optional)* GHCR secrets + `APP_IMAGE` for CI/CD auto-deploy

---

**Last Updated:** August 11, 2026
