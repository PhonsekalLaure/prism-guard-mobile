# Prism Guard - Start Services Script
# This script starts the API, Web app, and Mobile app development servers in separate windows.

# Determine the script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Resolve absolute paths based on relative locations
$ApiPath = [System.IO.Path]::GetFullPath((Join-Path $ScriptDir "..\prism-guard-api"))
$WebPath = [System.IO.Path]::GetFullPath((Join-Path $ScriptDir "..\prism-guard-web"))
$MobilePath = [System.IO.Path]::GetFullPath((Join-Path $ScriptDir "."))

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Prism Guard Development Environment  " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Starting services in separate windows..." -ForegroundColor Yellow

# 1. Start API Server
Write-Host "-> Launching API Server (npm run dev)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$host.UI.RawUI.WindowTitle = 'Prism Guard [API]'; cd '$ApiPath'; npm run dev"

# 2. Start Web Client
Write-Host "-> Launching Web Client (npm run dev)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$host.UI.RawUI.WindowTitle = 'Prism Guard [WEB]'; cd '$WebPath'; npm run dev"

# 3. Start Mobile Expo Bundler
Write-Host "-> Launching Mobile Expo (npx expo start --dev-client)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$host.UI.RawUI.WindowTitle = 'Prism Guard [MOBILE]'; cd '$MobilePath'; npx expo start --dev-client"

Write-Host "`nAll services have been started!" -ForegroundColor Cyan
Write-Host "You can interact with Expo inside the Mobile window (press 'a' for Android, 'r' to reload, etc.)." -ForegroundColor DarkYellow
