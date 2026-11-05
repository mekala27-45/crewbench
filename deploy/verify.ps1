$ErrorActionPreference = 'Stop'
npm ci
if ($LASTEXITCODE) { throw 'DEPENDENCY_INSTALL_FAILED' }
npm test
if ($LASTEXITCODE) { throw 'CONTRACT_TESTS_FAILED' }
python -m unittest discover -s tests -p 'test_*.py'
if ($LASTEXITCODE) { throw 'GRADER_TESTS_FAILED' }
node scripts/check-palette.mjs
if ($LASTEXITCODE) { throw 'PALETTE_FAILED' }
if (Test-Path evaluation/freeze.json) { node scripts/freeze.ts --verify; if ($LASTEXITCODE) { throw 'FREEZE_FAILED' } }
