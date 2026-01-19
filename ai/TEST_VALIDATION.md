# 🧪 Test Cases - Validation Luồng Đặt Lịch

## ✅ Các cải tiến đã thực hiện:

### 1. **Intent Validation bằng LLM**
- Mỗi câu hỏi sẽ được kiểm tra xem câu trả lời có liên quan không
- Nếu off-topic → hiển thị warning và yêu cầu trả lời lại

### 2. **Strict Data Extraction**
- Mỗi stage chỉ chuyển tiếp khi đã extract được data
- Nếu không extract được → error message cụ thể + gợi ý

### 3. **Context-Aware Error Messages**
- Thông báo lỗi chi tiết với emoji
- Hướng dẫn cụ thể cách nhập đúng
- Ví dụ minh họa

### 4. **Validation Rules**

#### Stage 1: Init (Phone/Email)
```
❌ User: "Tôi muốn đặt lịch"
✅ Response: "⚠️ Bạn hãy trả lời đúng trọng tâm nhé!"
```

#### Stage 2: Select Doctor
```
❌ User: "Tôi muốn massage"
✅ Response: "⚠️ Bạn hãy trả lời đúng trọng tâm nhé! Vui lòng chọn bác sĩ..."
```

#### Stage 3: Select DateTime
```
❌ User: "Bác sĩ giỏi không?"
✅ Response: "⚠️ Bạn hãy trả lời đúng trọng tâm nhé! Vui lòng cho biết ngày giờ..."

❌ User: "xyz123"
✅ Response: "❌ Không thể hiểu thời gian... [hướng dẫn format]"

❌ User: "hôm qua"
✅ Response: "❌ Thời gian đặt lịch không được trong quá khứ!"
```

#### Stage 5: Select Services
```
❌ User: "Giá bao nhiêu?"
✅ Response: "⚠️ Bạn hãy trả lời đúng trọng tâm nhé! Vui lòng chọn dịch vụ..."
```

#### Stage 6: Select Voucher
```
❌ User: "Voucher này tốt không?"
✅ Response: "⚠️ Bạn hãy trả lời đúng trọng tâm nhé! Vui lòng nhập mã voucher..."
```

#### Stage 7: Confirm
```
❌ User: "Giá bao nhiêu?"
✅ Response: "⚠️ Bạn hãy trả lời đúng trọng tâm nhé! Vui lòng trả lời 'có' hoặc 'không'"

❌ User: "maybe"
✅ Response: "❓ Câu trả lời không rõ ràng. Vui lòng trả lời 'có' hoặc 'không'"
```

---

## 🧪 Test Scenarios

### Test 1: Off-topic trong mỗi stage
```
User: "Tôi muốn đặt lịch"
Bot: "Vui lòng cung cấp SĐT/email"

User: "Spa có mấy chi nhánh?"  ❌ OFF-TOPIC
Bot: "⚠️ Bạn hãy trả lời đúng trọng tâm nhé! Vui lòng cung cấp SĐT..."

User: "0912345678"  ✅ VALID
Bot: "Bạn muốn đặt lịch với bác sĩ nào?"
```

### Test 2: Invalid data format
```
Bot: "Chọn ngày và giờ"

User: "abc123xyz"  ❌ INVALID FORMAT
Bot: "❌ Không thể hiểu thời gian... [hướng dẫn format]"

User: "ngày mai 2 giờ chiều"  ✅ VALID
Bot: "Đã chọn lịch vào 23/11/2025 14:00"
```

### Test 3: Past datetime
```
Bot: "Chọn ngày và giờ"

User: "hôm qua 2 giờ"  ❌ PAST TIME
Bot: "❌ Thời gian đặt lịch không được trong quá khứ!"

User: "ngày mai 2 giờ"  ✅ VALID
Bot: "Đã chọn lịch..."
```

### Test 4: Slot not available
```
Bot: "Chọn ngày và giờ"

User: "ngày mai 9 giờ"  ❌ SLOT TAKEN
Bot: "❌ Khung giờ này bác sĩ đã có lịch hẹn! Vui lòng chọn thời gian khác."
```

### Test 5: Invalid doctor/service/voucher
```
Bot: "Chọn bác sĩ"

User: "Bác sĩ XYZ"  ❌ NOT FOUND
Bot: "❌ Không tìm thấy bác sĩ 'XYZ' trong hệ thống. Vui lòng chọn từ danh sách..."
```

### Test 6: Ambiguous confirmation
```
Bot: "Bạn có xác nhận đặt lịch không?"

User: "chắc vậy"  ❌ AMBIGUOUS
Bot: "❓ Câu trả lời không rõ ràng. Vui lòng trả lời 'có' hoặc 'không'"

User: "có"  ✅ VALID
Bot: "✅ Đã đặt lịch thành công!"
```

---

## 🎯 Expected Behavior

### ✅ Khi trả lời ĐÚNG trọng tâm:
- Extract data thành công
- Chuyển sang stage tiếp theo
- Thông báo rõ ràng đã nhận được gì

### ❌ Khi trả lời SAI/OFF-TOPIC:
- **KHÔNG** chuyển stage
- Hiện warning: "⚠️ Bạn hãy trả lời đúng trọng tâm nhé!"
- Nhắc lại câu hỏi chưa lấy được dữ liệu
- Đưa ra hướng dẫn cụ thể + ví dụ

### ❌ Khi data INVALID:
- **KHÔNG** chuyển stage
- Hiện error cụ thể (❌)
- Giải thích tại sao invalid
- Đưa ra format đúng + ví dụ

---

## 🔧 Technical Implementation

### 1. LLM Validation
```python
def _is_relevant_answer(self, question_context: str, user_answer: str) -> bool:
    """Kiểm tra câu trả lời có liên quan bằng LLM"""
    # Sử dụng LLM để phân tích ngữ cảnh
    # Trả về YES/NO
```

### 2. Strict Extraction
- Phone: Regex pattern `0\d{9}` hoặc `+84\d{9}`
- Email: Regex pattern email
- Datetime: Multiple parsers (ISO, Vietnamese natural language)
- Doctor/Service/Voucher: Fuzzy matching + exact match

### 3. Error Hierarchy
1. Off-topic detection (LLM)
2. Data extraction validation
3. Business logic validation (past time, slot available, etc.)

---

## 🚀 How to Test

1. Start backend:
```powershell
cd ai
.\START_BACKEND.ps1
```

2. Test với Postman/curl:
```bash
POST http://localhost:8000/chat
{
  "query": "Tôi muốn đặt lịch",
  "session_id": "test123"
}
```

3. Test scenarios:
- ✅ Happy path: Trả lời đúng tất cả câu hỏi
- ❌ Off-topic path: Hỏi những câu không liên quan
- ❌ Invalid data path: Nhập sai format
- ❌ Business rules: Quá khứ, slot taken, không tìm thấy

---

## 📊 Validation Coverage

| Stage | Validation | Error Message |
|-------|-----------|---------------|
| await_start | Keyword match | "Vui lòng nhập 'bắt đầu'..." |
| init | LLM + Phone/Email extraction | "⚠️ Trả lời đúng trọng tâm..." |
| select_doctor | LLM + Doctor lookup | "❌ Không tìm thấy bác sĩ..." |
| select_datetime | LLM + Datetime parsing + Past check + Slot availability | "❌ Không thể hiểu thời gian..." |
| input_note | (Optional) | - |
| select_services | LLM + Service lookup | "❌ Không tìm thấy dịch vụ..." |
| select_voucher | LLM + Voucher lookup | "❌ Không tìm thấy voucher..." |
| confirm | LLM + Keyword match | "❓ Câu trả lời không rõ ràng..." |

---

## 💡 Key Improvements

### Before (Loose Validation):
```
User: "Tôi muốn massage"
Bot: [Chuyển sang stage tiếp luôn, mặc dù chưa có doctor_id]
```

### After (Strict Validation):
```
User: "Tôi muốn massage"
Bot: "⚠️ Bạn hãy trả lời đúng trọng tâm nhé! Vui lòng chọn bác sĩ từ danh sách..."
```

---

**Kết luận:** Hệ thống giờ đây **BẮT CHẶT** các ngoại lệ, yêu cầu user phải trả lời đúng trọng tâm mới chuyển stage!
