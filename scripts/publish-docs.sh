#!/usr/bin/env bash
set -euo pipefail

# ─── Publish Landing Page (docs/) to GitHub ──────────────────────────────────
#
# Reads version info live from app.json, prints a summary, then pushes the
# entire repo (including docs/) to GitHub so GitHub Pages / Cloudflare Pages
# picks up the latest docs/ folder automatically.
#
# Usage:
#   bash scripts/publish-docs.sh
#   bash scripts/publish-docs.sh "your custom commit message"
#
# Requires GITHUB_PERSONAL_ACCESS_TOKEN to be set as a Replit secret.
# ─────────────────────────────────────────────────────────────────────────────

REPO_OWNER="TITANICBHAI"
REPO_NAME="people-memory-expo"
BRANCH="main"
APP_JSON="artifacts/people-mobile/app.json"

# ── Read version info from app.json ──────────────────────────────────────────
APP_VERSION=$(node -e "const a=require('./${APP_JSON}').expo; process.stdout.write(a.version)" 2>/dev/null || echo "2.0.0")
IOS_BUILD=$(node -e "const a=require('./${APP_JSON}').expo; process.stdout.write(String(a.ios?.buildNumber ?? '2'))" 2>/dev/null || echo "2")
ANDROID_CODE=$(node -e "const a=require('./${APP_JSON}').expo; process.stdout.write(String(a.android?.versionCode ?? '5'))" 2>/dev/null || echo "5")
BUNDLE_ID=$(node -e "const a=require('./${APP_JSON}').expo; process.stdout.write(a.android?.package ?? 'com.peoplememory.app')" 2>/dev/null || echo "com.peoplememory.app")

COMMIT_MSG="${1:-docs: publish landing page v${APP_VERSION}}"

echo ""
echo "════════════════════════════════════════════════"
echo "  🌐  Publishing People Memory landing page"
echo "────────────────────────────────────────────────"
echo "  📱  App:             People Memory"
echo "  🏷️   Version:         ${APP_VERSION}"
echo "  🍎  iOS build:       ${IOS_BUILD}"
echo "  🤖  Android code:    ${ANDROID_CODE}"
echo "  📦  Bundle ID:       ${BUNDLE_ID}"
echo "  📂  Source:          docs/"
echo "════════════════════════════════════════════════"
echo ""

# ── Validate token ────────────────────────────────────────────────────────────
if [ -z "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" ]; then
  echo "❌  GITHUB_PERSONAL_ACCESS_TOKEN is not set."
  echo "    Go to Replit Secrets and add it, then try again."
  exit 1
fi

# ── Wait for any git lock to clear ───────────────────────────────────────────
for i in $(seq 1 10); do
  if [ ! -f ".git/config.lock" ] && [ ! -f ".git/index.lock" ]; then
    break
  fi
  echo "⏳  Waiting for git lock to clear ($i/10)…"
  sleep 1
done
rm -f .git/config.lock .git/index.lock .git/refs/heads/*.lock 2>/dev/null || true

PUSH_URL="https://${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git"

# ── Stage and commit ──────────────────────────────────────────────────────────
CHANGED=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
if [ "$CHANGED" -gt "0" ]; then
  echo "📦  $CHANGED changed file(s) — staging…"
  git add -A
  GIT_AUTHOR_NAME="Replit Agent" \
  GIT_AUTHOR_EMAIL="replit-agent@users.noreply.github.com" \
  GIT_COMMITTER_NAME="Replit Agent" \
  GIT_COMMITTER_EMAIL="replit-agent@users.noreply.github.com" \
  git commit -m "$COMMIT_MSG"
  echo "✅  Committed: $COMMIT_MSG"
else
  echo "✅  Nothing to commit — working tree is clean."
fi

# ── Push ──────────────────────────────────────────────────────────────────────
echo ""
echo "🚀  Pushing to github.com/${REPO_OWNER}/${REPO_NAME} …"
GIT_TERMINAL_PROMPT=0 git push "$PUSH_URL" "HEAD:refs/heads/${BRANCH}"

echo ""
echo "════════════════════════════════════════════════"
echo "  ✅  Docs pushed successfully!"
echo ""
echo "  🔗  GitHub:"
echo "      https://github.com/${REPO_OWNER}/${REPO_NAME}/tree/${BRANCH}/docs"
echo ""
echo "  🌐  GitHub Pages (if enabled on docs/ folder):"
echo "      https://${REPO_OWNER}.github.io/${REPO_NAME}/"
echo ""
echo "  ☁️   Cloudflare Pages (if connected to repo):"
echo "      https://peoplememory.app/"
echo ""
echo "  📄  Pages:"
echo "      /           → Landing page"
echo "      /privacy    → Privacy Policy"
echo "      /terms      → Terms of Service"
echo "════════════════════════════════════════════════"
