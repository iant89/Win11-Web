#!/usr/bin/env bash
# shellcheck shell=bash
#
# install-deps.sh — install the dependencies required to run and visually
# test Win11-Web.
#
#   * project dependencies from package.json (vite — dev server / build)
#   * playwright-core, the CDP driver used by check.mjs (installed with
#     --no-save so package.json / package-lock.json remain untouched)
#
# Usage:
#   visual-bugcheck/install-deps.sh [--help]
#
# Environment:
#   NPM_FLAGS   extra flags forwarded to every npm invocation (default: none)

set -euo pipefail

# --------------------------------------------------------------------------
# logging
# --------------------------------------------------------------------------
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  readonly _B=$'\033[1m' _G=$'\033[1;32m' _Y=$'\033[1;33m' _R=$'\033[1;31m' _0=$'\033[0m'
else
  readonly _B= _G= _Y= _R= _0=
fi
log()  { printf '%s==> %s%s\n' "$_B" "$_0" "$*"; }
ok()   { printf '%s ok %s%s\n' "$_G" "$_0" "$*"; }
warn() { printf '%s warn %s%s\n' "$_Y" "$_0" "$*" >&2; }
die()  { printf '%s error %s%s\n' "$_R" "$_0" "$*" >&2; exit 1; }

usage() { sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//' | sed '/^shellcheck/d'; }

# --------------------------------------------------------------------------
# args
# --------------------------------------------------------------------------
for arg in "$@"; do
  case "$arg" in
    -h|--help) usage; exit 0 ;;
    *) die "unknown option: $arg (see --help)" ;;
  esac
done

cd "$(dirname "$0")/.."

# --------------------------------------------------------------------------
# preflight
# --------------------------------------------------------------------------
command -v node >/dev/null 2>&1 || die "node is required but was not found in PATH"
command -v npm  >/dev/null 2>&1 || die "npm is required but was not found in PATH"

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 18 ] || die "node >= 18 is required (found $(node --version))"

# --------------------------------------------------------------------------
# install
# --------------------------------------------------------------------------
# shellcheck disable=SC2086
log "installing project dependencies (npm install)"
npm install $NPM_FLAGS

# shellcheck disable=SC2086
log "installing playwright-core (test driver, not saved to package.json)"
npm install --no-save $NPM_FLAGS playwright-core

ok "dependencies ready"
