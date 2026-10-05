#!/usr/bin/env bash
# Run the visual bug check: screenshots + automated findings.
# Makes sure deps, the headless browser and the dev server are ready first.
set -euo pipefail
cd "$(dirname "$0")/.."

BROWSER_DIR="${BROWSER_DIR:-/tmp/win11web-browser}"

[ -d node_modules/playwright-core ] || ./visual-bugcheck/install-deps.sh
[ -f "$BROWSER_DIR/env.sh" ]        || ./visual-bugcheck/install-browser.sh
# shellcheck disable=SC1091
source "$BROWSER_DIR/env.sh"

# start the dev server if nothing listens on :5173
SERVER_PID=""
if ! (exec 3<>/dev/tcp/127.0.0.1/5173) 2>/dev/null; then
  echo "==> starting dev server"
  npm run dev >/tmp/win11web-dev.log 2>&1 &
  SERVER_PID=$!
  for _ in $(seq 1 60); do
    (exec 3<>/dev/tcp/127.0.0.1/5173) 2>/dev/null && break
    sleep 0.5
  done
fi
trap '[ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null || true' EXIT

node visual-bugcheck/check.mjs "$@"
