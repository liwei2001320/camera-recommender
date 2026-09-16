#!/usr/bin/env bash
# deploy_with_ngrok.sh
# Quick helper to run the price-service locally and expose backend + frontend via ngrok.
# USAGE: bash deploy_with_ngrok.sh
# REQUIREMENTS: node, npm, python3 (for static server), ngrok (optional but recommended)
set -euo pipefail
echo "=== deploy_with_ngrok.sh ==="

# 1) Ensure dependencies installed
if ! command -v node >/dev/null 2>&1; then
  echo "Error: node not found. Install Node.js (>=16) first."
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm not found. Install npm."
  exit 1
fi
if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: python3 not found. Used for static server. Install Python 3."
  exit 1
fi

# 2) Install npm deps (if node_modules missing)
if [ ! -d "node_modules" ]; then
  echo "Installing npm dependencies... (this may take a moment)"
  npm install
else
  echo "node_modules exists, skipping npm install."
fi

# 3) Create .env if missing (template)
if [ ! -f ".env" ]; then
  cat > .env <<'EOF'
PORT=5000
# Optional aggregator key for VEAPI (leave empty to use mock data)
# AGG_API_KEY=your_agg_api_key_here
# AGG_BASE=https://api.veapi.cn
EOF
  echo "Created sample .env (edit to add AGG_API_KEY if needed)"
else
  echo ".env exists, using it."
fi

# 4) Start backend (node server.js) in background and record PID
echo "Starting backend (node server.js) ..."
nohup node server.js > backend.log 2>&1 &
backend_pid=$!
echo $backend_pid > backend.pid
echo "Backend started with PID $backend_pid (logs -> backend.log)"

# 5) Start static file server for /mnt/data so you can open the front-end HTML easily
#    (Assumes the front-end file camera_quiz_demo_v3_with_price.html sits in /mnt/data)
STATIC_ROOT="/mnt/data"
if [ -f "${STATIC_ROOT}/camera_quiz_demo_v3_with_price.html" ]; then
  echo "Starting static server at ${STATIC_ROOT} on port 8000 ..."
  (cd "${STATIC_ROOT}" && nohup python3 -m http.server 8000 > static.log 2>&1 &)
  static_pid=$(pgrep -f "python3 -m http.server 8000" || true)
  if [ -n "$static_pid" ]; then
    echo $static_pid > static.pid
    echo "Static server started with PID $static_pid (logs -> static.log)"
  fi
else
  echo "Warning: front-end file not found at ${STATIC_ROOT}/camera_quiz_demo_v3_with_price.html"
  echo "You can still open the local HTML file via file:// or host your own static server."
fi

# 6) If ngrok available, start two tunnels: backend(5000) and frontend(8000)
if command -v ngrok >/dev/null 2>&1; then
  echo "ngrok found. Starting tunnels..."
  # Start backend tunnel
  nohup ngrok http 5000 --log=stdout > ngrok_backend.log 2>&1 &
  # Start frontend tunnel if static server running
  if [ -f static.pid ]; then
    nohup ngrok http 8000 --log=stdout > ngrok_frontend.log 2>&1 &
  fi
  echo "Waiting 2s for ngrok to initialize..."
  sleep 2
  # query ngrok local API for tunnels
  if curl --silent http://127.0.0.1:4040/api/tunnels >/dev/null 2>&1; then
    tunnels_json=$(curl -s http://127.0.0.1:4040/api/tunnels)
    echo "ngrok tunnels:"
    echo "$tunnels_json" | python3 -c "import sys, json; data=json.load(sys.stdin); print('\\n'.join([t['public_url'] + ' -> ' + t['config']['addr'] for t in data.get('tunnels',[])]))"
    echo ""
    echo "If you want the demo front-end to use the ngrok backend, set in your browser Console:"
    echo "  window.PRICE_SERVICE_BASE = 'https://<ngrok-backend-host>' ; location.reload();"
  else
    echo "ngrok API not ready at http://127.0.0.1:4040. Check ngrok logs (ngrok_backend.log / ngrok_frontend.log)."
  fi
else
  echo "ngrok not found. To expose local service run 'ngrok http 5000' in another terminal (after starting backend)."
  echo "See https://ngrok.com for installation."
fi

echo "Done. Useful commands:"
echo "  tail -f backend.log"
echo "  tail -f static.log"
echo "  cat backend.pid && kill \$(cat backend.pid)  # stop backend"
echo "  if [ -f static.pid ]; then kill \$(cat static.pid); fi  # stop static server"
echo "  pkill ngrok  # stop ngrok tunnels (if any)"
echo "Notes: this script is a convenience helper. You can stop processes by using the PIDs recorded in *.pid files."
