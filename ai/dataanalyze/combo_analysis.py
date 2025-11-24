import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules
from mlxtend.preprocessing import TransactionEncoder
import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules
from mlxtend.preprocessing import TransactionEncoder
import pymysql
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env')

def get_combo_data():
    """
    Lấy dữ liệu combo từ database để phân tích Apriori.
    Trả về danh sách các giao dịch (transactions) - mỗi giao dịch là danh sách các dịch vụ được đặt cùng nhau.
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
            # Lấy dữ liệu các dịch vụ được đặt cùng nhau trong cùng một appointment
            sql = """
            SELECT
                a.appointment_id,
                GROUP_CONCAT(s.service_name ORDER BY s.service_name) as services
            FROM appointments a
            JOIN appointment_details ad ON a.appointment_id = ad.appointment_id
            JOIN services s ON ad.service_id = s.service_id
            WHERE a.status = 'completed'
            GROUP BY a.appointment_id
            HAVING COUNT(ad.service_id) > 1
            """
            cursor.execute(sql)
            results = cursor.fetchall()

        connection.close()

        # Chuyển đổi thành danh sách transactions
        transactions = []
        for row in results:
            services = row['services'].split(',')
            transactions.append(services)

        return transactions

    except Exception as e:
        print(f"Lỗi khi lấy dữ liệu combo: {e}")
        return []

def run_apriori_analysis(min_support=0.1, min_confidence=0.5):
    """
    Chạy phân tích Apriori để tìm các combo dịch vụ phổ biến.

    Args:
        min_support: Ngưỡng hỗ trợ tối thiểu (0-1)
        min_confidence: Ngưỡng độ tin cậy tối thiểu (0-1)

    Returns:
        dict: Kết quả phân tích với các combo được đề xuất
    """
    try:
        # Lấy dữ liệu transactions
        transactions = get_combo_data()

        if not transactions:
            return {
                "success": False,
                "message": "Không có đủ dữ liệu combo để phân tích",
                "recommendations": []
            }

        # Mã hóa transactions thành one-hot encoding
        te = TransactionEncoder()
        te_ary = te.fit(transactions).transform(transactions)
        df = pd.DataFrame(te_ary, columns=te.columns_)

        # Tìm frequent itemsets
        frequent_itemsets = apriori(df, min_support=min_support, use_colnames=True)

        if frequent_itemsets.empty:
            return {
                "success": False,
                "message": f"Không tìm thấy itemsets thường xuyên với min_support={min_support}",
                "recommendations": []
            }

        # Tạo association rules
        rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=min_confidence)

        if rules.empty:
            return {
                "success": False,
                "message": f"Không tìm thấy rules với min_confidence={min_confidence}",
                "recommendations": []
            }

        # Sắp xếp theo lift và confidence
        rules = rules.sort_values(['lift', 'confidence'], ascending=[False, False])

        # Tạo danh sách recommendations
        recommendations = []
        for idx, rule in rules.head(10).iterrows():  # Top 10 rules
            antecedents = list(rule['antecedents'])
            consequents = list(rule['consequents'])

            recommendation = {
                "combo": antecedents + consequents,
                "if_buy": antecedents,
                "then_recommend": consequents,
                "support": round(rule['support'], 3),
                "confidence": round(rule['confidence'], 3),
                "lift": round(rule['lift'], 3)
            }
            recommendations.append(recommendation)

        return {
            "success": True,
            "message": f"Tìm thấy {len(recommendations)} combo đề xuất",
            "total_transactions": len(transactions),
            "min_support": min_support,
            "min_confidence": min_confidence,
            "recommendations": recommendations
        }

    except Exception as e:
        return {
            "success": False,
            "message": f"Lỗi khi phân tích combo: {str(e)}",
            "recommendations": []
        }

if __name__ == "__main__":
    # Test chạy phân tích
    result = run_apriori_analysis(min_support=0.05, min_confidence=0.3)
    print("Kết quả phân tích combo:")
    print(result)