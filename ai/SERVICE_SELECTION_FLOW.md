# 💆 Service Selection Flow - Luồng chọn dịch vụ (Multiple Selection)

## 📋 Tổng quan

Stage **select_services** đã được cải tiến với **multi-step selection**:
1. **Search** - User nhập tên dịch vụ → Hệ thống tìm kiếm
2. **Confirm** - User chọn chính xác dịch vụ
3. **Add More** - Hỏi "Có muốn chọn thêm không?"
4. **Loop** - Nếu có → lặp lại, nếu không → chuyển stage

---

## 🎯 Mục tiêu

### ✅ Multiple Selection
- Cho phép chọn nhiều dịch vụ (không giới hạn)
- Hiển thị danh sách dịch vụ đã chọn
- Tính tổng giá tự động

### ✅ Fuzzy Search
- User có thể nhập một phần tên
- Hỗ trợ tìm kiếm linh hoạt

### ✅ Add More Flow
- Sau mỗi lần chọn → hỏi "Có muốn chọn thêm không?"
- Cho phép tiếp tục hoặc kết thúc

---

## 🔄 Flow chi tiết

### Flow 1: Chọn 1 dịch vụ và kết thúc

```
User: "Massage"
  ↓
System search: Tìm thấy 2 matches
  ↓
Bot: "🔍 Tìm thấy 2 dịch vụ:
     1. Massage thư giãn - 200,000 VND
     2. Massage chân - 150,000 VND"
  ↓
User: "1"
  ↓
Bot: "✅ Đã chọn dịch vụ 'Massage thư giãn' thành công!
     
     📋 Dịch vụ đã chọn (1):
     - Massage thư giãn (200,000 VND)
     
     ❓ Bạn có muốn chọn thêm dịch vụ nào nữa không?"
  ↓
User: "không"
  ↓
[Chuyển sang stage select_voucher]
```

### Flow 2: Chọn nhiều dịch vụ

```
User: "Massage"
  ↓
Bot: [Show list...]
  ↓
User: "1" (Chọn Massage thư giãn)
  ↓
Bot: "✅ Đã chọn...
     ❓ Bạn có muốn chọn thêm không?"
  ↓
User: "có"
  ↓
Bot: "💆 Bạn muốn chọn thêm dịch vụ nào?
     1. Massage thư giãn - 200,000 VND
     2. Spa mặt - 300,000 VND
     ..."
  ↓
User: "Spa"
  ↓
Bot: "🔍 Tìm thấy:
     1. Spa mặt - 300,000 VND"
  ↓
User: "1"
  ↓
Bot: "✅ Đã chọn 'Spa mặt' thành công!
     
     📋 Dịch vụ đã chọn (2):
     - Massage thư giãn (200,000 VND)
     - Spa mặt (300,000 VND)
     
     ❓ Bạn có muốn chọn thêm không?"
  ↓
User: "không"
  ↓
[Chuyển sang stage select_voucher]
```

### Flow 3: Skip (Không chọn dịch vụ nào)

```
Bot: "💆 Bạn muốn chọn dịch vụ nào?
     1. Massage...
     2. Spa..."
  ↓
User: "không"
  ↓
Bot: "Được rồi, chuyển sang bước tiếp theo..."
  ↓
[Chuyển sang stage select_voucher]
```

### Flow 4: Search Again

```
Bot: "🔍 Tìm thấy:
     1. Dịch vụ A
     2. Dịch vụ B"
  ↓
User: "không" (Muốn tìm lại)
  ↓
Bot: "🔄 Được rồi, hãy tìm lại!
     Danh sách dịch vụ:..."
  ↓
[Back to search]
```

---

## 💻 Implementation

### 1. Session State

```python
session = {
    "stage": "select_services",
    "services": [
        {"id": "1", "name": "Massage", "price": 200000},
        {"id": "2", "name": "Spa", "price": 300000}
    ],
    "service_candidates": [],  # Danh sách tìm được
    "add_more_service": False,  # Flag cho add-more flow
}
```

### 2. Multi-Step Logic

```python
def _handle_select_services(session, query):
    # Check add-more flow
    if session.get("add_more_service"):
        if query == "có":
            # Continue adding
            return show_service_list()
        elif query == "không":
            # Done, move to next stage
            session["stage"] = "select_voucher"
    
    # Normal flow: search → select
    candidates = session.get("service_candidates", [])
    if candidates:
        return _handle_service_selection()
    else:
        return _handle_service_search()
```

### 3. Add More Handler

```python
def _handle_service_add_more(session, selected_service):
    # Add to services list
    session["services"].append(selected_service)
    
    # Set add_more flag
    session["add_more_service"] = True
    
    # Show confirmation and ask
    return ChatResponse(
        answer=f"✅ Đã chọn '{selected_service['name']}'!\n\n"
               f"📋 Dịch vụ đã chọn ({len(session['services'])}):\n"
               f"{format_services(session['services'])}\n\n"
               f"❓ Bạn có muốn chọn thêm không?"
    )
```

---

## 🧪 Test Scenarios

### Scenario 1: ✅ Add Single Service

```
User: "Massage"
Bot: [Show 2 matches]

User: "1"
Bot: "✅ Đã chọn 'Massage thư giãn'!
     ❓ Có muốn chọn thêm không?"

User: "không" ✅
Bot: [Move to voucher stage]
```

### Scenario 2: ✅ Add Multiple Services

```
User: "Massage"
→ Select "1"
Bot: "❓ Có muốn chọn thêm?"

User: "có" ✅
Bot: "💆 Muốn chọn thêm dịch vụ nào?"

User: "Spa"
→ Select "1"
Bot: "✅ Đã chọn 'Spa mặt'! (2 dịch vụ)
     ❓ Có muốn chọn thêm?"

User: "không" ✅
Bot: [Move to voucher stage]
```

### Scenario 3: ❌ Skip Services

```
Bot: "💆 Bạn muốn chọn dịch vụ nào?"

User: "không" ✅
Bot: [Move to voucher stage with empty services]
```

### Scenario 4: ❌ Invalid Selection

```
User: "Massage"
Bot: "🔍 Tìm thấy 2:
     1. Massage A
     2. Massage B"

User: "5" ❌
Bot: "❌ Lựa chọn không hợp lệ.
     Vui lòng nhập 1 hoặc 2"
```

### Scenario 5: ✅ Search Not Found → Retry

```
User: "XYZ123" ❌
Bot: "❌ Không tìm thấy 'XYZ123'.
     Danh sách dịch vụ:
     1. Massage...
     2. Spa..."

User: "Massage" ✅
Bot: [Show matches]
```

---

## 📊 State Machine

```
[select_services stage]
         │
         ├─ Query empty → Show initial list
         │
         ├─ add_more_service = True
         │         │
         │         ├─ User: "có" → Clear flag, back to SEARCH
         │         └─ User: "không" → Clear flag, move to voucher
         │
         ├─ No candidates → SEARCH
         │         │
         │         ├─ Found 0 → Show all, stay in SEARCH
         │         ├─ Found 1 → Set candidates → SELECTION
         │         └─ Found N → Set candidates → SELECTION
         │
         └─ Has candidates → SELECTION
                   │
                   ├─ Valid number → Add service → ASK_MORE
                   ├─ Valid name → Add service → ASK_MORE
                   ├─ "không" → Clear candidates → SEARCH
                   └─ Invalid → Error, stay in SELECTION

[ASK_MORE state]
         │
         ├─ "có" → set add_more_service=True, back to SEARCH
         └─ "không" → move to next stage (voucher)
```

---

## 📋 Validation Rules

| Input | State | Action | Result |
|-------|-------|--------|--------|
| "Massage" | SEARCH | Search, found 2 | → SELECTION |
| "1" | SELECTION | Select index 0 | → ASK_MORE |
| "có" | ASK_MORE | Continue | → SEARCH (add_more=true) |
| "không" | ASK_MORE | Done | → next_stage |
| "không" | SEARCH (initial) | Skip | → next_stage |
| "5" | SELECTION (2 items) | Invalid | → Error, stay SELECTION |

---

## 🎨 UX Features

### 1. **Running Total Display**
```
📋 Dịch vụ đã chọn (3):
- Massage thư giãn (200,000 VND)
- Spa mặt (300,000 VND)  
- Tắm trắng (400,000 VND)
Tổng: 900,000 VND
```

### 2. **Numbered List**
```
1. Massage thư giãn - 200,000 VND
2. Spa mặt - 300,000 VND
```

### 3. **Clear Instructions**
```
💡 Nhập số thứ tự hoặc tên dịch vụ
💡 Nhập 'có' để chọn thêm, 'không' để tiếp tục
```

### 4. **Progress Indicator**
```
📋 Dịch vụ đã chọn (2):
     ↑ Shows how many selected
```

---

## 🔧 Error Handling

### ❌ Off-topic trong SEARCH
```
User: "Giá bao nhiêu?"
Bot: "⚠️ Bạn hãy trả lời đúng trọng tâm!
     Vui lòng nhập tên dịch vụ..."
```

### ❌ Invalid selection
```
User: "999"
Bot: "❌ Lựa chọn không hợp lệ.
     Vui lòng chọn 1-3"
```

### ❌ Ambiguous add-more response
```
User: "maybe"
Bot: "❓ Vui lòng trả lời rõ ràng:
     'có' hoặc 'không'"
```

---

## 💡 Key Differences vs Doctor Selection

| Feature | Doctor Selection | Service Selection |
|---------|------------------|-------------------|
| Multiple | ❌ Chọn 1 | ✅ Chọn nhiều |
| Add More | ❌ Không | ✅ Có |
| Loop | ❌ Linear | ✅ Có thể lặp |
| Skip | ❌ Bắt buộc | ✅ Có thể skip |
| State | doctor_id | services[] (array) |

---

## 🚀 Benefits

### ✅ Linh hoạt
- Chọn 1 hoặc nhiều dịch vụ
- Có thể skip hoàn toàn

### ✅ Clear UX
- Hiển thị danh sách đã chọn
- Running total
- Clear confirmation

### ✅ Validation chặt
- Off-topic detection
- Invalid selection handling
- Clear error messages

### ✅ Efficient
- Fuzzy search
- Numbered selection
- Search again option

---

## 📝 Summary

### Trước khi cải tiến:
```
User nhập tên → Tìm 1 dịch vụ → Lưu → Next stage
→ ❌ Chỉ chọn được 1 dịch vụ
→ ❌ Không chính xác nếu có nhiều match
```

### Sau khi cải tiến:
```
User nhập tên → Tìm matches → Hiển thị list
→ User chọn chính xác → Confirm → "Có muốn thêm?"
→ Nếu có: lặp lại
→ Nếu không: next stage
→ ✅ Chọn được nhiều dịch vụ
→ ✅ Chính xác 100%
→ ✅ UX tốt với add-more flow
```

---

**Kết luận:** Multi-step service selection với add-more flow cho phép user chọn chính xác nhiều dịch vụ một cách linh hoạt! 💆
