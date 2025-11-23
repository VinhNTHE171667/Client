# 🔐 Identity Verification - Xác thực danh tính khi đặt lịch

## 📋 Tổng quan

Để đảm bảo bảo mật và chỉ cho phép khách hàng đặt lịch cho chính tài khoản của mình, hệ thống đã được cải tiến với **Identity Verification**.

---

## 🎯 Mục tiêu

### ✅ User chỉ có thể đặt lịch cho chính tài khoản của mình
- Phone/Email nhập vào **PHẢI khớp** với tài khoản đã đăng nhập
- Không cho phép đặt lịch cho người khác
- Bảo vệ thông tin cá nhân và lịch hẹn

---

## 🔧 Cách hoạt động

### Flow 1: User đã đăng nhập (Recommended)

```
┌─────────────────────────────────────┐
│  User đăng nhập thành công          │
│  → customerId được lưu trong session│
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Chatbot: "Vui lòng cung cấp        │
│  SĐT/email để xác nhận danh tính"   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  User nhập: "0912345678"            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  System verify:                     │
│  1. Get customer info từ DB         │
│  2. So sánh SĐT/email nhập vào      │
│     với SĐT/email đã đăng ký        │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
    KHỚP           KHÔNG KHỚP
       │               │
       ▼               ▼
  ✅ VERIFIED    ❌ REJECTED
  Chuyển stage   Hiện warning
                 + hint SĐT đã đăng ký
```

### Flow 2: User chưa đăng nhập (Fallback)

```
┌─────────────────────────────────────┐
│  User nhập: "0912345678"            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  System lookup trong DB:            │
│  - Tìm customer có SĐT này          │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
   TÌM THẤY      KHÔNG TÌM THẤY
       │               │
       ▼               ▼
  ✅ ALLOWED     ❌ REJECTED
  Set customerId  "Vui lòng đăng ký"
  Chuyển stage
```

---

## 💻 Implementation

### 1. Helper Methods

#### `_get_customer_info(customer_id: str)`
Lấy thông tin customer từ DB:
```python
{
    "id": "uuid",
    "full_name": "Nguyễn Văn A",
    "phone": "0912345678",
    "email": "nguyenvana@example.com"
}
```

#### `_verify_customer_identity(customer_info, input_phone, input_email)`
Verify phone/email nhập vào có khớp không:
```python
# Normalize phone (loại bỏ khoảng trắng, dấu -)
# Normalize email (lowercase)
# So sánh:
return phone_match OR email_match
```

### 2. Enhanced `_handle_init()`

#### CASE 1: Đã có customerId (User đã đăng nhập)

```python
if customer_id and customer_info:
    # Extract phone/email từ user input
    email = self._extract_email(query)
    phone = self._extract_phone(query)
    
    # Validation 1: Phải có ít nhất phone hoặc email
    if not email and not phone:
        return error("Không tìm thấy SĐT/email")
    
    # Validation 2: Verify identity
    if not self._verify_customer_identity(customer_info, phone, email):
        # Show hint (masked for security)
        phone_hint = "091****78"  # Che bớt SĐT
        email_hint = "ng****@example.com"  # Che bớt email
        return error(f"SĐT/email không khớp!\n\nĐã đăng ký: {phone_hint}")
    
    # ✅ Verified! Next stage
    return success("Xác nhận thành công!")
```

#### CASE 2: Chưa có customerId (Fallback)

```python
else:
    # Lookup customer từ phone/email
    found = self._lookup_customer_id(phone, email)
    
    if found:
        # Set customerId và tiếp tục
        session["customer_id"] = found
        return success("Tìm thấy tài khoản!")
    else:
        return error("Không tìm thấy tài khoản.\nVui lòng đăng ký trước.")
```

---

## 🧪 Test Scenarios

### Scenario 1: ✅ Valid Identity (PASS)

```
# User đăng nhập với account:
# - Phone: 0912345678
# - Email: test@example.com

User: "Tôi muốn đặt lịch"
Bot: "Vui lòng cung cấp SĐT/email để xác nhận"

User: "0912345678" ✅
Bot: "✅ Xác nhận thành công! Chào Nguyễn Văn A!"
```

### Scenario 2: ❌ Wrong Phone (FAIL)

```
# User đăng nhập với phone: 0912345678

User: "0999999999" ❌
Bot: "❌ SĐT không khớp với tài khoản đã đăng nhập!
     
     🔐 Vui lòng nhập đúng thông tin bạn đã đăng ký:
     
     📞 SĐT đã đăng ký: 091****78
     📧 Email đã đăng ký: te****@example.com
     
     💡 Chỉ có thể đặt lịch cho chính tài khoản của bạn."
```

### Scenario 3: ✅ Valid Email (PASS)

```
# User đăng nhập với email: test@example.com

User: "test@example.com" ✅
Bot: "✅ Xác nhận thành công!"
```

### Scenario 4: ❌ Account Not Found (FAIL)

```
# User chưa đăng nhập

User: "0999999999" ❌ (không tồn tại trong DB)
Bot: "❌ Không tìm thấy tài khoản với SĐT/email này.
     
     📝 Vui lòng đăng ký tài khoản trước khi đặt lịch.
     
     💡 Hoặc kiểm tra lại SĐT/email bạn đã nhập."
```

---

## 🔒 Security Features

### 1. **Masked Hints**
Khi hiện SĐT/email đã đăng ký, hệ thống che bớt để bảo mật:
```python
phone_hint = f"{phone[:3]}****{phone[-2:]}"
# 0912345678 → 091****78

email_hint = f"{email[:2]}****{email[email.find('@'):]}"
# test@example.com → te****@example.com
```

### 2. **Normalization**
Loại bỏ sự khác biệt về format:
```python
# Phone: "0912 345 678" → "0912345678"
# Email: "Test@Example.COM" → "test@example.com"
```

### 3. **Flexible Matching**
Cho phép nhập phone HOẶC email:
```python
return phone_match OR email_match
```

---

## 📊 Validation Rules

| Input | Registered | Result | Reason |
|-------|-----------|--------|--------|
| 0912345678 | 0912345678 | ✅ PASS | Phone match |
| test@ex.com | test@ex.com | ✅ PASS | Email match |
| 0999999999 | 0912345678 | ❌ FAIL | Phone mismatch |
| wrong@ex.com | test@ex.com | ❌ FAIL | Email mismatch |
| 0912345678 | test@ex.com (no phone) | ❌ FAIL | No phone registered |
| test@ex.com | 0912345678 (no email) | ❌ FAIL | No email registered |

---

## 🎯 Benefits

### ✅ Bảo mật
- Chỉ user đúng mới đặt lịch được
- Không thể đặt lịch cho người khác

### ✅ Trải nghiệm tốt
- Tự động nhận diện user đã đăng nhập
- Gợi ý rõ ràng khi nhập sai
- Hint SĐT/email đã đăng ký (masked)

### ✅ Dễ debug
- Log rõ ràng khi verify fail
- Error message chi tiết

---

## 🔄 Integration với Authentication

### Backend cần làm:

1. **Set customerId vào session khi user login:**
```python
# Trong authentication middleware/endpoint
booking_agent.set_customer_id(session_id, customer_id)
```

2. **Pass session_id trong mọi request:**
```javascript
// Frontend
fetch('/chat', {
    method: 'POST',
    body: JSON.stringify({
        query: userMessage,
        session_id: sessionId  // Lấy từ auth token hoặc local storage
    })
})
```

### Frontend cần làm:

1. **Lưu session_id sau khi login**
2. **Gửi session_id trong mọi request chat**
3. **Handle error cases:**
   - "Vui lòng đăng nhập trước"
   - "SĐT/email không khớp"

---

## 🐛 Troubleshooting

### ❌ Luôn bị reject mặc dù nhập đúng

**Nguyên nhân:** Format khác nhau

**Giải pháp:**
```python
# Kiểm tra DB có SĐT/email không:
SELECT phone, email FROM customer WHERE id = 'xxx';

# Kiểm tra normalization:
# - Phone có dấu cách, dấu gạch ngang không?
# - Email có uppercase không?
```

### ❌ Không hiện hint SĐT/email

**Nguyên nhân:** customer_info không được load

**Giải pháp:**
```python
# Đảm bảo set_customer_id được gọi khi login:
booking_agent.set_customer_id(session_id, customer_id)

# Hoặc call _get_customer_info() trong _handle_init()
```

---

## 📝 Summary

### Trước khi cải tiến:
```
User nhập bất kỳ SĐT nào → Chấp nhận luôn
→ ❌ Có thể đặt lịch cho người khác
```

### Sau khi cải tiến:
```
User nhập SĐT → Verify với tài khoản đã đăng nhập
→ ✅ Chỉ đặt lịch cho chính mình
→ ✅ Bảo mật cao hơn
→ ✅ UX tốt hơn với hints
```

---

**Kết luận:** Identity Verification đảm bảo chỉ user đúng mới đặt lịch được, tăng cường bảo mật và trải nghiệm người dùng! 🔐
