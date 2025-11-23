import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import json

# Load dữ liệu từ CSV (từ check_rfm_data.py)
df = pd.read_csv('rfm_data.csv')

print("--- Dữ liệu thô ban đầu ---")
print(df.head())

# Chuẩn hóa dữ liệu
scaler = StandardScaler()
df_scaled = scaler.fit_transform(df[['recency', 'frequency', 'monetary']])

# Chạy K-Means (K=4 như gợi ý)
kmeans = KMeans(n_clusters=4, random_state=42)
df['Cluster'] = kmeans.fit_predict(df_scaled)

# Tính trung bình nhóm để đặt tên
cluster_avg = df.groupby('Cluster')[['recency', 'frequency', 'monetary']].mean()
print("\n--- Đặc điểm trung bình các nhóm ---")
print(cluster_avg)

# Đặt tên nhóm dựa trên logic (điều chỉnh theo cluster_avg)
def name_cluster(cluster):
    avg = cluster_avg.loc[cluster]
    if avg['frequency'] > df['frequency'].quantile(0.75) and avg['monetary'] > df['monetary'].quantile(0.75):
        return 'VIP (Trung thành & Chi nhiều)'
    elif avg['recency'] > df['recency'].quantile(0.75):
        return 'Nguy cơ rời bỏ (Lâu không đến)'
    elif avg['monetary'] < df['monetary'].quantile(0.25):
        return 'Khách vãng lai (Chi ít)'
    else:
        return 'Khách tiềm năng'

df['Cluster_Name'] = df['Cluster'].apply(name_cluster)

# Xuất kết quả JSON cho Dashboard
result = df[['customer_id', 'full_name', 'Cluster', 'Cluster_Name', 'recency', 'frequency', 'monetary']]
print("\n--- Kết quả cuối cùng ---")
print(result.head())

# Lưu JSON
with open('rfm_clusters.json', 'w', encoding='utf-8') as f:
    json.dump(result.to_dict(orient='records'), f, ensure_ascii=False, indent=4)
print("✅ Đã lưu kết quả ra rfm_clusters.json")