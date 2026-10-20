#!/usr/bin/env bash
set -euo pipefail
cd /workspace/Roadlords
npm ci --cache /tmp/roadlords-npm-cache --no-audit --no-fund
npm run build
command -v chromium >/dev/null
