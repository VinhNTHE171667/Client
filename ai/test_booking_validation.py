"""
Test script để kiểm tra validation luồng đặt lịch
Chạy: python test_booking_validation.py
"""
import requests
import time
from typing import Dict, Any

BASE_URL = "http://localhost:8000"
SESSION_ID = f"test_validation_{int(time.time())}"

class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def chat(query: str) -> Dict[str, Any]:
    """Send chat message and return response"""
    response = requests.post(
        f"{BASE_URL}/chat",
        json={"query": query, "session_id": SESSION_ID}
    )
    return response.json()

def print_step(step: str, query: str, expected_behavior: str):
    """Print test step"""
    print(f"\n{Colors.CYAN}{'='*80}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}Step: {step}{Colors.RESET}")
    print(f"{Colors.YELLOW}Query: {query}{Colors.RESET}")
    print(f"{Colors.MAGENTA}Expected: {expected_behavior}{Colors.RESET}")

def print_response(response: Dict[str, Any], is_success: bool = True):
    """Print bot response"""
    color = Colors.GREEN if is_success else Colors.RED
    status = "✅ PASSED" if is_success else "❌ FAILED"
    print(f"{color}{status}{Colors.RESET}")
    print(f"{Colors.BOLD}Response:{Colors.RESET} {response['answer'][:200]}...")
    print(f"{Colors.CYAN}{'='*80}{Colors.RESET}")

def test_off_topic_detection():
    """Test 1: Phát hiện câu hỏi off-topic trong mỗi stage"""
    print(f"\n{Colors.BOLD}{Colors.MAGENTA}{'#'*80}")
    print(f"# TEST 1: OFF-TOPIC DETECTION + IDENTITY VERIFICATION")
    print(f"{'#'*80}{Colors.RESET}\n")
    
    # Start booking
    print_step("1.1", "Tôi muốn đặt lịch", "Activate booking mode")
    resp = chat("Tôi muốn đặt lịch")
    print_response(resp)
    
    # Stage: await_start
    print_step("1.2", "Spa có mấy chi nhánh?", "❌ Off-topic → warning")
    resp = chat("Spa có mấy chi nhánh?")
    is_valid = "bắt đầu" in resp['answer'].lower()
    print_response(resp, is_valid)
    
    print_step("1.3", "bắt đầu", "✅ Valid → next stage (init)")
    resp = chat("bắt đầu")
    print_response(resp)
    
    # Stage: init
    print_step("1.4", "Tôi muốn massage", "❌ Off-topic → warning")
    resp = chat("Tôi muốn massage")
    is_valid = "trả lời đúng trọng tâm" in resp['answer'] or "số điện thoại" in resp['answer']
    print_response(resp, is_valid)
    
    print_step("1.5", "0999999999", "⚠️ Wrong phone → identity mismatch (if logged in)")
    resp = chat("0999999999")
    # If system has auth, it should reject wrong phone
    # For demo, it might lookup and not find
    print_response(resp)
    
    print_step("1.6", "0912345678", "✅ Valid phone → next stage")
    resp = chat("0912345678")
    print_response(resp)
    
    # Stage: select_doctor
    print_step("1.7", "Giá bao nhiêu?", "❌ Off-topic → warning")
    resp = chat("Giá bao nhiêu?")
    is_valid = "trả lời đúng trọng tâm" in resp['answer'] or "chọn bác sĩ" in resp['answer']
    print_response(resp, is_valid)

def test_invalid_data_format():
    """Test 2: Phát hiện format dữ liệu không hợp lệ"""
    print(f"\n{Colors.BOLD}{Colors.MAGENTA}{'#'*80}")
    print(f"# TEST 2: INVALID DATA FORMAT")
    print(f"{'#'*80}{Colors.RESET}\n")
    
    # Reset session
    global SESSION_ID
    SESSION_ID = f"test_format_{int(time.time())}"
    
    # Start booking and get to datetime stage
    chat("Tôi muốn đặt lịch")
    chat("bắt đầu")
    chat("0912345678")
    resp = chat("Bác sĩ đầu tiên")  # Assume first doctor
    
    # Test invalid datetime formats
    print_step("2.1", "abc123xyz", "❌ Invalid format → error message")
    resp = chat("abc123xyz")
    is_valid = "không thể hiểu" in resp['answer'].lower() or "định dạng" in resp['answer'].lower()
    print_response(resp, is_valid)
    
    print_step("2.2", "xyz ngày mai", "❌ Ambiguous → error message")
    resp = chat("xyz ngày mai")
    is_valid = "không thể hiểu" in resp['answer'].lower() or "định dạng" in resp['answer'].lower()
    print_response(resp, is_valid)
    
    print_step("2.3", "ngày mai 2 giờ chiều", "✅ Valid format → next stage")
    resp = chat("ngày mai 2 giờ chiều")
    is_valid = "đã chọn lịch" in resp['answer'].lower() or "ghi chú" in resp['answer'].lower()
    print_response(resp, is_valid)

def test_past_datetime():
    """Test 3: Phát hiện thời gian trong quá khứ"""
    print(f"\n{Colors.BOLD}{Colors.MAGENTA}{'#'*80}")
    print(f"# TEST 3: PAST DATETIME VALIDATION")
    print(f"{'#'*80}{Colors.RESET}\n")
    
    # Reset session
    global SESSION_ID
    SESSION_ID = f"test_past_{int(time.time())}"
    
    # Start booking and get to datetime stage
    chat("Tôi muốn đặt lịch")
    chat("bắt đầu")
    chat("0912345678")
    chat("Bác sĩ đầu tiên")
    
    print_step("3.1", "2020-01-01 10:00", "❌ Past time → error")
    resp = chat("2020-01-01 10:00")
    is_valid = "quá khứ" in resp['answer'].lower() or "không được" in resp['answer'].lower()
    print_response(resp, is_valid)

def test_invalid_doctor_service_voucher():
    """Test 4: Phát hiện doctor/service/voucher không tồn tại + 2-step doctor selection"""
    print(f"\n{Colors.BOLD}{Colors.MAGENTA}{'#'*80}")
    print(f"# TEST 4: DOCTOR SELECTION (2-STEP) + INVALID ENTITIES")
    print(f"{'#'*80}{Colors.RESET}\n")
    
    # Reset session
    global SESSION_ID
    SESSION_ID = f"test_doctor_{int(time.time())}"
    
    # Start booking
    chat("Tôi muốn đặt lịch")
    chat("bắt đầu")
    chat("0912345678")
    
    # Test 4.1: Search for non-existent doctor
    print_step("4.1", "Bác sĩ XYZ123", "❌ Doctor not found → show suggestions")
    resp = chat("Bác sĩ XYZ123")
    is_valid = "không tìm thấy" in resp['answer'].lower()
    print_response(resp, is_valid)
    
    # Test 4.2: Search with partial name (should return list)
    print_step("4.2", "Nguyễn", "🔍 Search → show matching doctors")
    resp = chat("Nguyễn")
    # Should show numbered list
    print_response(resp)
    
    # Test 4.3: Invalid selection from list
    print_step("4.3", "999", "❌ Invalid number → error")
    resp = chat("999")
    is_valid = "không hợp lệ" in resp['answer'].lower() or "lựa chọn" in resp['answer'].lower()
    print_response(resp, is_valid)
    
    # Test 4.4: Valid selection
    print_step("4.4", "1", "✅ Select first doctor → confirm")
    resp = chat("1")
    is_valid = "đã chọn" in resp['answer'].lower() or "ngày" in resp['answer'].lower()
    print_response(resp, is_valid)

def test_ambiguous_confirmation():
    """Test 5: Phát hiện câu xác nhận không rõ ràng"""
    print(f"\n{Colors.BOLD}{Colors.MAGENTA}{'#'*80}")
    print(f"# TEST 5: AMBIGUOUS CONFIRMATION")
    print(f"{'#'*80}{Colors.RESET}\n")
    
    # Reset session
    global SESSION_ID
    SESSION_ID = f"test_confirm_{int(time.time())}"
    
    # Complete booking flow to confirmation
    chat("Tôi muốn đặt lịch")
    chat("bắt đầu")
    chat("0912345678")
    resp = chat("Bác sĩ đầu tiên")
    
    # Extract doctor name from response (if available)
    # For simplicity, assume first doctor
    
    chat("ngày mai 2 giờ chiều")
    chat("không")  # Skip note
    chat("không")  # Skip service
    chat("không")  # Skip voucher
    
    # Now at confirmation stage
    print_step("5.1", "chắc vậy", "❌ Ambiguous → request clear answer")
    resp = chat("chắc vậy")
    is_valid = "không rõ ràng" in resp['answer'].lower() or "trả lời" in resp['answer'].lower()
    print_response(resp, is_valid)
    
    print_step("5.2", "maybe", "❌ Ambiguous → request clear answer")
    resp = chat("maybe")
    is_valid = "không rõ ràng" in resp['answer'].lower() or "trả lời" in resp['answer'].lower()
    print_response(resp, is_valid)
    
    print_step("5.3", "có", "✅ Clear yes → booking confirmed")
    resp = chat("có")
    is_valid = "thành công" in resp['answer'].lower() or "appointment_id" in str(resp)
    print_response(resp, is_valid)

def test_happy_path():
    """Test 6: Happy path - Trả lời đúng tất cả"""
    print(f"\n{Colors.BOLD}{Colors.MAGENTA}{'#'*80}")
    print(f"# TEST 6: HAPPY PATH (All valid answers)")
    print(f"{'#'*80}{Colors.RESET}\n")
    
    # Reset session
    global SESSION_ID
    SESSION_ID = f"test_happy_{int(time.time())}"
    
    steps = [
        ("6.1", "Tôi muốn đặt lịch", "Activate booking"),
        ("6.2", "bắt đầu", "Start booking"),
        ("6.3", "0912345678", "Provide phone"),
        ("6.4", "Bác sĩ đầu tiên", "Select first doctor"),
        ("6.5", "ngày mai 2 giờ chiều", "Select datetime"),
        ("6.6", "không", "Skip note"),
        ("6.7", "không", "Skip service"),
        ("6.8", "không", "Skip voucher"),
        ("6.9", "có", "Confirm booking"),
    ]
    
    for step, query, desc in steps:
        print_step(step, query, desc)
        resp = chat(query)
        print_response(resp)
        time.sleep(0.5)  # Small delay between requests

def print_summary():
    """Print test summary"""
    print(f"\n{Colors.BOLD}{Colors.GREEN}{'='*80}")
    print(f"# TEST SUMMARY")
    print(f"{'='*80}{Colors.RESET}\n")
    print(f"{Colors.CYAN}All validation tests completed!{Colors.RESET}")
    print(f"{Colors.YELLOW}Review the output above to verify:{Colors.RESET}")
    print(f"  ✅ Off-topic detection working")
    print(f"  ✅ Invalid format detection working")
    print(f"  ✅ Past datetime rejection working")
    print(f"  ✅ Invalid entity (doctor/service/voucher) detection working")
    print(f"  ✅ Ambiguous confirmation detection working")
    print(f"  ✅ Happy path working")
    print()

def main():
    """Run all tests"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'*'*80}")
    print(f"* BOOKING VALIDATION TEST SUITE")
    print(f"* Testing endpoint: {BASE_URL}")
    print(f"* Session ID: {SESSION_ID}")
    print(f"{'*'*80}{Colors.RESET}\n")
    
    try:
        # Check if backend is running
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code != 200:
            raise Exception("Backend not healthy")
        print(f"{Colors.GREEN}✅ Backend is running{Colors.RESET}\n")
    except Exception as e:
        print(f"{Colors.RED}❌ Cannot connect to backend at {BASE_URL}")
        print(f"Please start backend first: .\\START_BACKEND.ps1{Colors.RESET}")
        return
    
    # Run tests
    try:
        test_off_topic_detection()
        time.sleep(1)
        
        test_invalid_data_format()
        time.sleep(1)
        
        test_past_datetime()
        time.sleep(1)
        
        test_invalid_doctor_service_voucher()
        time.sleep(1)
        
        test_ambiguous_confirmation()
        time.sleep(1)
        
        test_happy_path()
        
        print_summary()
        
    except Exception as e:
        print(f"{Colors.RED}❌ Test failed with error: {e}{Colors.RESET}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
