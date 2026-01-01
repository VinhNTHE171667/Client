# 🔄 Hướng dẫn Reload và Debug AI Service

## 🎯 Reload riêng AI Service (không động backend)

### Cách 1: Sử dụng script tự động (Khuyến nghị)

```bash
cd /home/minhdnhe172831/SP-GenSpa
chmod +x reload_ai.sh
./reload_ai.sh
```

Script sẽ:
- Stop và remove AI container
- Rebuild và restart AI service
- Hiển thị logs real-time

### Cách 2: Reload thủ công

```bash
cd /home/minhdnhe172831/SP-GenSpa

# Stop AI service
docker-compose stop ai

# Remove AI container
docker-compose rm -f ai

# Rebuild và start AI
docker-compose up -d --build ai

# Xem logs
docker-compose logs -f ai
```

### Cách 3: Reload không build lại (nhanh hơn)

Nếu chỉ thay đổi code Python và volume mount đang hoạt động:

```bash
cd /home/minhdnhe172831/SP-GenSpa
docker-compose restart ai
docker-compose logs -f ai
```

## 🐛 Debug vấn đề Customer ID

### Chạy script debug

```bash
cd /home/minhdnhe172831/SP-GenSpa/ai
python debug_customer_id.py
```

Kết quả sẽ cho biết:
- ✅ Customer ID có được gửi đúng không
- ✅ AI service có nhận được không
- ✅ Session có lưu đúng không

### Xem logs chi tiết

```bash
# Xem tất cả logs của AI
docker-compose logs -f ai

# Chỉ xem logs về customer_id
docker-compose logs -f ai | grep -i customer

# Xem logs về authentication
docker-compose logs -f ai | grep -i auth

# Xem logs về booking flow
docker-compose logs -f ai | grep -i booking
```

## 📊 Hiểu về Session Management

### Vấn đề hiện tại

AI service lưu session trong **memory** (in-process dictionary), nên:

❌ **Khi reload AI service** → Session bị mất → `customer_id` bị mất
✅ **Backend server không bị ảnh hưởng** → User vẫn đăng nhập

### Giải pháp

**Giải pháp 1: Gửi lại customer_id mỗi request** (Đã implement)
- Frontend gửi `customer_id` trong mỗi request
- AI service set lại `customer_id` vào session mỗi lần

**Giải pháp 2: Dùng Redis cho session** (Recommend cho production)
```python
# Thay vì:
_BOOKING_SESSIONS: Dict[str, Dict[str, Any]] = {}

# Dùng:
import redis
redis_client = redis.Redis(host='redis', port=6379)
```

## 🔍 Kiểm tra trạng thái

### Kiểm tra AI service đang chạy

```bash
docker ps | grep ai
```

### Kiểm tra logs real-time

```bash
docker-compose logs -f ai
```

### Test API endpoint

```bash
# Health check
curl http://localhost:8000/health

# Test chat (cần customer_id)
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Xin chào",
    "session_id": "test-session",
    "customer_id": "1"
  }'
```

## 📝 Logs mới được thêm

Sau khi update, bạn sẽ thấy các log sau:

```
[CHAT] Session=xxx, Query='...', CustomerID=1
[AUTH] Setting customer_id=1 for session=xxx
[INTENT] Active=None, Predicted=smalltalk
[BOOKING] Set customer_id=1 for session=xxx, info={'id': '1', 'full_name': 'Nguyen Van A', ...}
[BOOKING_INIT] session_data: customer_id=1, has_info=True
[BOOKING_INIT] ✅ Customer verified: Nguyen Van A (ID: 1)
```

## ⚠️ Lưu ý

1. **Không reload toàn bộ services**: Script chỉ reload AI, không động đến MySQL, Backend, v.v.
2. **Session sẽ bị mất**: Khi reload AI, user phải bắt đầu lại cuộc hội thoại
3. **Volume mount**: Đảm bảo volume `./ai/app:/app/app` đang hoạt động để hot-reload code

## 🚀 Hot Reload (Development)

Nếu muốn hot-reload khi thay đổi code mà không cần restart:

1. Cài thêm watchdog trong Docker:
```dockerfile
RUN pip install watchdog
```

2. Thay đổi command trong docker-compose.yml:
```yaml
command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

3. Restart lần cuối:
```bash
docker-compose up -d --build ai
```

Sau đó code Python thay đổi sẽ tự động reload!
