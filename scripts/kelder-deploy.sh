#!/usr/bin/env bash
set -euo pipefail

STACK_DIR="${STACK_DIR:-/opt/stacks/smarthome}"

cd "$STACK_DIR"
docker compose pull smarthome
docker compose up -d smarthome
docker compose ps smarthome
