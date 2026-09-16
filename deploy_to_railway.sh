#!/usr/bin/env bash
# deploy_to_railway.sh
# Helper to initialize Git repo, create a commit, and guide you through deploying to Railway with CLI.
# USAGE: bash deploy_to_railway.sh <your-git-remote-url>
# Example: bash deploy_to_railway.sh git@github.com:yourname/camera-price-service.git
set -euo pipefail
echo "=== deploy_to_railway.sh ==="

if ! command -v git >/dev/null 2>&1; then
  echo "Error: git not installed. Install git and retry."
  exit 1
fi

if ! command -v railway >/dev/null 2>&1; then
  echo "Warning: railway CLI not found. This script will still init git and show instructions to deploy via Railway web console."
  RAILWAY_CLI=false
else
  RAILWAY_CLI=true
fi

# 1) Ensure npm deps installed
if [ ! -d "node_modules" ]; then
  echo "Installing npm dependencies..."
  npm install
else
  echo "node_modules exists, skipping npm install."
fi

# 2) Git init & commit if needed
if [ ! -d ".git" ]; then
  git init
  git add .
  git commit -m "chore: init camera-price-service for deployment"
  echo "Created local git repo and initial commit."
else
  echo "Git repo exists. Creating a new commit if there are changes..."
  git add .
  if git diff --cached --quiet; then
    echo "No changes to commit."
  else
    git commit -m "chore: update before deployment"
  fi
fi

# 3) Add remote if provided
REMOTE_URL="${1:-}"
if [ -n "$REMOTE_URL" ]; then
  git remote remove origin >/dev/null 2>&1 || true
  git remote add origin "$REMOTE_URL"
  echo "Added remote origin: $REMOTE_URL"
  echo "Pushing to remote (main branch) ..."
  git branch -M main || true
  git push -u origin main
  echo "Pushed to your GitHub repo. Now go to Railway and deploy from this repo."
else
  echo "No remote URL provided."
  echo "To deploy on Railway you can either: "
  echo "  A) Create a new GitHub repo and push this project to it"
  echo "     then go to https://railway.app and 'Deploy from GitHub'."
  echo "  B) Install Railway CLI and run 'railway up' (interactive)."
fi

# 4) If railway CLI present, offer to init & deploy
if [ "$RAILWAY_CLI" = true ]; then
  echo "railway CLI detected."
  echo "If you are not logged in, run: railway login"
  echo "This script can now run 'railway init' and 'railway up' to deploy interactively."

  read -p "Run railway init and deploy now? (y/N): " yn
  if [ "$yn" = "y" ] || [ "$yn" = "Y" ]; then
    railway init
    railway up
  else
    echo "Skipping railway init. You can run 'railway up' later."
  fi
else
  echo "Railway CLI not installed. Install from https://railway.app/docs/cli and run 'railway up' after login."
fi

echo ""
echo "After deploying to Railway, set environment variables in Railway dashboard:"
echo "  AGG_API_KEY = <your aggregator api key>  (optional)"
echo "  AGG_BASE = https://api.veapi.cn   (or provider base)"
echo "  PORT = 5000"

echo "When service URL is available, point the front-end to it by setting window.PRICE_SERVICE_BASE in your browser console:"
echo "  window.PRICE_SERVICE_BASE = 'https://your-service-domain'; location.reload();"
