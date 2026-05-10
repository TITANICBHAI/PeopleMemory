#!/usr/bin/env bash
set -euo pipefail

# ─── Push to GitHub using GITHUB_PERSONAL_ACCESS_TOKEN ──────────────────────
#
# Usage:
#   bash scripts/push-to-github.sh
#   bash scripts/push-to-github.sh "your commit message"
#
# Requires GITHUB_PERSONAL_ACCESS_TOKEN to be set as a Replit secret.
# ─────────────────────────────────────────────────────────────────────────────

REPO_OWNER="TITANICBHAI"
REPO_NAME="people-memory-expo"
BRANCH="main"
COMMIT_MSG="${1:-feat: v2.0.0 — health engine, prep cards, journal, voice notes, groups}"

# ── Validate token ────────────────────────────────────────────────────────────
if [ -z "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" ]; then
  echo "❌  GITHUB_PERSONAL_ACCESS_TOKEN is not set."
  echo "    Go to Replit Secrets and add it, then try again."
  exit 1
fi

# ── Wait for any git lock to clear (up to 10s) ───────────────────────────────
for i in $(seq 1 10); do
  if [ ! -f ".git/config.lock" ] && [ ! -f ".git/index.lock" ]; then
    break
  fi
  echo "⏳  Waiting for git lock to clear ($i/10)…"
  sleep 1
done
# If still locked, force-remove (safe in single-user dev env)
rm -f .git/config.lock .git/index.lock .git/refs/heads/*.lock 2>/dev/null || true

# ── Build the authenticated remote URL (token never written to disk) ──────────
PUSH_URL="https://${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git"

# ── Stage and commit any pending changes ─────────────────────────────────────
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

# ── Push directly via authenticated URL (no git config touched) ───────────────
echo "🚀  Pushing to github.com/${REPO_OWNER}/${REPO_NAME} on branch '${BRANCH}'…"
GIT_TERMINAL_PROMPT=0 git push "$PUSH_URL" "HEAD:refs/heads/${BRANCH}"

echo ""
echo "✅  Successfully pushed to:"
echo "    https://github.com/${REPO_OWNER}/${REPO_NAME}/tree/${BRANCH}"
