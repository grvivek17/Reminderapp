#!/bin/bash
set -e
cd ~/Reminderapp

echo "=== Pulling latest code ==="
git fetch origin
git reset --hard origin/main

echo "=== Fixing wrong-continent coordinates ==="
cd ~/Reminderapp/backend
node fix_coords.js
cd ~/Reminderapp

echo "=== Restarting backend ==="
pkill -f "node server.js" 2>/dev/null || true
sleep 1
cd ~/Reminderapp/backend
nohup node server.js > ~/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
sleep 3
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health || echo "000")
echo "Backend health check: $HTTP_STATUS"
cd ~/Reminderapp

echo "=== Rebuilding frontend Docker ==="
docker stop reminder-frontend 2>/dev/null || true
docker rm reminder-frontend 2>/dev/null || true
docker build -t reminder-frontend .
docker run -d --name reminder-frontend -p 8080:80 --restart unless-stopped reminder-frontend
sleep 3
docker ps
echo "=== DONE ==="
