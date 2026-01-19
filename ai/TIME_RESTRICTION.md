# ⏰ Giới hạn Giờ Đặt Lịch (Time Restriction)

## 📋 Tổng quan

Hệ thống chỉ cho phép đặt lịch hẹn trong khung giờ làm việc từ **9:00 sáng đến 16:00 chiều** (4:00 PM).

---

## 🎯 Quy định

### ✅ Giờ được chấp nhận
- **Từ**: 09:00 (9 giờ sáng)
- **Đến**: 16:00 (4 giờ chiều)
- **Tính theo**: Giờ bắt đầu của slot (startTime)

### ❌ Giờ KHÔNG được chấp nhận
- Trước 09:00 (ví dụ: 8:00, 7:30)
- Từ 16:00 trở đi (ví dụ: 16:00, 17:00, 18:00)

---

## 💻 Implementation

### 1. Validation trong Booking Agent

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

### 2. Thứ tự Validation

Trong `_handle_select_datetime()`, validation được thực hiện theo thứ tự:

1. ✅ **Parse datetime** từ user input
2. ✅ **Kiểm tra quá khứ** (không cho phép đặt lịch trong quá khứ)
3. ✅ **Kiểm tra giờ làm việc** (9:00 - 16:00) ← **MỚI THÊM**
4. ✅ **Kiểm tra slot available** (bác sĩ có bận không)

---

## 🧪 Test Cases

### Test Case 1: ❌ Đặt lịch trước 9 giờ sáng

```
User: "ngày mai 8 giờ sáng"
Bot: "❌ Chỉ cho phép đặt lịch từ 9:00 sáng đến 16:00 chiều!"
```

### Test Case 2: ✅ Đặt lịch 9 giờ sáng (boundary)

```
User: "ngày mai 9 giờ sáng"
Bot: "Đã chọn lịch vào..."  ✅ Accepted
```

### Test Case 3: ✅ Đặt lịch 2 giờ chiều

```
User: "ngày mai 2 giờ chiều"
Bot: "Đã chọn lịch vào..."  ✅ Accepted
```

### Test Case 4: ✅ Đặt lịch 3 giờ chiều (15:00)

```
User: "ngày mai 3 giờ chiều"
Bot: "Đã chọn lịch vào..."  ✅ Accepted
```

### Test Case 5: ❌ Đặt lịch 4 giờ chiều (16:00)

```
User: "ngày mai 4 giờ chiều"
Bot: "❌ Chỉ cho phép đặt lịch từ 9:00 sáng đến 16:00 chiều!"
```

### Test Case 6: ❌ Đặt lịch 5 giờ chiều

```
User: "ngày mai 5 giờ chiều"
Bot: "❌ Chỉ cho phép đặt lịch từ 9:00 sáng đến 16:00 chiều!"
```

### Test Case 7: ❌ Đặt lịch 7 giờ tối

```
User: "ngày mai 7 giờ tối"
Bot: "❌ Chỉ cho phép đặt lịch từ 9:00 sáng đến 16:00 chiều!"
```

---

## 📊 Boundary Conditions

| Giờ | Giá trị | Kết quả |
|-----|---------|---------|
| 08:59 | < 9 | ❌ Reject |
| 09:00 | = 9 | ✅ Accept |
| 14:00 | < 16 | ✅ Accept |
| 15:00 | < 16 | ✅ Accept |
| 15:59 | < 16 | ✅ Accept |
| 16:00 | >= 16 | ❌ Reject |
| 17:00 | >= 16 | ❌ Reject |

---

## 🎨 User Experience

### Error Message
```
❌ Chỉ cho phép đặt lịch từ 9:00 sáng đến 16:00 chiều!

⏰ Giờ làm việc: 09:00 - 16:00

💡 Vui lòng chọn khung giờ trong khoảng thời gian trên.

Ví dụ:
- '9 giờ sáng'
- '2 giờ chiều' (14:00)
- '3 giờ chiều' (15:00)
```

### Đặc điểm UX:
1. **Clear Error Message**: Thông báo rõ ràng lý do reject
2. **Show Working Hours**: Hiển thị giờ làm việc cho user
3. **Provide Examples**: Đưa ra ví dụ về giờ hợp lệ
4. **Stay in Stage**: Giữ user ở stage `select_datetime` để nhập lại

---

## 🔧 Configuration

Nếu cần thay đổi giờ làm việc trong tương lai, sửa trong file `booking_agent.py`:

```python
# Validation: Chỉ cho phép đặt lịch từ 9h sáng đến 16h chiều
WORKING_HOUR_START = 9  # Thay đổi giờ bắt đầu
WORKING_HOUR_END = 16   # Thay đổi giờ kết thúc

if slot_start_time.hour < WORKING_HOUR_START or slot_start_time.hour >= WORKING_HOUR_END:
    # Error message...
```

---

## 🚀 Benefits

### ✅ Business Logic
- Đảm bảo đặt lịch trong giờ làm việc
- Tránh confusion về giờ phục vụ
- Quản lý resource hiệu quả

### ✅ User Experience
- Thông báo rõ ràng khi nhập sai
- Gợi ý giờ hợp lệ
- Tránh đặt lịch ngoài giờ

### ✅ Validation Chặt
- Kiểm tra boundary conditions
- Consistent với business rules
- Easy to maintain và update

---

## 📝 Summary

| Aspect | Detail |
|--------|--------|
| **Giờ cho phép** | 09:00 - 15:59 (start time < 16:00) |
| **Validation location** | `_handle_select_datetime()` |
| **Order** | Sau kiểm tra quá khứ, trước check available |
| **Error handling** | Clear message + stay in stage |
| **UX** | Show working hours + examples |

---

**Kết luận:** Hệ thống đã được cập nhật để chỉ cho phép đặt lịch trong khung giờ làm việc 9:00 - 16:00, đảm bảo tính nhất quán và hiệu quả trong quản lý lịch hẹn! ⏰

