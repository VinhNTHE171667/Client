# start_recommendation.ps1
# Usage: powershell -ExecutionPolicy Bypass -File .\start_recommendation.ps1
$ErrorActionPreference = 'Stop'

$proj = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $proj
Write-Host "Project folder: $proj"

# Create venv if missing
if (-not (Test-Path "$proj\.venv")) {
    Write-Host "Creating virtual environment..."
    python -m venv .venv
}

$activate = Join-Path $proj ".venv\Scripts\Activate.ps1"

# Install dependencies (run in visible window so user sees progress)
Write-Host "Installing dependencies (this may take a few minutes)..."
Start-Process -FilePath powershell -ArgumentList "-NoExit","-Command","& '$activate'; pip install --upgrade pip; pip install -r `"$proj\requirements.txt`"" -WindowStyle Normal

# Start backend in new PowerShell window
Write-Host "Starting backend..."
Start-Process -FilePath powershell -ArgumentList "-NoExit","-Command","& '$activate'; Set-Location `"$proj\backend`"; python app.py" -WindowStyle Normal

# Start Streamlit dashboard in new PowerShell window
Write-Host "Starting Streamlit dashboard..."
Start-Process -FilePath powershell -ArgumentList "-NoExit","-Command","& '$activate'; Set-Location `"$proj\frontend`"; streamlit run dashboard.py" -WindowStyle Normal

# Give services a short moment then open browser
Start-Sleep -Seconds 4
Start-Process "http://localhost:8501"
Write-Host "Done. Backend -> http://127.0.0.1:8000 , Dashboard -> http://localhost:8501"
