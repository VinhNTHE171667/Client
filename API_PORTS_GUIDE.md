# 🚀 API Services Port Configuration

## Tóm tắt nhanh

| Service | Port | Container | Technology | Config File |
|---------|------|-----------|------------|-------------|
| **Chatbot** | 8000 | `do_an_fa25_api` | FastAPI | `client/src/config/api.ts` |
| **Recommendation** | 8001 | `spa_recommender` | Flask | `client/src/config/api.ts` |
| **Main Backend** | 4000 | - | - | - |

## 📁 Files đã tạo/cập nhật

### 1. `client/src/config/api.ts` ⭐
File config trung tâm cho TẤT CẢ API endpoints.

**Sử dụng:**
```typescript
// Chatbot
import { CHATBOT_API_ENDPOINT } from '@/config/api';

// Recommendation
import { RECOMMENDATION_API_ENDPOINTS } from '@/config/api';
const url = RECOMMENDATION_API_ENDPOINTS.cart;
```

### 2. `client/src/config/README.md`
Documentation chi tiết về cấu trúc API, troubleshooting, và best practices.

### 3. `client/.env.example`
Template cho environment variables với chú thích rõ ràng về ports.

### 4. `client/src/features/chatbot/hooks/useChatAPI.ts` ✅
Đã update để sử dụng config tập trung.

### 5. `client/src/services/recommendation.ts` ✅
Đã update để sử dụng config tập trung.

## ⚠️ QUY TẮC VÀNG

### ✅ ĐÚNG:
```typescript
import { CHATBOT_API_ENDPOINT, RECOMMENDATION_API_ENDPOINTS } from '@/config/api';

// Chatbot
const chatUrl = CHATBOT_API_ENDPOINT;

// Recommendation
const cartRecommendationUrl = RECOMMENDATION_API_ENDPOINTS.cart;
```

### ❌ SAI:
```typescript
// KHÔNG BAO GIỜ hardcode ports!
const url = "http://localhost:8000/chat"; // SAI!
const url = "http://localhost:8001/api/recommendation/cart"; // SAI!
```

## 🔧 Khi cần thay đổi port

1. **Cập nhật Docker Compose**:
   ```yaml
   # ai/docker-compose.yml
   services:
     api:
       ports:
         - "8001:8000"  # Chatbot
     recommender:
       ports:
         - "8000:8000"  # Recommendation
   ```

2. **Cập nhật config**:
   ```typescript
   // client/src/config/api.ts
   export const CHATBOT_API_BASE_URL = "http://localhost:8001";
   export const RECOMMENDATION_API_BASE_URL = "http://localhost:8000";
   ```

3. **Restart containers**:
   ```bash
   cd ai/
   docker compose down
   docker compose up -d
   ```

## 🐛 Troubleshooting

### "Failed to fetch" error
```bash
# Check containers
docker ps

# Check logs
docker logs do_an_fa25_api      # Chatbot (8001)
docker logs spa_recommender      # Recommendation (8000)
```

### Wrong port error
1. Kiểm tra file `client/src/config/api.ts`
2. Đảm bảo import từ config, KHÔNG hardcode
3. Clear browser cache và reload

## 📝 Checklist sau mỗi lần thay đổi port

- [ ] Update `ai/docker-compose.yml`
- [ ] Update `client/src/config/api.ts`
- [ ] Update `client/.env.example` (nếu cần)
- [ ] Restart Docker containers
- [ ] Test cả chatbot VÀ recommendation
- [ ] Commit changes với message rõ ràng

---

**Lần sau không bao giờ nhầm port nữa!** 🎯
