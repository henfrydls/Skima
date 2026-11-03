#!/usr/bin/env bash
# Real-build smoke for external links in the desktop app (Linux).
#
# Builds the app in debug with a probe that clicks a target="_blank" link once the
# window is up (client/src/smoke/linkSmoke.js), runs it under Xvfb with a fake
# xdg-open on PATH, and passes only if the system browser was asked to open the URL.
# Unit tests mock the plugins; this runs their real injected scripts in WebKitGTK.
#
# Needs: Xvfb (xvfb-run), the Tauri Linux build dependencies, node, and the server's
# npm dependencies with the Prisma client generated. Run from the repo root.
set -euo pipefail

ROOT="$(pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
TRIPLE="$(rustc -vV | sed -n 's/^host: //p')"
SIDECAR="src-tauri/binaries/skima-server-$TRIPLE"

# The real sidecar is a Bun binary built elsewhere; the node server is the same API.
mkdir -p src-tauri/binaries
if [ ! -e "$SIDECAR" ]; then
  printf '#!/bin/sh\ncd "%s/server" && exec node src/index.js "$@"\n' "$ROOT" > "$SIDECAR"
  chmod +x "$SIDECAR"
  CREATED_SIDECAR=1
fi

mkdir -p "$WORK/bin" "$WORK/home"
printf '#!/bin/sh\necho "$*" >> "%s/opened.log"\n' "$WORK" > "$WORK/bin/xdg-open"
chmod +x "$WORK/bin/xdg-open"

VITE_LINK_SMOKE=1 npx --yes @tauri-apps/cli@2.10.1 build --debug --no-bundle

set +e
HOME="$WORK/home" XDG_DATA_HOME="$WORK/home/.local/share" XDG_CONFIG_HOME="$WORK/home/.config" \
  PATH="$WORK/bin:$PATH" SKIMA_DISABLE_CHECKIN=1 \
  timeout 40 xvfb-run -a src-tauri/target/debug/skima > "$WORK/app.log" 2>&1
set -e
[ "${CREATED_SIDECAR:-}" = 1 ] && rm -f "$SIDECAR"

echo "--- app log"; cat "$WORK/app.log"
echo "--- opened"; cat "$WORK/opened.log" 2>/dev/null || true
if grep -qx 'https://github.com/henfrydls/Skima' "$WORK/opened.log" 2>/dev/null; then
  echo "OK: the link opened in the system browser"
else
  echo "::error::clicking an external link did not open the system browser"
  exit 1
fi
