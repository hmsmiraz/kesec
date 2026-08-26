#!/usr/bin/env bash
# kesec VM deployment script.
# Run from inside the cloned repo root on a fresh Ubuntu VM: ./deploy.sh
# Safe to re-run - skips steps that are already done (installing Docker,
# creating .env) and just rebuilds/restarts the containers.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

echo "== kesec deployment =="
echo ""

# --- 1. Install Docker if missing ---
if ! command -v docker &> /dev/null; then
  echo "-> Docker not found. Installing..."
  curl -fsSL https://get.docker.com | sudo sh
  echo "-> Docker installed."
else
  echo "-> Docker already installed, skipping."
fi
echo ""

# --- 2. Create .env if missing (auto-generates all secrets) ---
if [ ! -f .env ]; then
  echo "-> No .env found, creating one."
  read -rp "   Domain (or this VM's IP if you don't have one yet): " DOMAIN

  if [[ "$DOMAIN" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
    CADDY_ADDRESS="http://${DOMAIN}"
    echo "   Detected an IP address - serving plain HTTP only (no certificate is possible for a bare IP)."
  else
    CADDY_ADDRESS="${DOMAIN}"
    echo "   Detected a domain - Caddy will automatically obtain an HTTPS certificate for it."
  fi

  # Fernet key = 32 random bytes, url-safe base64 - generated with stdlib only,
  # no need to pip install the cryptography package on the bare VM.
  ENCRYPTION_KEY=$(python3 -c "import secrets, base64; print(base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())")
  JWT_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
  MYSQL_ROOT_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(24))")
  MYSQL_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(24))")

  cat > .env << ENVEOF
DOMAIN=${DOMAIN}
CADDY_ADDRESS=${CADDY_ADDRESS}
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
MYSQL_PASSWORD=${MYSQL_PASSWORD}
JWT_SECRET_KEY=${JWT_SECRET_KEY}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ENVEOF
  chmod 600 .env
  echo "-> .env created with freshly generated secrets."
else
  echo "-> .env already exists, leaving secrets as-is."
  # shellcheck disable=SC1091
  source .env

  # Backfill CADDY_ADDRESS for .env files created before this variable existed.
  if ! grep -q '^CADDY_ADDRESS=' .env; then
    echo "-> .env predates CADDY_ADDRESS - adding it based on your existing DOMAIN value."
    if [[ "$DOMAIN" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
      echo "CADDY_ADDRESS=http://${DOMAIN}" >> .env
    else
      echo "CADDY_ADDRESS=${DOMAIN}" >> .env
    fi
  fi
fi
echo ""

# --- 3. Firewall: only 22 (SSH), 80, 443 reachable from the internet ---
if command -v ufw &> /dev/null; then
  echo "-> Configuring firewall (ufw): allowing 22, 80, 443 only."
  sudo ufw allow 22/tcp   > /dev/null
  sudo ufw allow 80/tcp   > /dev/null
  sudo ufw allow 443/tcp  > /dev/null
  sudo ufw --force enable > /dev/null
  echo "   Note: if you SSH in on a non-standard port, run"
  echo "   'sudo ufw allow <your-port>/tcp' as well or you'll lock yourself out."
else
  echo "-> ufw not found - skipping. Manually restrict this VM to ports 22/80/443"
  echo "   using your provider's firewall/security-group settings instead."
fi
echo ""

# --- 4. Build and start everything ---
echo "-> Building and starting containers (first run can take a few minutes)..."
sudo docker compose -f docker-compose.prod.yml up -d --build
echo ""

echo "-> Waiting for containers to settle..."
sleep 5
sudo docker compose -f docker-compose.prod.yml ps
echo ""

DOMAIN_VALUE=$(grep -m1 '^DOMAIN=' .env | cut -d= -f2-)
echo "== Done =="
echo "Visit: https://${DOMAIN_VALUE} (or http://${DOMAIN_VALUE} if this is a bare IP, or DNS hasn't propagated yet)"
echo ""
echo "Useful commands:"
echo "  sudo docker compose -f docker-compose.prod.yml logs -f     # view logs"
echo "  sudo docker compose -f docker-compose.prod.yml ps          # check status"
echo "  sudo docker compose -f docker-compose.prod.yml down        # stop everything"
