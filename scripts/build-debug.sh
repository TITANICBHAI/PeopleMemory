#!/usr/bin/env bash
set -euo pipefail

# ─── EAS Debug / Preview APK Build ───────────────────────────────────────────
#
# Triggers an EAS cloud build for the "preview" profile (internal APK).
# Prints app version, version code and build number before and after.
#
# Usage:
#   bash scripts/build-debug.sh
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
echo "  🔧  DEBUG / PREVIEW APK BUILD"
echo "────────────────────────────────────────────────"
echo "  📱  App:             ${APP_NAME}"
echo "  🏷️   Version:         ${APP_VERSION}"
echo "  🍎  iOS build:       ${IOS_BUILD}"
echo "  🤖  Android code:    ${ANDROID_CODE}"
echo "  📦  Bundle ID:       ${BUNDLE_ID}"
echo "  📂  Profile:         preview (internal APK)"
echo "════════════════════════════════════════════════"
echo ""

# ── Check EAS CLI ─────────────────────────────────────────────────────────────
if ! command -v eas &>/dev/null; then
  echo "⚠️   EAS CLI not found. Installing globally…"
  npm install -g eas-cli
fi

echo "🚀  Starting EAS preview build (Android APK)…"
echo "    This runs in the cloud — a link will appear below."
echo ""

cd artifacts/people-mobile

eas build \
  --platform android \
  --profile preview \
  --non-interactive \
  2>&1

echo ""
echo "════════════════════════════════════════════════"
echo "  ✅  Build submitted!"
echo "────────────────────────────────────────────────"
echo "  📱  App:             ${APP_NAME}"
echo "  🏷️   Version:         ${APP_VERSION}"
echo "  🤖  Android code:    ${ANDROID_CODE}"
echo "  📦  Bundle ID:       ${BUNDLE_ID}"
echo "  📂  Profile:         preview (APK)"
echo "  🔗  Monitor at:      https://expo.dev/accounts/[your-account]/projects/people-mobile/builds"
echo "════════════════════════════════════════════════"
