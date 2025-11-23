import pandas as pd
import pymysql
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

def get_churn_data():
    """
    Lấy dữ liệu churn prediction từ database.
    Trả về DataFrame với thông tin khách hàng để phân tích.
    """
    try:
        connection = pymysql.connect(
            host='localhost',
            user='root',
            password='root',
            database='gen_spa',
            port=33061,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )

        with connection.cursor() as cursor:
            sql = """
            SELECT
                c.id AS customer_id,
                c.full_name,
                c.phone,
                MIN(a.appointment_date) AS first_visit,
                MAX(a.appointment_date) AS last_visit,
                COUNT(a.id) AS total_visits,
                DATEDIFF(NOW(), MAX(a.appointment_date)) AS days_since_last_visit,
                (
                    SELECT rating
                    FROM feedback f
                    JOIN appointment app ON f.appointmentId = app.id
                    WHERE app.customerId = c.id
                    ORDER BY f.createdAt DESC
                    LIMIT 1
                ) AS last_rating
            FROM customer c
            JOIN appointment a ON c.id = a.customerId
            WHERE a.status IN ('completed', 'paid')
            GROUP BY c.id, c.full_name, c.phone
            HAVING total_visits >= 2;
            """
            cursor.execute(sql)
            results = cursor.fetchall()

        connection.close()

        # Chuyển thành DataFrame
        df = pd.DataFrame(results)

        # Chuyển đổi datetime columns
        df['first_visit'] = pd.to_datetime(df['first_visit'])
        df['last_visit'] = pd.to_datetime(df['last_visit'])

        return df

    except Exception as e:
        print(f"Lỗi khi lấy dữ liệu churn: {e}")
        return pd.DataFrame()

def run_churn_prediction():
    """
    Chạy phân tích dự đoán churn dựa trên hành vi bất thường.

    Returns:
        list: Danh sách khách hàng có nguy cơ rời bỏ
    """
    try:
        df = get_churn_data()

        if df.empty:
            return []

        results = []

        for _, row in df.iterrows():
            # 1. Tính chu kỳ trung bình (Avg Gap)
            duration = (row['last_visit'] - row['first_visit']).days
            avg_gap = duration / (row['total_visits'] - 1) if row['total_visits'] > 1 else 30

            # Không để avg_gap bằng 0
            if avg_gap == 0:
                avg_gap = 7

            # 2. Xác định ngưỡng rủi ro (2.5 lần chu kỳ trung bình)
            risk_threshold = avg_gap * 2.5

            # 3. Đánh giá rủi ro
            churn_score = 0
            risk_level = "An toàn"
            reason = ""

            # Yếu tố 1: Thời gian (Quan trọng nhất)
            if row['days_since_last_visit'] > risk_threshold:
                churn_score += 80
                reason = f"Đã {row['days_since_last_visit']} ngày chưa quay lại (Thường lệ: {int(avg_gap)} ngày/lần)"

            # Yếu tố 2: Đánh giá thấp
            if pd.notna(row['last_rating']) and row['last_rating'] <= 3:
                churn_score += 20
                if reason:
                    reason += " & Đánh giá kém lần cuối"
                else:
                    reason = "Đánh giá kém lần cuối"

            # 4. Phân loại cuối cùng
            if churn_score >= 80:
                risk_level = "Nguy cơ cao"
            elif churn_score >= 50:
                risk_level = "Cần chú ý"

            # Chỉ trả về những người có nguy cơ
            if risk_level != "An toàn":
                results.append({
                    "customer_id": int(row['customer_id']),
                    "full_name": row['full_name'],
                    "phone": row['phone'] or "",
                    "days_absent": int(row['days_since_last_visit']),
                    "avg_cycle": int(avg_gap),
                    "risk_level": risk_level,
                    "reason": reason,
                    "action_suggest": "Gửi SMS Voucher" if risk_level == "Nguy cơ cao" else "Gọi điện hỏi thăm"
                })

        # Sắp xếp theo days_absent giảm dần
        return sorted(results, key=lambda x: x['days_absent'], reverse=True)

    except Exception as e:
        print(f"Lỗi khi phân tích churn: {e}")
        return []

if __name__ == "__main__":
    # Test chạy phân tích
    results = run_churn_prediction()
    print("Kết quả phân tích churn:")
    print(f"Tìm thấy {len(results)} khách hàng có nguy cơ rời bỏ")
    for result in results[:5]:  # Hiển thị 5 đầu tiên
        print(result)