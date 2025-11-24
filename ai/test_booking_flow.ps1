# Test booking flow step by step
$baseUrl = "http://localhost:8000"

# Clear session
Write-Host "Clearing session nl_test_001..."
Invoke-RestMethod -Uri "$baseUrl/chat/session/nl_test_001" -Method Delete

# Step 1: Trigger booking
Write-Host "Step 1: Trigger booking with 'tôi muốn đặt lịch'"
$response1 = Invoke-RestMethod -Uri "$baseUrl/chat" -Method Post -Body (@{session_id="nl_test_001"; query="tôi muốn đặt lịch"} | ConvertTo-Json) -ContentType "application/json"
Write-Host "Response 1:" $response1.answer

# Step 2: Start booking
Write-Host "Step 2: Start with 'bắt đầu'"
$response2 = Invoke-RestMethod -Uri "$baseUrl/chat" -Method Post -Body (@{session_id="nl_test_001"; query="bắt đầu"} | ConvertTo-Json) -ContentType "application/json"
Write-Host "Response 2:" $response2.answer

# Step 3: Provide email
Write-Host "Step 3: Provide email 'minh2@gmail.com'"
$response3 = Invoke-RestMethod -Uri "$baseUrl/chat" -Method Post -Body (@{session_id="nl_test_001"; query="minh2@gmail.com"} | ConvertTo-Json) -ContentType "application/json"
Write-Host "Response 3:" $response3.answer

# Step 4: Select doctor
Write-Host "Step 4: Select doctor 'Đoàn Nhật Minh'"
$response4 = Invoke-RestMethod -Uri "$baseUrl/chat" -Method Post -Body (@{session_id="nl_test_001"; query="Đoàn Nhật Minh"} | ConvertTo-Json) -ContentType "application/json"
Write-Host "Response 4:" $response4.answer

# Step 5: Provide datetime
Write-Host "Step 5: Provide datetime 'hôm nay lúc 12 giờ trưa'"
$response5 = Invoke-RestMethod -Uri "$baseUrl/chat" -Method Post -Body (@{session_id="nl_test_001"; query="hôm nay lúc 12 giờ trưa"} | ConvertTo-Json) -ContentType "application/json"
Write-Host "Response 5:" $response5.answer

# Step 6: Note (none)
Write-Host "Step 6: Note 'không'"
$response6 = Invoke-RestMethod -Uri "$baseUrl/chat" -Method Post -Body (@{session_id="nl_test_001"; query="không"} | ConvertTo-Json) -ContentType "application/json"
Write-Host "Response 6:" $response6.answer

# Step 7: Service 'Trị liệu Cổ-Vai-Gáy (Office Syndrome Relief)'
Write-Host "Step 7: Service 'Trị liệu Cổ-Vai-Gáy (Office Syndrome Relief)'"
$response7 = Invoke-RestMethod -Uri "$baseUrl/chat" -Method Post -Body (@{session_id="nl_test_001"; query="Trị liệu Cổ-Vai-Gáy (Office Syndrome Relief)"} | ConvertTo-Json) -ContentType "application/json"
Write-Host "Response 7:" $response7.answer

# Step 8: Voucher (none)
Write-Host "Step 8: Voucher 'không'"
$response8 = Invoke-RestMethod -Uri "$baseUrl/chat" -Method Post -Body (@{session_id="nl_test_001"; query="không"} | ConvertTo-Json) -ContentType "application/json"
Write-Host "Response 8:" $response8.answer

# Step 9: Confirm
Write-Host "Step 9: Confirm 'có'"
$response9 = Invoke-RestMethod -Uri "$baseUrl/chat" -Method Post -Body (@{session_id="nl_test_001"; query="có"} | ConvertTo-Json) -ContentType "application/json"
Write-Host "Response 9:" $response9.answer