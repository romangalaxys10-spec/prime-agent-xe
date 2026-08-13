#!/usr/bin/env bash
# Prime Agent XE - Investment Consultant Launcher
# Launches the investment consultant with the Buffett-style system prompt

# Fix: ensure NODE_OPTIONS doesn't have disallowed flags
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="$HOME/.config/prime-agent/templates/investment-consultant.md"

exec "$SCRIPT_DIR/prime-agent.sh" \
  --system-prompt "$(cat "$TEMPLATE")" \
  --no-context-files \
  "$@"
