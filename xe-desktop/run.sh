#!/usr/bin/env bash
# Launch Prime Agent XE Desktop — fast, idempotent, error-tolerant.
# Installs deps once, builds the renderer once, then launches Electron.
# Any failure is logged to ~/.cache/prime-agent-xe/launch.log and surfaced
# via a desktop notification (notify-send) so "nothing happens" is diagnosable.
set -uo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

LOG_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/prime-agent-xe"
LOG="$LOG_DIR/launch.log"
mkdir -p "$LOG_DIR"
exec 2> >(tee -a "$LOG" >&2)

log() { echo "[$(date +%H:%M:%S)] $*" >> "$LOG"; }

notify() {
  log "NOTIFY: $*"
  if command -v notify-send >/dev/null 2>&1; then
    notify-send -u critical "Prime Agent XE" "$*"
  fi
}

# GUI sessions (Ubuntu drawer / desktop) often don't source .bashrc, so a
# Node installed via nvm may be off-PATH. Make sure we can find node/npm.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null 2>&1
if ! command -v node >/dev/null 2>&1; then
  for nd in "$NVM_DIR/versions/node"/*/bin /usr/local/bin /opt/node/bin; do
    [ -d "$nd" ] && PATH="$nd:$PATH"
  done
fi
export PATH

# Disable Electron's SUID sandbox (avoids the chrome-sandbox
# ownership/4755 abort that makes the launcher silently do nothing).
export ELECTRON_DISABLE_SANDBOX=1

command -v node >/dev/null 2>&1 || { notify "Node.js is required (https://nodejs.org)"; exit 1; }
command -v npm  >/dev/null 2>&1 || { notify "npm is required"; exit 1; }
log "node: $(node -v)  npm: $(npm -v)"

# Install deps if missing (or if Electron's binary is not actually present).
if [ ! -d node_modules ] || [ ! -x node_modules/.bin/electron ] \
   || ! node node_modules/electron/install.js >/dev/null 2>&1; then
  log "running npm install (deps / electron binary)…"
  npm install --no-audit --no-fund --loglevel=error || { notify "npm install failed — see $LOG"; exit 1; }
fi

# Build the renderer once (skip if already built).
if [ ! -d dist ] || [ ! -f dist/index.html ]; then
  log "building renderer…"
  npm run build || { notify "renderer build failed — see $LOG"; exit 1; }
fi

log "launching Electron…"
# Fails loudly if Electron can't start; notification + log capture the reason.
exec npm start
