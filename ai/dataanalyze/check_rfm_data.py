import pymysql
import pandas as pd
import os
from dotenv import load_dotenv

# Load env từ ai/.env
load_dotenv(dotenv_path='../.env')

DB_CONFIG = {
    "host": "localhost",
    "port": 33061,
    "user": os.getenv("MYSQL_USER", "root"),
    "password": os.getenv("MYSQL_PASSWORD", "root"),
    "database": os.getenv("MYSQL_DB", "gen_spa"),
    "charset": "utf8mb4",
}

def fetch_rfm_data():
    conn = pymysql.connect(**DB_CONFIG)
    query = """
    SELECT
        c.id AS customer_id,
        c.full_name,
        DATEDIFF(NOW(), MAX(a.appointment_date)) AS recency,
        COUNT(a.id) AS frequency,
        c.total_spent AS monetary
    FROM
        customer c
    JOIN
        appointment a ON c.id = a.customerId
    WHERE
        a.status IN ('completed', 'paid')
    GROUP BY
        c.id, c.full_name, c.total_spent
    HAVING
        monetary > 0;
    """
    df = pd.read_sql(query, conn)
    conn.close()
    return df

if __name__ == "__main__":
    print("🔍 Kiểm tra dữ liệu RFM từ DB...")
    df = fetch_rfm_data()
    print(f"📊 Số khách hàng: {len(df)}")
    print(df.head())

    # Export ra CSV để dùng cho Python script
    df.to_csv('rfm_data.csv', index=False)
    print("✅ Đã export ra rfm_data.csv")

    # Nếu ít dữ liệu, seed thêm bằng seed_appointments.py
    if len(df) < 100:
        print("⚠️ Dữ liệu ít, hãy chạy seed_appointments.py để thêm dữ liệu giả.")