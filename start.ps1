# start.ps1
# Script to start all services for the UPI Support Agent

Write-Host "Starting AI UPI Support Agent..." -ForegroundColor Green

# Load variables from .env file into the environment
$envFilePath = ".\backend\.env"
if (Test-Path $envFilePath) {
    Write-Host "Loading API Keys from .env..." -ForegroundColor DarkGray
    foreach($line in Get-Content $envFilePath) {
        if ($line -match '^\s*([^#]+?)\s*=\s*(.+?)\s*$') {
            $name = $matches[1]
            $value = $matches[2]
            Set-Item -Path Env:\$name -Value $value
        }
    }
}

# Add Node.js and Java to Path for this session
$env:Path += ";C:\Program Files\nodejs;C:\Program Files\Eclipse Adoptium\jdk-25.0.3.9-hotspot\bin"

# 1. Start FastAPI Backend
Write-Host "Starting FastAPI Backend..." -ForegroundColor Cyan
Start-Process -NoNewWindow -FilePath "backend\venv\Scripts\uvicorn.exe" -ArgumentList "main:app --reload" -WorkingDirectory ".\backend"

# 2. Start React Frontend
Write-Host "Starting React Frontend..." -ForegroundColor Cyan
Start-Process -NoNewWindow -FilePath "C:\Program Files\nodejs\npm.cmd" -ArgumentList "run dev" -WorkingDirectory ".\frontend"

Write-Host "All services starting up! Please wait a moment..." -ForegroundColor Green
Write-Host "Backend API: http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "Frontend UI: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Agentspan Server: http://localhost:6767" -ForegroundColor Yellow
