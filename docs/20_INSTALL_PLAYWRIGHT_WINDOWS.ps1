# Komukuna Virtual v2 — Run AFTER Codex creates a package.json in the NEW target repo.
# Never run inside mokabooth or BOOKING source repositories.
param([string]$ProjectRoot = 'C:\Users\user\Music\komukuna-virtual')
$ErrorActionPreference = 'Stop'
$resolved = [System.IO.Path]::GetFullPath($ProjectRoot)
$blocked = @('C:\Users\user\Music\mokabooth', 'C:\Users\user\Music\BOOKING')
foreach ($src in $blocked) {
  $srcPath = [System.IO.Path]::GetFullPath($src).TrimEnd('\')
  if ($resolved.TrimEnd('\').Equals($srcPath,[System.StringComparison]::OrdinalIgnoreCase) -or $resolved.StartsWith($srcPath+'\',[System.StringComparison]::OrdinalIgnoreCase)) { throw "Unsafe target: $resolved points into source repo $srcPath" }
}
if (!(Test-Path (Join-Path $resolved 'package.json'))) { throw "Missing package.json at $resolved. Scaffold app first." }
if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) { throw 'pnpm missing. Install Node.js + Corepack/pnpm before continuing.' }
Push-Location $resolved
try {
  Write-Host 'Installing Playwright test as DEV dependency...' -ForegroundColor Cyan
  if (Test-Path '.\pnpm-workspace.yaml') {
    & pnpm add -Dw '@playwright/test'
  } else {
    & pnpm add -D '@playwright/test'
  }
  if ($LASTEXITCODE -ne 0) { throw "Playwright package install failed (exit $LASTEXITCODE)." }
  Write-Host 'Installing Chromium, Firefox, WebKit browsers...' -ForegroundColor Cyan
  & pnpm exec playwright install chromium firefox webkit
  if ($LASTEXITCODE -ne 0) { throw "Playwright browser install failed (exit $LASTEXITCODE)." }
  & pnpm exec playwright --version
  if ($LASTEXITCODE -ne 0) { throw 'Playwright version verification failed.' }
  Write-Host 'Playwright installed. Next: create/adapt playwright.config.ts and tests/e2e.' -ForegroundColor Green
} finally {
  Pop-Location
}
