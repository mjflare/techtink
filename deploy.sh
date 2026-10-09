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

echo "🔄 4. Restarting PM2 process..."
if pm2 list | grep -q "techtink"; then
  pm2 restart techtink
else
  pm2 start server.js --name "techtink" --interpreter bun
fi
pm2 save

echo "======================================"
echo "  ✅ TechTink successfully updated!   "
echo "======================================"
