# 🩺 Doctor Selection Flow - Luồng chọn bác sĩ 2 bước

## 📋 Tổng quan

Stage **select_doctor** đã được cải tiến với **2-step selection**:
1. **Search** - User nhập tên bác sĩ (có thể một phần) → Hệ thống tìm kiếm
2. **Confirm** - User chọn chính xác bác sĩ từ danh sách tìm được

---

## 🎯 Mục tiêu

### ✅ Tìm kiếm linh hoạt
- User có thể nhập một phần tên (ví dụ: "Nguyễn" → tìm tất cả bác sĩ có họ Nguyễn)
- Hỗ trợ fuzzy search

### ✅ Xác nhận chính xác
- Phải chọn đúng bác sĩ từ danh sách
- Không chuyển stage khi chưa xác nhận

### ✅ UX tốt
- Hiển thị danh sách rõ ràng với số thứ tự
- Cho phép chọn bằng số hoặc tên đầy đủ
- Cho phép tìm lại nếu không thấy bác sĩ mong muốn

---

## 🔄 Flow chi tiết

### Flow 1: Tìm thấy duy nhất 1 bác sĩ

```
User: "Nguyễn Văn A"
  ↓
System search: Tìm thấy 1 match
  ↓
Bot: "🔍 Tìm thấy bác sĩ:
     1. Bác sĩ Nguyễn Văn A
     
     ✅ Bạn có chắc chắn muốn chọn bác sĩ này không?
     💡 Nhập '1' hoặc 'có' để xác nhận, 'không' để tìm lại."
  ↓
User: "1" hoặc "có"
  ↓
Bot: "✅ Bạn đã chọn bác sĩ Nguyễn Văn A.
     📅 Bạn muốn đặt lịch vào ngày nào..."
  ↓
[Chuyển sang stage select_datetime]
```

### Flow 2: Tìm thấy nhiều bác sĩ

```
User: "Nguyễn"
  ↓
System search: Tìm thấy 3 matches
  ↓
Bot: "🔍 Tìm thấy 3 bác sĩ có tên tương tự:
     1. Bác sĩ Nguyễn Văn A
     2. Bác sĩ Nguyễn Thị B
     3. Bác sĩ Nguyễn Minh C
     
     💡 Vui lòng nhập số thứ tự (1, 2, 3...) hoặc tên đầy đủ."
  ↓
User: "2"
  ↓
Bot: "✅ Bạn đã chọn bác sĩ Nguyễn Thị B.
     📅 Bạn muốn đặt lịch..."
  ↓
[Chuyển sang stage select_datetime]
```

### Flow 3: Không tìm thấy bác sĩ

```
User: "XYZ"
  ↓
System search: Không tìm thấy
  ↓
Bot: "❌ Không tìm thấy bác sĩ có tên 'XYZ' trong hệ thống.
     
     👨‍⚕️ Danh sách bác sĩ có sẵn:
     1. Bác sĩ Nguyễn Văn A
     2. Bác sĩ Trần Thị B
     3. Bác sĩ Lê Văn C
     ...
     
     💡 Vui lòng nhập tên bác sĩ từ danh sách trên."
  ↓
User: "Nguyễn Văn A"
  ↓
[Search lại...]
```

### Flow 4: Tìm lại (User không hài lòng)

```
Bot: "🔍 Tìm thấy:
     1. Bác sĩ Nguyễn Văn A"
  ↓
User: "không" hoặc "tìm lại"
  ↓
Bot: "🔄 Được rồi, hãy tìm lại nhé!
     
     👨‍⚕️ Danh sách bác sĩ:
     1. Bác sĩ Nguyễn Văn A
     2. Bác sĩ Trần Thị B
     ...
     
     💡 Nhập tên bác sĩ bạn muốn tìm."
  ↓
User: "Trần"
  ↓
[Search lại...]
```

---

## 💻 Implementation

### 1. Session State

```python
session = {
    "stage": "select_doctor",
    "doctor_candidates": [],  # Danh sách bác sĩ tìm được
    "doctor_id": None,        # ID bác sĩ đã chọn
    ...
}
```

### 2. Two-Step Logic

```python
def _handle_select_doctor(session, query):
    candidates = session.get("doctor_candidates", [])
    
    if candidates:
        # STEP 2: User đang chọn từ danh sách
        return _handle_doctor_selection(session, query, candidates)
    else:
        # STEP 1: User đang search
        return _handle_doctor_search(session, query, all_doctors)
```

### 3. Search Method

```python
def _search_doctors_by_name(search_term, all_doctors):
    search_lower = search_term.lower()
    
    # Exact match first
    for doc in all_doctors:
        if doc["full_name"].lower() == search_lower:
            return [doc]  # Return immediately
    
    # Partial match
    matches = []
    for doc in all_doctors:
        if search_lower in doc["full_name"].lower():
            matches.append(doc)
    
    return matches
```

### 4. Selection Methods

#### By Number
```python
try:
    index = int(query) - 1
    if 0 <= index < len(candidates):
        selected = candidates[index]
        # Confirm và chuyển stage
except ValueError:
    pass
```

#### By Name
```python
for doc in candidates:
    if query.lower() in doc["full_name"].lower():
        # Confirm và chuyển stage
```

---

## 🧪 Test Scenarios

### Scenario 1: ✅ Search → Select by Number

```
User: "Nguyễn"
Bot: "🔍 Tìm thấy 3 bác sĩ:
     1. Nguyễn Văn A
     2. Nguyễn Thị B
     3. Nguyễn Minh C"

User: "2" ✅
Bot: "✅ Đã chọn Nguyễn Thị B"
[Next stage]
```

### Scenario 2: ✅ Search → Select by Name

```
User: "Trần"
Bot: "🔍 Tìm thấy 2 bác sĩ:
     1. Trần Văn A
     2. Trần Thị B"

User: "Trần Thị B" ✅
Bot: "✅ Đã chọn Trần Thị B"
[Next stage]
```

### Scenario 3: ❌ Invalid Selection

```
User: "Nguyễn"
Bot: "🔍 Tìm thấy 3 bác sĩ:
     1. Nguyễn Văn A
     2. Nguyễn Thị B
     3. Nguyễn Minh C"

User: "5" ❌ (Ngoài range)
Bot: "❌ Lựa chọn không hợp lệ.
     Vui lòng nhập 1, 2 hoặc 3"
[Stay in selection]
```

### Scenario 4: ✅ Search Again

```
User: "Nguyễn"
Bot: "🔍 Tìm thấy 3 bác sĩ..."

User: "không" ✅
Bot: "🔄 Được rồi, hãy tìm lại!
     Danh sách bác sĩ:..."
[Clear candidates, back to search]
```

### Scenario 5: ❌ Not Found

```
User: "XYZ123" ❌
Bot: "❌ Không tìm thấy bác sĩ 'XYZ123'.
     Danh sách bác sĩ có sẵn:
     1. Nguyễn Văn A
     2. Trần Thị B
     ..."
[Stay in search, wait for new input]
```

### Scenario 6: ✅ Single Match → Confirm

```
User: "Nguyễn Văn A"
Bot: "🔍 Tìm thấy bác sĩ:
     1. Bác sĩ Nguyễn Văn A
     
     ✅ Bạn có chắc chắn không?
     Nhập '1' hoặc 'có'"

User: "có" ✅
Bot: "✅ Đã chọn Nguyễn Văn A"
[Next stage]
```

---

## 📊 State Transitions

```
[select_doctor stage]
         │
         ├─ No candidates → SEARCH
         │         │
         │         ├─ Found 0 → Show all doctors, stay in SEARCH
         │         ├─ Found 1 → Set candidates, ask confirm → SELECTION
         │         └─ Found N → Set candidates, ask choose → SELECTION
         │
         └─ Has candidates → SELECTION
                   │
                   ├─ Valid number → Confirm doctor → [next stage]
                   ├─ Valid name → Confirm doctor → [next stage]
                   ├─ "không" → Clear candidates → back to SEARCH
                   └─ Invalid → Show error, stay in SELECTION
```

---

## 🎯 Validation Rules

| Input | Candidates | Action | Next State |
|-------|-----------|--------|------------|
| "Nguyễn" | [] | Search, found 3 | SELECTION (candidates set) |
| "XYZ" | [] | Search, found 0 | SEARCH (show all) |
| "1" | [A, B, C] | Select index 0 (A) | next_stage |
| "5" | [A, B, C] | Invalid (out of range) | SELECTION (error) |
| "Nguyễn Văn A" | [A, B, C] | Match by name | next_stage |
| "không" | [A, B, C] | Clear candidates | SEARCH |

---

## 🔧 Error Handling

### ❌ Off-topic trong SEARCH
```
User: "Giá bao nhiêu?"
Bot: "⚠️ Bạn hãy trả lời đúng trọng tâm nhé!
     Vui lòng nhập tên bác sĩ..."
```

### ❌ Off-topic trong SELECTION
```
User: "Spa có ưu đãi gì?"
Bot: "⚠️ Vui lòng chọn bác sĩ từ danh sách:
     1. Nguyễn Văn A
     2. Trần Thị B
     ..."
```

### ❌ Invalid format trong SELECTION
```
User: "abc"
Bot: "❌ Lựa chọn không hợp lệ.
     Nhập số thứ tự hoặc tên đầy đủ."
```

---

## 💡 UX Improvements

### 1. **Numbered List**
Dễ chọn bằng số:
```
1. Bác sĩ Nguyễn Văn A
2. Bác sĩ Trần Thị B
```

### 2. **Clear Instructions**
```
💡 Nhập số thứ tự (1, 2, 3...) hoặc tên đầy đủ bác sĩ
```

### 3. **Search Again Option**
```
💡 Nhập 'không' để tìm lại
```

### 4. **Limited Display**
Chỉ hiển thị 10 bác sĩ đầu tiên:
```
1. Bác sĩ A
2. Bác sĩ B
...
(và 15 bác sĩ khác)

💡 Nhập tên để tìm kiếm chính xác hơn
```

---

## 🚀 Benefits

### ✅ Linh hoạt
- User có thể nhập một phần tên
- Hỗ trợ nhiều cách chọn (số, tên)

### ✅ Chính xác
- Không chuyển stage khi chưa xác nhận
- Luôn hiển thị danh sách rõ ràng

### ✅ UX tốt
- Instructions rõ ràng
- Cho phép tìm lại
- Numbered list dễ chọn

### ✅ Validation chặt
- Off-topic detection
- Invalid selection handling
- Clear error messages

---

## 📝 Summary

### Trước khi cải tiến:
```
User nhập tên → Tìm 1 bác sĩ bất kỳ → Chuyển stage luôn
→ ❌ Không chính xác nếu có nhiều bác sĩ cùng tên
```

### Sau khi cải tiến:
```
User nhập tên → Tìm tất cả matches → Hiển thị danh sách
→ User chọn chính xác → Xác nhận → Chuyển stage
→ ✅ Chính xác 100%
→ ✅ UX tốt với nhiều options
```

---

**Kết luận:** 2-step selection đảm bảo user chọn đúng bác sĩ mong muốn trước khi tiếp tục! 🩺
