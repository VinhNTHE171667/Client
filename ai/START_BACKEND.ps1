# Script khởi động backend
Write-Host "=== KHỞI ĐỘNG BACKEND ===" -ForegroundColor Cyan
Set-Location "D:\Desktop\Đồ án test\ai\do_an_fa25"

Write-Host "`nĐang khởi động FastAPI backend..." -ForegroundColor Yellow
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Hoặc nếu muốn dùng venv:
# .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
