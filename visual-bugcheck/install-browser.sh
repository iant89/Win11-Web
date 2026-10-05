#!/usr/bin/env bash
# shellcheck shell=bash
#
# install-browser.sh — provision a headless Chromium for the visual bug check
# without system packages and without browser-CDN access.
#
# Why not `npx playwright install`? In restricted environments (CI sandboxes,
# some corporate networks) Playwright's browser CDN is unreachable while the
# npm registry still works. The @sparticuz/chromium npm package ships the
# browser (brotli-compressed) inside its tarball, so we provision from npm:
#
#   1. npm pack @sparticuz/chromium        -> chromium.br + support tars
#   2. inflate (node zlib brotli)          -> chromium binary, al2023/fonts/swiftshader
#   3. extract bundled libs, symlink GL    -> libGLESv2.so next to the binary
#   4. assemble a font set                 -> DejaVu (system) + Noto Color Emoji (npm)
#   5. write env.sh                        -> sourced by check.sh
#
# Step 4 matters: this stripped build crashes while painting form controls
# (<input>/<textarea>/<select>) unless fontconfig can see a real font set.
#
# Usage:
#   visual-bugcheck/install-browser.sh [--force] [--dir DIR] [--help]
#
# Environment:
#   BROWSER_DIR   install location (default: /tmp/win11web-browser)

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

usage() { sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//' | sed '/^shellcheck/d'; }

# --------------------------------------------------------------------------
# args
# --------------------------------------------------------------------------
FORCE=0
BROWSER_DIR="${BROWSER_DIR:-/tmp/win11web-browser}"
while [ $# -gt 0 ]; do
  case "$1" in
    -f|--force) FORCE=1 ;;
    -d|--dir)   [ $# -ge 2 ] || die "--dir requires a value"; BROWSER_DIR="$2"; shift ;;
    -h|--help)  usage; exit 0 ;;
    *) die "unknown option: $1 (see --help)" ;;
  esac
  shift
done

command -v node >/dev/null 2>&1 || die "node is required but was not found in PATH"
command -v npm  >/dev/null 2>&1 || die "npm is required but was not found in PATH"

if [ "$FORCE" -eq 0 ] && [ -x "$BROWSER_DIR/chromium" ] && [ -f "$BROWSER_DIR/env.sh" ]; then
  ok "browser already installed at $BROWSER_DIR (use --force to reinstall)"
  exit 0
fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# --------------------------------------------------------------------------
# 1+2. fetch the pack from npm and inflate it
# --------------------------------------------------------------------------
fetch_pack() {
  log "fetching @sparticuz/chromium from the npm registry"
  ( cd "$WORK" && npm pack @sparticuz/chromium --pack-destination "$WORK" >/dev/null 2>&1 ) \
    || die "npm pack @sparticuz/chromium failed — is the npm registry reachable?"
  tar xzf "$WORK"/sparticuz-chromium-*.tgz -C "$WORK" package/bin
}

inflate_pack() {
  log "inflating brotli pack"
  ( cd "$WORK/package/bin" && node -e '
    const zlib = require("zlib"), fs = require("fs");
    for (const f of ["chromium.br", "al2023.tar.br", "fonts.tar.br", "swiftshader.tar.br"]) {
      fs.writeFileSync(f.replace(/\.br$/, ""), zlib.brotliDecompressSync(fs.readFileSync(f)));
    }' )
}

# --------------------------------------------------------------------------
# 3. bundled libraries + GL symlinks
# --------------------------------------------------------------------------
extract_components() {
  log "extracting bundled libs / fonts / swiftshader"
  cd "$WORK/package/bin"
  mkdir -p lib fonts swiftshader
  tar xf al2023.tar     -C lib
  tar xf fonts.tar      -C fonts
  tar xf swiftshader.tar -C swiftshader
}

# --------------------------------------------------------------------------
# 4. font set (DejaVu + Noto Color Emoji)
# --------------------------------------------------------------------------
build_font_set() {
  log "assembling font set (DejaVu + Noto Color Emoji)"
  local sysfonts="$BROWSER_DIR/sysfonts"
  mkdir -p "$sysfonts" "$BROWSER_DIR/fontcache" "$BROWSER_DIR/fc"

  if [ -d /usr/share/fonts/truetype/dejavu ]; then
    cp /usr/share/fonts/truetype/dejavu/*.ttf "$sysfonts/" 2>/dev/null || true
  else
    warn "system DejaVu fonts not found; text will fall back to the bundled Open Sans"
  fi

  if ! ls "$sysfonts" 2>/dev/null | grep -qi emoji; then
    ( cd "$WORK" && npm pack noto-color-emoji --pack-destination "$WORK" >/dev/null 2>&1 ) \
      || die "npm pack noto-color-emoji failed — is the npm registry reachable?"
    tar xzf "$WORK"/noto-color-emoji-*.tgz -C "$WORK" package/ttf/NotoColorEmoji.ttf
    cp "$WORK/package/ttf/NotoColorEmoji.ttf" "$sysfonts/"
  fi

  cat > "$BROWSER_DIR/fc/fonts.conf" <<EOF
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>$sysfonts</dir>
  <cachedir>$BROWSER_DIR/fontcache</cachedir>
  <config></config>
</fontconfig>
EOF
}

# --------------------------------------------------------------------------
# 5. install + env.sh + smoke test
# --------------------------------------------------------------------------
install_browser() {
  log "installing to $BROWSER_DIR"
  cd "$WORK/package/bin"
  mkdir -p "$BROWSER_DIR/lib" "$BROWSER_DIR/swiftshader"
  install -m 0755 chromium "$BROWSER_DIR/chromium"
  # the al2023 tar nests a lib/ directory; flatten it next to the binary
  if [ -d lib/lib ]; then cp -r lib/lib/. "$BROWSER_DIR/lib/"; else cp -r lib/. "$BROWSER_DIR/lib/"; fi
  cp -r swiftshader/. "$BROWSER_DIR/swiftshader/"
  # the build resolves its GLES/Vulkan libraries relative to the binary
  ln -sf swiftshader/libEGL.so   "$BROWSER_DIR/libEGL.so"
  ln -sf swiftshader/libGLESv2.so "$BROWSER_DIR/libGLESv2.so"

  cat > "$BROWSER_DIR/env.sh" <<EOF
# generated by visual-bugcheck/install-browser.sh — do not edit
export CHROME_BIN="$BROWSER_DIR/chromium"
export FONTCONFIG_PATH="$BROWSER_DIR/fc"
export LD_LIBRARY_PATH="$BROWSER_DIR/lib"
EOF
}

smoke_test() {
  log "smoke-testing the binary"
  # shellcheck disable=SC1091
  source "$BROWSER_DIR/env.sh"
  local version
  version="$("$CHROME_BIN" --version 2>/dev/null)" || die "chromium failed to start — re-run with --force"
  ok "$version"
}

fetch_pack
inflate_pack
extract_components
build_font_set
install_browser
smoke_test
ok "browser ready: $BROWSER_DIR/chromium (env: $BROWSER_DIR/env.sh)"
