#!/usr/bin/env bash
# Build the macOS .app + .dmg with a modern Asset Catalog icon.
#
# macOS 26 (Tahoe) wraps any app whose bundle lacks a modern Asset Catalog
# in a gray "squircle jail" container. Shipping Assets.car keyed by
# CFBundleIconName suppresses that container.
#
# Flow:
#   1. xcrun actool compiles src-tauri/icons/Skima.icon to
#      src-tauri/resources/Assets.car + a regenerated icon.icns.
#   2. tauri build picks up Assets.car via bundle.resources and merges
#      src-tauri/Info.plist (CFBundleIconName=Skima) into the final
#      Info.plist before signing. No post-build patching needed.
#
# Prerequisites:
#   - Xcode 26+ (full install) so `xcrun actool` works.
#   - src-tauri/icons/Skima.icon  -- authored with Icon Composer.
#   - src-tauri/Info.plist        -- supplies CFBundleIconName=Skima.
#   - npm install + cargo + sidecar pkg:build already done.
#
# Usage: ./scripts/build-macos.sh [arch-target]
#   arch-target defaults to native arch. Pass "universal-apple-darwin"
#   for a fat binary.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

TARGET_TRIPLE="${1:-}"
ICON_SOURCE="src-tauri/icons/Skima.icon"
ICON_NAME="Skima"

if [ ! -d "$ICON_SOURCE" ]; then
  echo "ERROR: $ICON_SOURCE not found. Author it with Icon Composer first." >&2
  exit 1
fi

# actool throws an NSException when the .icon lives anywhere under
# ~/Library/CloudStorage/OneDrive-* (and probably other cloud-mirrored
# locations). Always compile from a /tmp copy.
echo "==> Compiling Asset Catalog (Assets.car + icon.icns) via /tmp"
ICON_TMP="$(mktemp -d)/Skima.icon"
BUILD_TMP="$(mktemp -d)"
cp -R "$ICON_SOURCE" "$ICON_TMP"
xcrun actool "$ICON_TMP" \
  --compile "$BUILD_TMP" \
  --platform macosx --target-device mac \
  --minimum-deployment-target 26.0 \
  --app-icon "$ICON_NAME" --include-all-app-icons \
  --output-partial-info-plist "$BUILD_TMP/partial.plist" >/dev/null

if [ ! -f "$BUILD_TMP/Assets.car" ]; then
  echo "ERROR: actool did not produce Assets.car" >&2
  exit 1
fi

mkdir -p src-tauri/resources
cp "$BUILD_TMP/Assets.car" src-tauri/resources/Assets.car
cp "$BUILD_TMP/Skima.icns" src-tauri/icons/icon.icns
rm -rf "$ICON_TMP" "$BUILD_TMP"

echo "==> tauri build"
# Tauri exits non-zero when TAURI_SIGNING_PRIVATE_KEY is missing for the
# updater artifact, even though the .app + .dmg bundles are produced
# successfully. Tolerate that and verify the .app below.
if [ -n "$TARGET_TRIPLE" ]; then
  tauri build --bundles app,dmg --target "$TARGET_TRIPLE" || true
  TARGET_DIR="src-tauri/target/$TARGET_TRIPLE/release"
else
  tauri build --bundles app,dmg || true
  TARGET_DIR="src-tauri/target/release"
fi

APP_PATH="$TARGET_DIR/bundle/macos/Skima.app"
DMG_DIR="$TARGET_DIR/bundle/dmg"

if [ ! -d "$APP_PATH" ]; then
  echo "ERROR: $APP_PATH not produced by tauri build" >&2
  exit 1
fi

if [ ! -f "$APP_PATH/Contents/Resources/Assets.car" ]; then
  echo "ERROR: Tauri did not copy Assets.car into Contents/Resources/." >&2
  echo "       Verify src-tauri/tauri.conf.json bundle.resources contains" >&2
  echo "       \"resources/*\"." >&2
  exit 1
fi

if ! /usr/bin/plutil -extract CFBundleIconName raw -o - "$APP_PATH/Contents/Info.plist" 2>/dev/null | grep -q "^$ICON_NAME\$"; then
  echo "ERROR: CFBundleIconName missing in Info.plist." >&2
  echo "       Verify src-tauri/Info.plist supplies CFBundleIconName=$ICON_NAME." >&2
  exit 1
fi

DMG_PATH="$(ls "$DMG_DIR"/*.dmg 2>/dev/null | head -1 || true)"

echo ""
echo "Done."
echo "  .app: $APP_PATH"
[ -n "$DMG_PATH" ] && echo "  .dmg: $DMG_PATH"
echo ""
echo "If Finder/Dock still show the old icon, clear the icon cache:"
echo "  sudo rm -rf /Library/Caches/com.apple.iconservices.store"
echo "  killall Dock Finder"
