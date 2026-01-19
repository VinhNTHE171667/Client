# 📝 Tóm tắt Thay đổi: Giới hạn Giờ Đặt Lịch

## 🎯 Mục tiêu
Bổ sung validation để **CHỈ cho phép đặt lịch từ 9:00 sáng đến 16:00 chiều**.

---

## ✅ Các thay đổi đã thực hiện

### 1. File: `app/agents/booking_agent.py`

**Vị trí:** Method `_handle_select_datetime()` - Stage 3

**Thay đổi:** Thêm validation kiểm tra giờ làm việc

```python
# Validation: Chỉ cho phép đặt lịch từ 9h sáng đến 16h chiều
if slot_start_time.hour < 9 or slot_start_time.hour >= 16:
    return ChatResponse(
        answer="❌ Chỉ cho phép đặt lịch từ 9:00 sáng đến 16:00 chiều!\n\n"
               "⏰ Giờ làm việc: 09:00 - 16:00\n\n"
               "💡 Vui lòng chọn khung giờ trong khoảng thời gian trên.\n\n"
               "Ví dụ:\n"
               "- '9 giờ sáng'\n"
               "- '2 giờ chiều' (14:00)\n"
               "- '3 giờ chiều' (15:00)",
        intent="action"
    )
```

**Thứ tự validation:**
1. Parse datetime từ input ✅
2. Kiểm tra thời gian quá khứ ✅
3. **Kiểm tra giờ làm việc (9:00-16:00)** ← MỚI THÊM ✅
4. Kiểm tra slot available (bác sĩ có bận không) ✅

---

### 2. File: `TIME_RESTRICTION.md` (MỚI)

**Mục đích:** Tài liệu chi tiết về giới hạn giờ đặt lịch

**Nội dung:**
- ✅ Quy định giờ làm việc (9:00 - 16:00)
- ✅ Implementation details
- ✅ Test cases (9 scenarios)
- ✅ Boundary conditions
- ✅ User experience (error messages)
- ✅ Configuration hướng dẫn

---

### 3. File: `test_time_restriction.py` (MỚI)

**Mục đích:** Test script để kiểm tra giới hạn giờ

**Test cases:**
1. ❌ Trước 9 giờ sáng (8:00, 7:30)
2. ✅ Đúng 9 giờ sáng (boundary)
3. ✅ Giữa giờ làm việc (10:00, 14:00)
4. ✅ Giờ cuối cùng (15:00)
5. ❌ Đúng 16:00 (boundary)
6. ❌ Sau 16:00 (17:00, 19:00)

**Chạy test:**
```powershell
python test_time_restriction.py
```

---

## 🧪 Kịch bản Test

### ✅ Case 1: Giờ hợp lệ (9:00 - 15:59)

```
User: "Tôi muốn đặt lịch"
Bot: "Vui lòng nhập 'bắt đầu'..."

User: "bắt đầu"
Bot: "Vui lòng cung cấp số điện thoại..."

User: "0912345678"
Bot: "Bạn muốn đặt lịch với bác sĩ nào?..."

User: "Bác sĩ Nguyễn Văn A"
Bot: "Bạn muốn đặt lịch vào ngày nào..."

User: "ngày mai 2 giờ chiều"
Bot: "✅ Đã chọn lịch vào 27/11/2025 khung 14:00 - 15:00
     Bạn có muốn ghi chú gì không?..."
```

### ❌ Case 2: Giờ không hợp lệ (trước 9:00 hoặc từ 16:00 trở đi)

```
User: "ngày mai 8 giờ sáng"
Bot: "❌ Chỉ cho phép đặt lịch từ 9:00 sáng đến 16:00 chiều!
     
     ⏰ Giờ làm việc: 09:00 - 16:00
     
     💡 Vui lòng chọn khung giờ trong khoảng thời gian trên.
     
     Ví dụ:
     - '9 giờ sáng'
     - '2 giờ chiều' (14:00)
     - '3 giờ chiều' (15:00)"

[User vẫn ở stage select_datetime, có thể nhập lại]

User: "ngày mai 2 giờ chiều"
Bot: "✅ Đã chọn lịch vào 27/11/2025 khung 14:00 - 15:00..."
```

---

## 📊 Boundary Conditions

| Giờ nhập | Giờ slot | Kết quả | Lý do |
|----------|----------|---------|-------|
| 8:00 sáng | 08:00 | ❌ Reject | < 9 |
| 8:59 sáng | 08:00 | ❌ Reject | < 9 |
| 9:00 sáng | 09:00 | ✅ Accept | = 9 |
| 9:30 sáng | 09:00 | ✅ Accept | >= 9 && < 16 |
| 2:00 chiều | 14:00 | ✅ Accept | >= 9 && < 16 |
| 3:00 chiều | 15:00 | ✅ Accept | >= 9 && < 16 |
| 3:30 chiều | 15:00 | ✅ Accept | >= 9 && < 16 |
| 4:00 chiều | 16:00 | ❌ Reject | >= 16 |
| 5:00 chiều | 17:00 | ❌ Reject | >= 16 |
| 7:00 tối | 19:00 | ❌ Reject | >= 16 |

---

## 🎨 User Experience

### Error Message Format

```
❌ Chỉ cho phép đặt lịch từ 9:00 sáng đến 16:00 chiều!

⏰ Giờ làm việc: 09:00 - 16:00

💡 Vui lòng chọn khung giờ trong khoảng thời gian trên.

Ví dụ:
- '9 giờ sáng'
- '2 giờ chiều' (14:00)
- '3 giờ chiều' (15:00)
```

### Đặc điểm:
- ❌ **Clear rejection**: Thông báo rõ ràng lý do
- ⏰ **Show hours**: Hiển thị giờ làm việc
- 💡 **Provide examples**: Gợi ý giờ hợp lệ
- 🔄 **Stay in stage**: Cho phép nhập lại

---

## 🔧 Cách thay đổi giờ làm việc (nếu cần)

File: `app/agents/booking_agent.py`

**Hiện tại:**
```python
if slot_start_time.hour < 9 or slot_start_time.hour >= 16:
```

**Thay đổi (ví dụ: 8:00 - 18:00):**
```python
WORKING_HOUR_START = 8
WORKING_HOUR_END = 18

if slot_start_time.hour < WORKING_HOUR_START or slot_start_time.hour >= WORKING_HOUR_END:
    return ChatResponse(
        answer=f"❌ Chỉ cho phép đặt lịch từ {WORKING_HOUR_START}:00 đến {WORKING_HOUR_END}:00!..."
```

---

## ✅ Checklist Hoàn thành

- [x] ✅ Code implementation (`booking_agent.py`)
- [x] ✅ Validation logic (9:00 - 16:00)
- [x] ✅ Error message (clear + examples)
- [x] ✅ Documentation (`TIME_RESTRICTION.md`)
- [x] ✅ Test script (`test_time_restriction.py`)
- [x] ✅ Boundary test cases
- [x] ✅ UX considerations

---

## 🚀 Cách chạy Test

### 1. Khởi động backend
```powershell
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
```

### 2. Chạy test
```powershell
# Terminal mới
python test_time_restriction.py
```

### 3. Kết quả mong đợi
```
✅ PASS - Test 1: ❌ Trước 9 giờ sáng (8:00)
✅ PASS - Test 2: ❌ Trước 9 giờ sáng (7:30)
✅ PASS - Test 3: ✅ Đúng 9 giờ sáng (boundary)
✅ PASS - Test 4: ✅ Giữa giờ làm việc (10:00)
✅ PASS - Test 5: ✅ Giữa giờ làm việc (14:00)
✅ PASS - Test 6: ✅ Giờ cuối cùng (15:00)
✅ PASS - Test 7: ❌ Đúng 16:00 (boundary)
✅ PASS - Test 8: ❌ Sau 16:00 (17:00)
✅ PASS - Test 9: ❌ Tối (19:00)

Total: 9/9 tests passed
🎉 All tests passed!
```

---

## 📝 Summary

| Aspect | Value |
|--------|-------|
| **Giờ cho phép** | 09:00 - 15:59 |
| **Validation** | `hour >= 9 && hour < 16` |
| **Files changed** | 1 (booking_agent.py) |
| **Files added** | 2 (TIME_RESTRICTION.md, test_time_restriction.py) |
| **Test cases** | 9 scenarios |
| **Impact** | Stage `select_datetime` |

---

**Kết luận:** Hệ thống chatbot đã được cập nhật thành công với giới hạn giờ đặt lịch 9:00 - 16:00. Tất cả validation, documentation và test đã được hoàn thành! 🎉

