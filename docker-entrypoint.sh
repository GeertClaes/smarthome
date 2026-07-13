#!/bin/sh
set -e

# Host bind mounts often arrive as root; ensure the app user can seed and write YAML/uploads.
chown -R nextjs:nodejs /app/runtime-data /app/public/uploads 2>/dev/null || true

exec su-exec nextjs "$@"
