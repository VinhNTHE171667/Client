"""
Script để debug vấn đề customer_id trong AI chatbot
Kiểm tra xem customer_id có được truyền và lưu đúng không
"""

import requests
import json

# Config
AI_API_URL = "http://localhost:8000"
TEST_SESSION_ID = "test-debug-session"
TEST_CUSTOMER_ID = "1"  # Thay bằng customer ID thực tế của bạn

def test_chat_with_customer_id():
    """Test gửi message kèm customer_id"""
    
    print("=" * 60)
    print("🔍 DEBUG: Kiểm tra customer_id trong AI chatbot")
    print("=" * 60)
    
    # Test 1: Gửi message đầu tiên với customer_id
    print("\n1️⃣ Gửi message với customer_id...")
    payload = {
        "query": "Xin chào",
        "session_id": TEST_SESSION_ID,
        "customer_id": TEST_CUSTOMER_ID
    }
    
    print(f"   Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(
            f"{AI_API_URL}/chat",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {data['answer']}")
            print(f"   Intent: {data['intent']}")
        else:
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Lỗi: {str(e)}")
    
    # Test 2: Gửi message tiếp theo để trigger đặt lịch
    print("\n2️⃣ Trigger đặt lịch...")
    payload2 = {
        "query": "Tôi muốn đặt lịch",
        "session_id": TEST_SESSION_ID,
        "customer_id": TEST_CUSTOMER_ID
    }
    
    try:
        response = requests.post(
            f"{AI_API_URL}/chat",
            json=payload2,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {data['answer'][:200]}...")
            print(f"   Intent: {data['intent']}")
        else:
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Lỗi: {str(e)}")
    
    # Test 3: Clear session
    print("\n3️⃣ Clear session...")
    try:
        response = requests.delete(f"{AI_API_URL}/chat/session/{TEST_SESSION_ID}")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✅ Session đã được xóa")
    except Exception as e:
        print(f"   ❌ Lỗi: {str(e)}")
    
    print("\n" + "=" * 60)
    print("Kiểm tra xong! Xem logs của AI service để thấy chi tiết:")
    print("docker-compose logs -f ai | grep -i customer")
    print("=" * 60)

if __name__ == "__main__":
    test_chat_with_customer_id()
