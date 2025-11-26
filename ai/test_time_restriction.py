"""
Test script để kiểm tra giới hạn giờ đặt lịch (9:00 - 16:00)
Chạy: python test_time_restriction.py
"""
import requests
import time
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def chat(query: str, session_id: str) -> Dict[str, Any]:
    """Send chat message and return response"""
    response = requests.post(
        f"{BASE_URL}/chat",
        json={"query": query, "session_id": session_id}
    )
    return response.json()

def print_test(test_name: str, time_input: str, expected_result: str):
    """Print test header"""
    print(f"\n{Colors.CYAN}{'='*80}{Colors.RESET}")
    print(f"{Colors.BOLD}{test_name}{Colors.RESET}")
    print(f"{Colors.YELLOW}Thời gian nhập: {time_input}{Colors.RESET}")
    print(f"{Colors.MAGENTA}Kết quả mong đợi: {expected_result}{Colors.RESET}")

def print_result(response: Dict[str, Any], is_valid: bool, passed: bool):
    """Print test result"""
    color = Colors.GREEN if passed else Colors.RED
    status = "✅ PASS" if passed else "❌ FAIL"
    validity = "✅ Accepted" if is_valid else "❌ Rejected"
    
    print(f"{color}{status} - {validity}{Colors.RESET}")
    print(f"{Colors.BOLD}Response:{Colors.RESET}")
    print(f"{response['answer'][:300]}...")
    print(f"{Colors.CYAN}{'='*80}{Colors.RESET}")

def setup_booking_to_datetime(session_id: str):
    """Setup booking flow to datetime selection stage"""
    chat("Tôi muốn đặt lịch", session_id)
    chat("bắt đầu", session_id)
    chat("0912345678", session_id)
    chat("1", session_id)  # Select first doctor

def test_time_restriction():
    """Test time restriction (9:00 - 16:00)"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'*'*80}")
    print(f"* TEST: GIỚI HẠN GIỜ ĐẶT LỊCH (9:00 - 16:00)")
    print(f"* Testing endpoint: {BASE_URL}")
    print(f"{'*'*80}{Colors.RESET}\n")
    
    # Check backend
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code != 200:
            raise Exception("Backend not healthy")
        print(f"{Colors.GREEN}✅ Backend is running{Colors.RESET}\n")
    except Exception as e:
        print(f"{Colors.RED}❌ Cannot connect to backend at {BASE_URL}")
        print(f"Please start backend first: .\\START_BACKEND.ps1{Colors.RESET}")
        return
    
    test_cases = [
        # (test_name, time_input, should_be_accepted, description)
        ("Test 1: ❌ Trước 9 giờ sáng (8:00)", "ngày mai 8 giờ sáng", False, "Rejected - trước giờ làm việc"),
        ("Test 2: ❌ Trước 9 giờ sáng (7:30)", "ngày mai 7 giờ 30 sáng", False, "Rejected - trước giờ làm việc"),
        ("Test 3: ✅ Đúng 9 giờ sáng (boundary)", "ngày mai 9 giờ sáng", True, "Accepted - giờ bắt đầu"),
        ("Test 4: ✅ Giữa giờ làm việc (10:00)", "ngày mai 10 giờ sáng", True, "Accepted - trong giờ làm việc"),
        ("Test 5: ✅ Giữa giờ làm việc (14:00)", "ngày mai 2 giờ chiều", True, "Accepted - trong giờ làm việc"),
        ("Test 6: ✅ Giờ cuối cùng (15:00)", "ngày mai 3 giờ chiều", True, "Accepted - giờ cuối cho phép"),
        ("Test 7: ❌ Đúng 16:00 (boundary)", "ngày mai 4 giờ chiều", False, "Rejected - hết giờ làm việc"),
        ("Test 8: ❌ Sau 16:00 (17:00)", "ngày mai 5 giờ chiều", False, "Rejected - sau giờ làm việc"),
        ("Test 9: ❌ Tối (19:00)", "ngày mai 7 giờ tối", False, "Rejected - sau giờ làm việc"),
    ]
    
    results = []
    
    for i, (test_name, time_input, should_be_accepted, description) in enumerate(test_cases):
        session_id = f"test_time_{int(time.time())}_{i}"
        
        print_test(test_name, time_input, description)
        
        # Setup to datetime stage
        setup_booking_to_datetime(session_id)
        
        # Test time input
        resp = chat(time_input, session_id)
        
        # Check if accepted or rejected
        is_accepted = "đã chọn lịch" in resp['answer'].lower() or "ghi chú" in resp['answer'].lower()
        is_rejected = "chỉ cho phép" in resp['answer'].lower() or "giờ làm việc" in resp['answer'].lower()
        
        # Determine if test passed
        if should_be_accepted:
            passed = is_accepted and not is_rejected
        else:
            passed = is_rejected and not is_accepted
        
        print_result(resp, is_accepted, passed)
        results.append((test_name, passed))
        
        time.sleep(0.5)  # Small delay
    
    # Summary
    print(f"\n{Colors.BOLD}{Colors.GREEN}{'='*80}")
    print(f"# TEST SUMMARY")
    print(f"{'='*80}{Colors.RESET}\n")
    
    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)
    
    for test_name, passed in results:
        status = f"{Colors.GREEN}✅ PASS{Colors.RESET}" if passed else f"{Colors.RED}❌ FAIL{Colors.RESET}"
        print(f"{status} - {test_name}")
    
    print(f"\n{Colors.BOLD}Total: {passed_count}/{total_count} tests passed{Colors.RESET}")
    
    if passed_count == total_count:
        print(f"{Colors.GREEN}🎉 All tests passed!{Colors.RESET}\n")
    else:
        print(f"{Colors.RED}⚠️  Some tests failed. Please review the output above.{Colors.RESET}\n")

if __name__ == "__main__":
    test_time_restriction()

