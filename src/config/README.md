# API Configuration

Tất cả API endpoints được quản lý tập trung trong file `api.ts`.

## Cấu trúc Services

### 1. Chatbot API (Port 8001)
- **Container**: `do_an_fa25_api`
- **Port**: 8001
- **Technology**: FastAPI
- **Base URL**: `http://localhost:8001`
- **Endpoints**:
  - `POST /chat` - Gửi tin nhắn chat
  - `DELETE /chat/session/{sessionId}` - Xóa session

**Sử dụng**:
```typescript
import { CHATBOT_API_ENDPOINT, CHATBOT_API_BASE_URL } from '@/config/api';
```

### 2. Recommendation API (Port 8000)
- **Container**: `spa_recommender`
- **Port**: 8000
- **Technology**: Flask
- **Base URL**: `http://localhost:8000`
- **Endpoints**:
  - `GET /api/recommendation/customer/{customerId}` - Gợi ý cho khách hàng
  - `POST /api/recommendation/cart` - Gợi ý dựa trên giỏ hàng
  - `GET /api/recommendation/top-services` - Top dịch vụ phổ biến
  - `POST /api/recommendation/train` - Train AI model
  - `GET /api/recommendation/status` - Trạng thái model
  - `POST /api/recommendation/evaluate` - Đánh giá model

**Sử dụng**:
```typescript
import { RECOMMENDATION_API_BASE_URL, RECOMMENDATION_API_ENDPOINTS } from '@/config/api';

// Ví dụ:
const url = RECOMMENDATION_API_ENDPOINTS.cart;
const customerUrl = RECOMMENDATION_API_ENDPOINTS.customer('123');
```

### 3. Main Backend API (Port 4000)
- **Port**: 4000 (default)
- **Base URL**: `http://localhost:4000`

**Sử dụng**:
```typescript
import { BACKEND_API_BASE_URL } from '@/config/api';
```

## Environment Variables

Có thể override ports qua file `.env`:

```env
VITE_CHAT_API_URL=http://localhost:8001
VITE_RECOMMENDATION_API_URL=http://localhost:8000
VITE_BACKEND_API_URL=http://localhost:4000
```

## ⚠️ LƯU Ý QUAN TRỌNG

**KHÔNG BAO GIỜ** hardcode ports trực tiếp trong code!

❌ **SAI**:
```typescript
const url = "http://localhost:8000/chat"; // SAI - port này là recommendation!
```

✅ **ĐÚNG**:
```typescript
import { CHATBOT_API_ENDPOINT } from '@/config/api';
const url = CHATBOT_API_ENDPOINT;
```

## Troubleshooting

### Lỗi "Failed to fetch" khi gọi API

1. Kiểm tra Docker containers đang chạy:
   ```bash
   docker ps
   ```

2. Xác nhận ports:
   - Chatbot: Port 8001
   - Recommendation: Port 8000

3. Kiểm tra logs:
   ```bash
   docker logs do_an_fa25_api
   docker logs spa_recommender
   ```

### Thay đổi ports

1. Cập nhật `docker-compose.yml` trong folder `ai/`:
   ```yaml
   services:
     api:
       ports:
         - "8001:8000"  # host:container
     recommender:
       ports:
         - "8000:8000"
   ```

2. Cập nhật `client/src/config/api.ts`:
   ```typescript
   export const CHATBOT_API_BASE_URL = "http://localhost:8001";
   export const RECOMMENDATION_API_BASE_URL = "http://localhost:8000";
   ```

3. Rebuild containers:
   ```bash
   cd ai/
   docker compose down
   docker compose up -d
   ```
