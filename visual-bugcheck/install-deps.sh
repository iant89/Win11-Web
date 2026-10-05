#!/usr/bin/env bash
# Install the dependencies needed to run and visually test the app:
#   - project deps from package.json (vite, for the dev server)
#   - playwright-core (used by check.mjs to drive the headless browser;
#     installed with --no-save so package.json/lockfile stay untouched)
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> npm install (project deps)"
npm install

echo "==> npm install --no-save playwright-core (test driver)"
npm install --no-save playwright-core

echo "==> deps OK"
