$root = "d:\projects\Silentlink"

Write-Host "--- Silentlink Unified Runner ---" -ForegroundColor Yellow

# 1. Build Frontend
Write-Host "[1/2] Building Frontend Assets..." -ForegroundColor Cyan
Push-Location "$root\frontend"
npm run build
Pop-Location

# 2. Start Backend (Serving both API and Frontend)
Write-Host "[2/2] Starting Integrated Backend on http://localhost:8000" -ForegroundColor Green
Set-Location "$root\backend"
& .\venv\Scripts\activate.ps1
uvicorn main:app --reload --port 8000
