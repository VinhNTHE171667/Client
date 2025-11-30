# 1. Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy file package.json (Vì đang ở trong folder server nên chỉ cần ./)
COPY package*.json ./

# Cài đặt toàn bộ thư viện để build
RUN npm ci

# Copy toàn bộ code
COPY . .

# Chạy lệnh build (Tạo ra thư mục dist)
RUN npm run build

# 2. Production Stage
FROM node:20-alpine

WORKDIR /app

# Cài dumb-init để quản lý process tốt hơn
RUN apk add --no-cache dumb-init

# Copy package.json và cài thư viện chạy (bỏ qua devDependencies cho nhẹ)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy thư mục dist từ bước Build sang
COPY --from=builder /app/dist ./dist

# Tạo user non-root cho an toàn (Optional)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001
USER nestjs

# Mở cổng
EXPOSE 8080

# Chạy Server
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]