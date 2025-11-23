# Script để chạy test validation cho booking flow
# Sử dụng: .\RUN_VALIDATION_TEST.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BOOKING VALIDATION TEST RUNNER" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "[1/3] Checking if backend is running..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend is running on port 8000" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend is NOT running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start backend first:" -ForegroundColor Yellow
    Write-Host "  .\START_BACKEND.ps1" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# Check if Python is installed
Write-Host ""
Write-Host "[2/3] Checking Python installation..." -ForegroundColor Blue
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if requests library is installed
Write-Host ""
Write-Host "[3/3] Checking required libraries..." -ForegroundColor Blue
try {
    python -c "import requests" 2>&1 | Out-Null
    Write-Host "✅ requests library is installed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Installing requests library..." -ForegroundColor Yellow
    pip install requests
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RUNNING VALIDATION TESTS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Run the test
python test_booking_validation.py

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST COMPLETED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 See TEST_VALIDATION.md for detailed documentation" -ForegroundColor Cyan
Write-Host ""
