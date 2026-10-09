#!/usr/bin/env bash
set -euo pipefail

echo "======================================"
echo "  🚀 TechTink Update & Deployment     "
echo "======================================"

cd "$(dirname "$0")"

echo "📥 1. Pulling latest code from git..."
git pull origin main

echo "📦 2. Installing dependencies..."
bun install

echo "🛠️ 3. Building frontend..."
bun run build

echo "🔄 4. Restarting TechTink process..."
if [ -f /etc/systemd/system/techtink.service ]; then
  echo "⚙️ Restarting via systemd (techtink.service)..."
  sudo systemctl daemon-reload
  sudo systemctl restart techtink
elif command -v pm2 >/dev/null 2>&1; then
  # Ensure node shim exists if only bun is installed
  if ! command -v node >/dev/null 2>&1 && command -v bun >/dev/null 2>&1; then
    sudo ln -sf "$(which bun)" /usr/local/bin/node 2>/dev/null || true
  fi
  if pm2 list | grep -q "techtink"; then
    pm2 restart techtink
  else
    pm2 start server.js --name "techtink" --interpreter bun
  fi
  pm2 save
else
  echo "⚠️ No process manager detected. Starting in background with Bun..."
  pkill -f "bun server.js" 2>/dev/null || true
  nohup bun server.js > techtink.log 2>&1 &
fi

echo "======================================"
echo "  ✅ TechTink successfully updated!   "
echo "======================================"
