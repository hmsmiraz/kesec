# kesec

A minimal, self-hosted password vault for your account credentials — Gmail, social accounts, anything else you'd otherwise stick in a text file. You run it yourself; nobody else touches your data.

- **Backend**: Python (FastAPI) + MySQL, with JWT auth and encrypted passwords
- **Frontend**: Next.js (TypeScript, Tailwind)
- **Layout**: one repo, two folders — `backend/` and `frontend/`

**What it does:** create an account, log in, and store credentials (title, username, password, website, notes) in your own vault. Passwords are generated, revealed, and copied from the UI; every entry shows when it was last updated. Full CRUD via a REST API underneath.

---

## Part 1 — Run it locally

You'll run three things at once, each in its own terminal: MySQL, the backend, and the frontend.

### Pull MySQL

```bash
docker pull mysql:8.0
```

### 1. Start MySQL

```bash
docker compose up -d
```

This starts MySQL on `localhost:3306` with a `kesec` database already created (user `kesec_user` / password `kesec_password` — fine for local dev, see `docker-compose.yml` to change them). First run pulls the `mysql:8.0` image (~500MB), so it can take a minute or two the very first time.

No Docker? Point `DATABASE_URL` in `backend/.env` (step 2) at any MySQL 8+ you already have instead, and create a `kesec` database yourself.

### 2. Backend

```bash
cd backend
python3 -m venv .venv
```
Let this finish fully before doing anything else — it can take 10–30 seconds and may look idle while it does. Don't press Ctrl+C.

```bash
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Generate two secrets and paste them into `.env`:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

The first goes in `JWT_SECRET_KEY`, the second in `ENCRYPTION_KEY`. Then run the API:

```bash
uvicorn app.main:app --reload --port 8000
```

Database tables are created automatically on first run. Check it's alive at http://localhost:8000/api/health (should say `{"status":"ok"}`) or browse the interactive docs at http://localhost:8000/docs. A `404` at `http://localhost:8000/` itself is normal — that's not a page, only `/api/...` and `/docs` are.

### 3. Frontend

In a **second terminal**, leaving the backend running:

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open **http://localhost:3000** — that's the actual app. Register an account and start adding credentials.

### Troubleshooting

- **`ensurepip is not available`** when creating the venv → install the matching package for your Python version, e.g. `sudo apt install python3.12-venv` (check your version first with `python3 --version`).
- **`externally-managed-environment` from pip** → you're not inside an activated venv. Run `source .venv/bin/activate` first; your prompt should show `(.venv)`.
- **`npm warn deprecated eslint@...`** → harmless. `eslint-config-next` doesn't support ESLint 10 yet, so this project intentionally pins ESLint 9. Doesn't affect anything.

---

## Part 2 — Deploy to a VM

This uses Docker Compose for everything (MySQL, backend, frontend) plus **Caddy** as a reverse proxy, which gets you free automatic HTTPS. Both apps sit behind one domain, so the browser talks to the API as same-origin — no CORS setup needed in production.

### 1. Get a VM

Any provider (DigitalOcean, Hetzner, Lightsail, etc.), Ubuntu 24.04, 2GB RAM is comfortable.

### 2. Point a domain at it (optional but recommended)

Add a DNS A record for your domain → the VM's IP. No domain yet? You can skip this and use the IP directly, but you'll only get HTTP, not HTTPS — Let's Encrypt needs a real domain to issue a certificate.

### 3. Install Docker on the VM

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Log out and back in for the group change to take effect.

### 4. Get the code onto the VM

`git clone` your repo, or `scp -r kesec/ user@vm-ip:~/` from your machine.

### 5. Create production secrets

```bash
cd kesec
cp .env.prod.example .env
```

Edit `.env` and fill in real values:
- `DOMAIN` — your domain (or the VM's IP if you skipped step 2)
- `MYSQL_ROOT_PASSWORD` / `MYSQL_PASSWORD` — strong, unique (`openssl rand -base64 24`)
- `JWT_SECRET_KEY` / `ENCRYPTION_KEY` — generate fresh ones with the same two commands from Part 1. **Don't reuse your local dev keys.**

### 6. Bring it up

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

First run takes a few minutes (building both images, pulling MySQL). Then visit your domain — or `http://VM_IP` if you're not using one.

### 7. MySQL configuration & backups

The database name (`kesec`) and application user (`kesec_user`) are fixed in `docker-compose.prod.yml` — only the two passwords are configurable, via `.env`. If you want a different database or username, edit the `mysql` and `backend` service definitions in that file directly.

**Data persistence.** MySQL's data lives in a named Docker volume (`kesec_mysql_data`), not inside the container itself. It survives `docker compose up -d --build` (rebuilds/updates), container restarts, and even `docker compose down`. It's only deleted if you explicitly run `docker compose -f docker-compose.prod.yml down -v` (that `-v` removes volumes too — don't run it unless you mean to wipe the database).

**No port exposed to the internet, on purpose.** MySQL isn't reachable from outside the VM at all in this setup — only the `backend` container can reach it, over Docker's internal network. To connect to it yourself (inspect data, run a manual query), exec into the container rather than connecting from your own machine:

```bash
docker compose -f docker-compose.prod.yml exec mysql mysql -u root -p kesec
```

(enter your `MYSQL_ROOT_PASSWORD` when prompted).

**Backing up:**

```bash
docker compose -f docker-compose.prod.yml exec mysql \
  mysqldump -u root -p kesec > kesec-backup-$(date +%F).sql
```

**Restoring from a backup:**

```bash
cat kesec-backup-2026-08-25.sql | docker compose -f docker-compose.prod.yml exec -T mysql \
  mysql -u root -p kesec
```

If this vault holds credentials you actually care about, it's worth putting the backup command on a daily cron job and copying the resulting `.sql` file somewhere other than the VM itself (it's the one thing that isn't disposable — everything else can be rebuilt from the repo).

### 8. Firewall

Only ports 80 and 443 need to be open to the internet — MySQL, the backend, and the frontend aren't exposed to the host at all in `docker-compose.prod.yml`, only reachable by Caddy internally. If your VM provider has a firewall/security-group panel, close everything except 22 (SSH), 80, and 443 there too.

### Updating later

```bash
git pull   # or re-upload your changes
docker compose -f docker-compose.prod.yml up -d --build
```

### Checking it's healthy

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

---

## API reference

| Method | Path                 | Description                          | Auth required |
|--------|----------------------|---------------------------------------|:---:|
| POST   | `/api/auth/register` | Create an account                     | – |
| POST   | `/api/auth/login`    | Log in, returns a JWT                 | – |
| POST   | `/api/auth/logout`   | Revoke the current session token      | ✓ |
| GET    | `/api/auth/me`       | Get the logged-in user                | ✓ |
| GET    | `/api/secrets`       | View all your stored credentials      | ✓ |
| GET    | `/api/secrets/{id}`  | View a single credential              | ✓ |
| POST   | `/api/secrets`       | Add a credential                      | ✓ |
| PUT    | `/api/secrets/{id}`  | Edit a credential (partial update)    | ✓ |
| DELETE | `/api/secrets/{id}`  | Delete a credential                   | ✓ |

Authenticated requests send `Authorization: Bearer <token>`, using the token returned by `/api/auth/login`.

## Security notes — please read before storing real passwords

- **Encryption key custody**: `ENCRYPTION_KEY` is what makes your stored passwords readable. Whoever holds this key *and* a copy of the database can decrypt every stored password. Keep it out of git, back it up separately from the database, never share it. If you lose it, stored passwords are unrecoverable — there's no "forgot my key" flow. This is an application-level key, not a zero-knowledge design (unlike some commercial password managers, where only *you* could ever decrypt your vault) — treat kesec as a solid personal/small-team tool, not a Bitwarden replacement.
- **Session tokens**: the frontend stores its JWT in `localStorage` and sends it as an `Authorization` header — simple, and fine for personal use, but readable by any JavaScript running on the page (i.e. vulnerable to XSS). Moving to an `httpOnly` cookie with CSRF protection is a meaningful hardening step if you want to go further.
- **Rate limiting**: the login endpoint has no rate limiting or lockout. Consider adding one (e.g. [slowapi](https://github.com/laurentS/slowapi)) before exposing this beyond your own machine.
- **Migrations**: tables are created with `Base.metadata.create_all()` on startup — fine to get started, but it won't safely evolve an existing schema. For anything long-lived, switch to [Alembic](https://alembic.sqlalchemy.org/) migrations.

## Tech stack

- **Backend**: FastAPI, SQLAlchemy, PyMySQL, bcrypt, PyJWT, `cryptography` (Fernet)
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, lucide-react
- **Database**: MySQL 8
- **Deployment**: Docker Compose + Caddy