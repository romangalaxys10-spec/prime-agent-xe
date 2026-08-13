#!/usr/bin/env bash
# Launch Prime Agent XE Desktop — fast, idempotent, error-tolerant.
# Installs deps once, builds the renderer once, then launches Electron.
set -uo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# GUI sessions (Ubuntu drawer / desktop) often don't source .bashrc, so Node
# installed via nvm may be off-PATH. Make sure we can find node/npm/electron.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null 2>&1
if ! command -v node >/dev/null 2>&1; then
  for nd in "$NVM_DIR/versions/node"/*/bin /usr/local/bin /opt/node/bin; do
    [ -d "$nd" ] && PATH="$nd:$PATH"
  done
fi
export PATH

err() { echo "Prime Agent XE failed to start: $*" >&2; exit 1; }

command -v node >/dev/null 2>&1 || err "Node.js is required (https://nodejs.org)"
command -v npm  >/dev/null 2>&1 || err "npm is required"

# Install once (optional deps like node-pty are skipped if they can't build).
if [ ! -d node_modules ]; then
  npm install --no-audit --no-fund --loglevel=error || err "npm install failed"
fi

# Build the renderer once (skip if already built).
if [ ! -d dist ] || [ ! -f dist/index.html ]; then
  npm run build || err "renderer build failed"
fi

# Launch Electron (no rebuild). Any launch error is surfaced, not swallowed.
exec npm start
