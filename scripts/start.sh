#!/usr/bin/env bash
set -euo pipefail
cd /workspace/Roadlords
if node scripts/check-ready.cjs; then
  echo 'Roadlords is already serving on port 8000.'
  exit 0
fi
if [ ! -f dist/index.html ]; then
  echo 'Run bash scripts/install.sh first.' >&2
  exit 1
fi
nohup npm run preview >/tmp/roadlords-preview.log 2>&1 &
printf '%s\n' "$!" >/tmp/roadlords-preview.pid
for attempt in {1..30}; do
  if node scripts/check-ready.cjs; then
    echo 'Roadlords production HTTP readiness check passed.'
    exit 0
  fi
  sleep .2
done
cat /tmp/roadlords-preview.log >&2
exit 1
