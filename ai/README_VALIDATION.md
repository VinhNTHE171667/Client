# 🚀 Hướng dẫn Test Validation - Luồng Đặt Lịch

## 📋 Tổng quan các cải tiến

### ✅ Đã thực hiện:

1. **LLM-based Intent Validation**
   - Mỗi câu trả lời được kiểm tra xem có liên quan đến câu hỏi không
   - Sử dụng LLM để phân tích ngữ cảnh
   - Phát hiện off-topic và yêu cầu trả lời lại

2. **Identity Verification** 🔐 **MỚI**
   - Phone/Email phải khớp với tài khoản đã đăng nhập
   - Chỉ cho phép đặt lịch cho chính mình
   - Hiển thị hint SĐT/email đã đăng ký (masked)
   - Bảo vệ thông tin cá nhân và lịch hẹn

3. **Strict Data Extraction**
   - Phone/Email: Regex validation + Identity verification
   - DateTime: Multiple format parsers + business rules
   - Doctor/Service/Voucher: Database lookup validation
   - Confirmation: Explicit keyword matching

4. **Enhanced Error Messages**
   - Icon-based (✅ ❌ ⚠️ 💡 🔐)
   - Context-aware (biết đang ở stage nào)
   - Actionable (đưa ra hướng dẫn cụ thể)
   - Examples (ví dụ minh họa)

5. **Business Rules Validation**
   - Không cho đặt lịch quá khứ
   - Kiểm tra slot availability
   - Verify entity existence

---

## 🏃 Cách chạy test

### Bước 1: Start Backend
```powershell
cd ai
.\START_BACKEND.ps1
```

### Bước 2: Chạy Validation Test
```powershell
.\RUN_VALIDATION_TEST.ps1
```

Hoặc chạy trực tiếp:
```powershell
python test_booking_validation.py
```

---

## 🧪 Test Cases

### Test 1: Off-topic Detection
```
User: "Tôi muốn đặt lịch"
Bot: "Vui lòng cung cấp SĐT/email"

User: "Spa có mấy chi nhánh?" ❌
Bot: "⚠️ Bạn hãy trả lời đúng trọng tâm nhé! Vui lòng cung cấp SĐT..."

User: "0912345678" ✅
Bot: "✅ Xác nhận thành công! Chào [Tên]..."
```

### Test 1.1: Identity Verification (MỚI)
```
User: "Tôi muốn đặt lịch" (Đã đăng nhập với phone: 0912345678)
Bot: "Vui lòng cung cấp SĐT/email để xác nhận"

User: "0999999999" ❌ (Sai SĐT)
Bot: "❌ SĐT không khớp với tài khoản đã đăng nhập!
     📞 SĐT đã đăng ký: 091****78
     💡 Chỉ có thể đặt lịch cho chính tài khoản của bạn."

User: "0912345678" ✅ (Đúng SĐT)
Bot: "✅ Xác nhận thành công! Chào [Tên]..."
```

### Test 2: Invalid Format
```
Bot: "Chọn ngày giờ"

User: "abc123xyz" ❌
Bot: "❌ Không thể hiểu thời gian... [Hướng dẫn format]"

User: "ngày mai 2 giờ chiều" ✅
Bot: "Đã chọn lịch vào 23/11/2025 14:00"
```

### Test 3: Past Time
```
User: "2020-01-01 10:00" ❌
Bot: "❌ Thời gian đặt lịch không được trong quá khứ!"
```

### Test 4: Invalid Entity
```
User: "Bác sĩ XYZ123" ❌
Bot: "❌ Không tìm thấy bác sĩ 'XYZ123'... [Danh sách]"
```

### Test 5: Ambiguous Confirmation
```
User: "chắc vậy" ❌
Bot: "❓ Câu trả lời không rõ ràng. Vui lòng trả lời 'có' hoặc 'không'"

User: "có" ✅
Bot: "✅ Đã đặt lịch thành công!"
```

---

## 📊 Validation Flow

```
┌─────────────────────────────────────────────┐
│         User Input                          │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  Stage 1: LLM Intent Validation             │
│  ❓ Is answer relevant to question?         │
└─────────────┬───────────────────────────────┘
              │
              ├─── NO ──► ⚠️  Return warning
              │           "Trả lời đúng trọng tâm"
              ▼ YES
┌─────────────────────────────────────────────┐
│  Stage 2: Data Extraction                   │
│  📊 Extract phone/email/date/doctor...      │
└─────────────┬───────────────────────────────┘
              │
              ├─── FAIL ──► ❌ Return error
              │             "Không tìm thấy..."
              ▼ SUCCESS
┌─────────────────────────────────────────────┐
│  Stage 3: Business Rules Validation         │
│  ⚖️  Check past time, slot availability... │
└─────────────┬───────────────────────────────┘
              │
              ├─── FAIL ──► ❌ Return error
              │             "Slot đã có người..."
              ▼ SUCCESS
┌─────────────────────────────────────────────┐
│  ✅ Accept & Move to Next Stage             │
└─────────────────────────────────────────────┘
```

---

## 🎯 Expected Behavior

### ✅ Khi VALID:
- Data được extract thành công
- Lưu vào session
- Chuyển sang stage tiếp theo
- Thông báo rõ ràng

### ❌ Khi OFF-TOPIC:
```
⚠️ Bạn hãy trả lời đúng trọng tâm nhé!

[Nhắc lại câu hỏi chưa được trả lời]

💡 Gợi ý: [Hướng dẫn cách trả lời]
```

### ❌ Khi INVALID DATA:
```
❌ [Lý do invalid]

[Giải thích tại sao]

💡 Vui lòng nhập theo format:
- Ví dụ 1
- Ví dụ 2
```

---

## 🔧 Technical Details

### File đã sửa:
- `ai/app/agents/booking_agent.py` - Core validation logic

### Thay đổi chính:

1. **Added `_is_relevant_answer()` method**
   ```python
   def _is_relevant_answer(self, question: str, answer: str) -> bool:
       # Use LLM to check relevance
   ```

2. **Enhanced all `_handle_*()` methods**
   - Add intent validation at start
   - Strict data extraction
   - Better error messages

3. **Improved error messages**
   - Icon-based (✅ ❌ ⚠️ 💡)
   - Multi-line with examples
   - Context-aware

---

## 📈 Validation Coverage

| Stage | Off-topic | Invalid Format | Business Rule | Error Message Quality |
|-------|-----------|----------------|---------------|----------------------|
| await_start | ✅ | ✅ | N/A | ⭐⭐⭐⭐⭐ |
| init | ✅ | ✅ | N/A | ⭐⭐⭐⭐⭐ |
| select_doctor | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| select_datetime | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| input_note | N/A | N/A | N/A | N/A |
| select_services | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| select_voucher | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| confirm | ✅ | ✅ | N/A | ⭐⭐⭐⭐⭐ |

---

## 🎨 Example Screenshots

### Before (Loose Validation):
```
User: "Spa có ưu đãi gì?"
Bot: [Chuyển stage, mặc dù chưa có data]
```

### After (Strict Validation):
```
User: "Spa có ưu đãi gì?"
Bot: "⚠️ Bạn hãy trả lời đúng trọng tâm nhé!
     
     📞 Vui lòng cung cấp số điện thoại hoặc email...
     
     💡 Ví dụ: 0912345678 hoặc email@example.com"
```

---

## 🚦 Test Results Expected

Khi chạy `RUN_VALIDATION_TEST.ps1`, bạn sẽ thấy:

```
================================================================================
# TEST 1: OFF-TOPIC DETECTION
================================================================================

Step: 1.1
Query: Tôi muốn đặt lịch
Expected: Activate booking mode
✅ PASSED
Response: Bạn đã chọn tôi là chatbot đặt lịch...

Step: 1.2
Query: Spa có mấy chi nhánh?
Expected: ❌ Off-topic → warning
✅ PASSED
Response: ⚠️ Bạn hãy trả lời đúng trọng tâm nhé!...

[... more tests ...]
```

---

## 💡 Best Practices

### 1. **Always validate first**
```python
if not self._is_relevant_answer(question, answer):
    return warning_message
```

### 2. **Extract then validate**
```python
data = self._extract_phone(query)
if not data:
    return error_with_examples
```

### 3. **Business rules last**
```python
if datetime < now():
    return past_time_error
```

### 4. **Clear error messages**
```python
return ChatResponse(
    answer="❌ Lỗi rõ ràng\n\n💡 Hướng dẫn cụ thể\n\nVí dụ: ...",
    intent="action"
)
```

---

## 🎯 Success Criteria

✅ **Passed** khi:
- Off-topic được phát hiện → warning
- Invalid format được phát hiện → error + examples
- Business rules được enforce → error + reason
- Happy path hoạt động mượt mà

❌ **Failed** khi:
- Off-topic vẫn chuyển stage
- Invalid data được accept
- Business rules bị bỏ qua
- Error messages không rõ ràng

---

## 📚 Documentation

- `TEST_VALIDATION.md` - Chi tiết test cases
- `test_booking_validation.py` - Automated test script
- `RUN_VALIDATION_TEST.ps1` - Test runner
- `README.md` - Hướng dẫn setup

---

## 🤝 Support

Nếu gặp lỗi khi test:

1. Kiểm tra backend đang chạy: `http://localhost:8000/health`
2. Kiểm tra DB connection
3. Xem logs trong terminal backend
4. Review code changes trong `booking_agent.py`

---

**Kết luận:** Hệ thống đã được cải tiến với validation chặt chẽ, phát hiện off-topic, và error handling tốt hơn! 🎉
