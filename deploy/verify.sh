#!/usr/bin/env bash
set -euo pipefail
npm ci
npm test
python3 -m unittest discover -s tests -p 'test_*.py'
node scripts/check-palette.mjs
if [ -f evaluation/freeze.json ]; then node scripts/freeze.ts --verify; fi
