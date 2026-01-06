#!/bin/bash
# Script để chạy benchmark trong Docker container

echo "============================================"
echo "CHẠY BENCHMARK SO SÁNH THUẬT TOÁN"
echo "============================================"
echo ""

# Kiểm tra container có đang chạy không
CONTAINER_NAME="spa_recommender"

if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "✓ Container $CONTAINER_NAME đang chạy"
    echo ""
    echo "Đang chạy benchmark trong container..."
    echo ""
    
    # Chạy benchmark trong container
    docker exec -it $CONTAINER_NAME python3 /app/benchmark_recommenders.py
    
    echo ""
    echo "============================================"
    echo "Kết quả đã được lưu vào:"
    echo "  - benchmark_results.json"
    echo "  - benchmark_report.txt"
    echo "  - comparison_chart.png"
    echo "============================================"
    
    # Copy files ra host
    echo ""
    echo "Đang copy kết quả ra host..."
    docker cp $CONTAINER_NAME:/app/benchmark_results.json ./benchmark_results.json
    docker cp $CONTAINER_NAME:/app/benchmark_report.txt ./benchmark_report.txt
    docker cp $CONTAINER_NAME:/app/comparison_chart.png ./comparison_chart.png 2>/dev/null || echo "  (Biểu đồ không tạo được - cần matplotlib)"
    
    echo "✓ Hoàn tất! Xem file benchmark_report.txt để có báo cáo chi tiết"
    
else
    echo "❌ Container $CONTAINER_NAME không chạy"
    echo ""
    echo "Vui lòng start container trước:"
    echo "  docker-compose up -d recommender"
    echo ""
    echo "Hoặc chạy local (cần cài dependencies):"
    echo "  pip install -r requirements.txt"
    echo "  python3 benchmark_recommenders.py"
fi
