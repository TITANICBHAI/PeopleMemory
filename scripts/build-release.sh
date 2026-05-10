#!/usr/bin/env bash
set -euo pipefail

# ─── EAS Production / Release AAB Build ──────────────────────────────────────
#
# Triggers an EAS cloud build for the "production" profile (signed AAB for
# Google Play). Prints app version, version code and build number before/after.
#
# Usage:
#   bash scripts/build-release.sh
#
# Requires: EAS CLI installed, logged in to Expo account
# ─────────────────────────────────────────────────────────────────────────────

APP_JSON="artifacts/people-mobile/app.json"

# ── Read version info ─────────────────────────────────────────────────────────
APP_VERSION=$(node -e "const a=require('./${APP_JSON}').expo; process.stdout.write(a.version)")
IOS_BUILD=$(node -e "const a=require('./${APP_JSON}').expo; process.stdout.write(String(a.ios?.buildNumber ?? '—'))")
ANDROID_CODE=$(node -e "const a=require('./${APP_JSON}').expo; process.stdout.write(String(a.android?.versionCode ?? '—'))")
BUNDLE_ID=$(node -e "const a=require('./${APP_JSON}').expo; process.stdout.write(a.android?.package ?? '—')")
APP_NAME=$(node -e "const a=require('./${APP_JSON}').expo; process.stdout.write(a.name)")

echo ""
echo "════════════════════════════════════════════════"
echo "  🚀  PRODUCTION / RELEASE BUILD"
echo "────────────────────────────────────────────────"
echo "  📱  App:             ${APP_NAME}"
echo "  🏷️   Version:         ${APP_VERSION}"
echo "  🍎  iOS build:       ${IOS_BUILD}"
echo "  🤖  Android code:    ${ANDROID_CODE}"
echo "  📦  Bundle ID:       ${BUNDLE_ID}"
echo "  📂  Profile:         production (AAB — Google Play)"
echo "════════════════════════════════════════════════"
echo ""

# ── Confirm before proceeding ─────────────────────────────────────────────────
echo "⚠️   This will submit a PRODUCTION build to EAS."
echo "    Version ${APP_VERSION} (versionCode ${ANDROID_CODE}) will be uploaded."
echo ""

# ── Check EAS CLI ─────────────────────────────────────────────────────────────
if ! command -v eas &>/dev/null; then
  echo "⚠️   EAS CLI not found. Installing globally…"
  npm install -g eas-cli
fi

echo "🚀  Starting EAS production build (Android AAB)…"
echo "    This runs in the cloud — a download link will appear when done."
echo ""

cd artifacts/people-mobile

eas build \
  --platform android \
  --profile production \
  --non-interactive \
  2>&1

echo ""
echo "════════════════════════════════════════════════"
echo "  ✅  Production build submitted!"
echo "────────────────────────────────────────────────"
echo "  📱  App:             ${APP_NAME}"
echo "  🏷️   Version:         ${APP_VERSION}"
echo "  🤖  Android code:    ${ANDROID_CODE}"
echo "  📦  Bundle ID:       ${BUNDLE_ID}"
echo "  📂  Profile:         production (AAB)"
echo "  🔗  Monitor at:      https://expo.dev/accounts/[your-account]/projects/people-mobile/builds"
echo "  🏪  Submit to Play:  eas submit --platform android --profile production"
echo "════════════════════════════════════════════════"
