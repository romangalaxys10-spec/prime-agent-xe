#!/usr/bin/env bash
# Install Prime Agent XE as an Ubuntu/GNOME app shortcut (apps drawer + Desktop).
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
SRC="$DIR/prime-agent-xe.desktop"
APPS="$HOME/.local/share/applications"
mkdir -p "$APPS"

# Substitute the absolute path, then install.
sed "s|__XE_DESKTOP_DIR__|$DIR|g" "$SRC" > "$APPS/prime-agent-xe.desktop"
chmod +x "$APPS/prime-agent-xe.desktop"

update-desktop-database "$APPS" 2>/dev/null || true

# Desktop shortcut (if a Desktop dir exists), marked trusted so it's launchable.
if [ -d "$HOME/Desktop" ]; then
  cp "$APPS/prime-agent-xe.desktop" "$HOME/Desktop/prime-agent-xe.desktop"
  chmod +x "$HOME/Desktop/prime-agent-xe.desktop"
  gio set "$HOME/Desktop/prime-agent-xe.desktop" metadata::trusted true 2>/dev/null || true
fi

echo "Installed Prime Agent XE to: $APPS"
echo "Apps drawer: search 'Prime Agent XE' (you may need to log out/in or run: gtk-launch prime-agent-xe)"
