#!/usr/bin/env bash
# shellcheck shell=bash
#
# check.sh — run the Win11-Web visual bug check.
#
# Ensures prerequisites (dependencies, headless browser, dev server) are in
# place, then runs check.mjs, which captures a screenshot tour of every major
# UI surface and asserts the known visual bugs (see REPORT.md). Any option
# not listed below is forwarded to check.mjs (see check.mjs --help).
#
# Usage:
#   visual-bugcheck/check.sh [--help] [check.mjs options...]
#
# Environment:
#   BROWSER_DIR   browser install location (default: /tmp/win11web-browser)
#   BASE_URL      app URL to test          (default: http://localhost:5173/)
#   DEV_PORT      dev server port          (default: 5173)

set -euo pipefail

# --------------------------------------------------------------------------
# logging
# --------------------------------------------------------------------------
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  readonly _B=$'\033[1m' _G=$'\033[1;32m' _R=$'\033[1;31m' _0=$'\033[0m'
else
  readonly _B= _G= _R= _0=
fi
log() { printf '%s==> %s%s\n' "$_B" "$_0" "$*"; }
die() { printf '%s error %s%s\n' "$_R" "$_0" "$*" >&2; exit 1; }

usage() { sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//' | sed '/^shellcheck/d'; }

[ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ] && { usage; exit 0; }

cd "$(dirname "$0")/.."

BROWSER_DIR="${BROWSER_DIR:-/tmp/win11web-browser}"
DEV_PORT="${DEV_PORT:-5173}"

port_open() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null && exec 3>&- 3<&-; }

# --------------------------------------------------------------------------
# prerequisites
# --------------------------------------------------------------------------
[ -d node_modules/playwright-core ] || ./visual-bugcheck/install-deps.sh
[ -f "$BROWSER_DIR/env.sh" ]        || ./visual-bugcheck/install-browser.sh
# shellcheck disable=SC1091
source "$BROWSER_DIR/env.sh"

# --------------------------------------------------------------------------
# dev server (only started when nothing is listening; cleaned up on exit)
# --------------------------------------------------------------------------
SERVER_PID=""
cleanup() { [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null || true; }
trap cleanup EXIT

if ! port_open "$DEV_PORT"; then
  log "starting dev server on :$DEV_PORT"
  npm run dev >/tmp/win11web-dev.log 2>&1 &
  SERVER_PID=$!
  for _ in $(seq 1 60); do
    port_open "$DEV_PORT" && break
    kill -0 "$SERVER_PID" 2>/dev/null || die "dev server died during startup (see /tmp/win11web-dev.log)"
    sleep 0.5
  done
  port_open "$DEV_PORT" || die "dev server did not open :$DEV_PORT within 30s (see /tmp/win11web-dev.log)"
fi

# --------------------------------------------------------------------------
# run the check
# --------------------------------------------------------------------------
exec node visual-bugcheck/check.mjs "$@"
