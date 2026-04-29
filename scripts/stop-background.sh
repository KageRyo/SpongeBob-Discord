#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="$ROOT_DIR/.runtime/spongebob-discord.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "SpongeBob-Discord is not running."
  exit 0
fi

BOT_PID="$(cat "$PID_FILE")"

if kill -0 "$BOT_PID" 2>/dev/null; then
  kill "$BOT_PID"
  echo "Stopped SpongeBob-Discord process $BOT_PID."
else
  echo "SpongeBob-Discord process $BOT_PID was not running."
fi

rm -f "$PID_FILE"
