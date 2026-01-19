#!/bin/bash

# Script để reload chỉ phần AI service
# Không động đến backend server, MySQL hay các service khác

echo "🔄 Đang reload AI service..."

# Stop và remove AI container
docker-compose stop ai
docker-compose rm -f ai

# Rebuild và restart AI service
docker-compose up -d --build ai

# Xem logs của AI service
echo ""
echo "✅ AI service đã được reload!"
echo "📋 Đang hiển thị logs (Ctrl+C để thoát)..."
echo ""
docker-compose logs -f ai
