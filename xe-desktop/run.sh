#!/usr/bin/env bash
# Launcher for Prime Agent XE Desktop. Resolves its own directory so it works
# from a desktop shortcut / application menu.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
if [ ! -d node_modules ]; then
  npm install
fi
npm run start
