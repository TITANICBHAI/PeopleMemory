#!/usr/bin/env bash
set -euo pipefail

# ─── Publish docs/ to Cloudflare Pages via Wrangler ─────────────────────────
#
# Usage:
#   bash scripts/publish-docs.sh
#
# Requires these Replit secrets:
#   CLOUDFLARE_API_TOKEN   — from dash.cloudflare.com → My Profile → API Tokens
#   CLOUDFLARE_ACCOUNT_ID  — from dash.cloudflare.com → right sidebar
# ─────────────────────────────────────────────────────────────────────────────

PAGES_PROJECT="peoplememory"
APP_JSON="artifacts/people-mobile/app.json"

# ── Read version info ─────────────────────────────────────────────────────────
APP_VERSION=$(node -e "const a=require('./${APP_JSON}').expo; process.stdout.write(a.version)" 2>/dev/null || echo "1.1.0")
IOS_BUILD=$(node -e "const a=require('./${APP_JSON}').expo; process.stdout.write(String(a.ios?.buildNumber ?? '2'))" 2>/dev/null || echo "2")
ANDROID_CODE=$(node -e "const a=require('./${APP_JSON}').expo; process.stdout.write(String(a.android?.versionCode ?? '5'))" 2>/dev/null || echo "5")

echo ""
echo "════════════════════════════════════════════════"
echo "  🌐  Publishing People Memory landing page"
echo "────────────────────────────────────────────────"
echo "  📱  App:             People Memory"
echo "  🏷️   Version:         ${APP_VERSION}"
echo "  🍎  iOS build:       ${IOS_BUILD}"
echo "  🤖  Android code:    ${ANDROID_CODE}"
echo "  📂  Source:          docs/"
echo "  ☁️   Target:          Cloudflare Pages → ${PAGES_PROJECT}"
echo "════════════════════════════════════════════════"
echo ""

# ── Validate Cloudflare credentials ──────────────────────────────────────────
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "❌  CLOUDFLARE_API_TOKEN is not set."
  echo "    1. Go to dash.cloudflare.com → My Profile → API Tokens"
  echo "    2. Create a token with 'Cloudflare Pages: Edit' permission"
  echo "    3. Add it as a Replit secret named CLOUDFLARE_API_TOKEN"
  exit 1
fi

if [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
  echo "❌  CLOUDFLARE_ACCOUNT_ID is not set."
  echo "    1. Go to dash.cloudflare.com"
  echo "    2. Your Account ID is shown in the right sidebar on any domain page"
  echo "    3. Add it as a Replit secret named CLOUDFLARE_ACCOUNT_ID"
  exit 1
fi

# ── Ensure wrangler is available ──────────────────────────────────────────────
if ! command -v wrangler &>/dev/null; then
  echo "📦  Installing Wrangler CLI…"
  npm install -g wrangler --silent
fi

echo "🚀  Deploying docs/ to Cloudflare Pages project '${PAGES_PROJECT}'…"
echo ""

CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN}" \
CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID}" \
npx wrangler pages deploy docs/ \
  --project-name="${PAGES_PROJECT}" \
  --branch="main" \
  --commit-message="deploy: People Memory v${APP_VERSION} (Android ${ANDROID_CODE})"

echo ""
echo "════════════════════════════════════════════════"
echo "  ✅  Deployed to Cloudflare Pages!"
echo ""
echo "  🌐  Live URL:"
echo "      https://peoplememory.app/"
echo ""
echo "  ☁️   Cloudflare dashboard:"
echo "      https://dash.cloudflare.com/?to=/:account/pages/view/${PAGES_PROJECT}"
echo ""
echo "  📄  Pages live:"
echo "      /           → Landing page"
echo "      /privacy    → Privacy Policy"
echo "      /terms      → Terms of Service"
echo "      /robots.txt → Search engine rules"
echo "      /sitemap.xml → Sitemap"
echo "      /llms.txt   → AI crawler file"
echo "════════════════════════════════════════════════"
