# Run booking flow step-by-step for session nl_test_001
$session = 'nl_test_001'
try { Invoke-RestMethod -Uri "http://localhost:8000/chat/session/$session" -Method Delete -ErrorAction SilentlyContinue } catch { }
$steps = @(
    'bắt đầu',
    'minh2@gmail.com',
    'Đoàn Nhật Minh',
    'ngày mai lúc 2 giờ chiều',
    'không',
    'không',
    'có'
)

foreach ($q in $steps) {
    Write-Host "=== Query: $q ===" -ForegroundColor Cyan
    $body = @{ session_id = $session; query = $q } | ConvertTo-Json
    try {
        $r = Invoke-RestMethod -Uri 'http://localhost:8000/chat' -Method Post -Body $body -ContentType 'application/json' -ErrorAction Stop
        Write-Host "Answer:`n$($r.answer)" -ForegroundColor Yellow
        if ($r.metadata) {
            Write-Host "Metadata:" -ForegroundColor Green
            $r.metadata | ConvertTo-Json -Depth 5 | Write-Host
        }
    } catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) { $_.Exception.Response.Content | Out-String | Write-Host }
        break
    }
    Start-Sleep -Milliseconds 600
}
