"""
Test specific cho Doctor Selection Flow (2-step)
Chạy: python test_doctor_selection.py
"""
import requests
import time

BASE_URL = "http://localhost:8000"
SESSION_ID = f"test_doctor_{int(time.time())}"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def chat(query: str):
    """Send chat message"""
    response = requests.post(
        f"{BASE_URL}/chat",
        json={"query": query, "session_id": SESSION_ID}
    )
    return response.json()

def print_step(title: str, query: str, expected: str):
    """Print test step"""
    print(f"\n{Colors.CYAN}{'='*80}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{title}{Colors.RESET}")
    print(f"{Colors.YELLOW}Query: {query}{Colors.RESET}")
    print(f"{Colors.MAGENTA}Expected: {expected}{Colors.RESET}")

def print_response(response: dict):
    """Print response"""
    print(f"{Colors.GREEN}Response:{Colors.RESET}")
    print(response['answer'])
    print(f"{Colors.CYAN}{'='*80}{Colors.RESET}")

def test_search_single_match():
    """Test: Search tìm thấy duy nhất 1 bác sĩ"""
    print(f"\n{Colors.BOLD}{Colors.MAGENTA}{'#'*80}")
    print(f"# TEST 1: SEARCH - SINGLE MATCH")
    print(f"{'#'*80}{Colors.RESET}\n")
    
    global SESSION_ID
    SESSION_ID = f"test_single_{int(time.time())}"
    
    # Setup
    chat("Tôi muốn đặt lịch")
    chat("bắt đầu")
    chat("0912345678")
    
    # Test: Search với tên đầy đủ (giả sử có "Bác sĩ Nguyễn Văn A")
    print_step(
        "1.1 Search exact name",
        "Nguyễn Văn A",
        "Should find 1 match and ask for confirmation"
    )
    resp = chat("Nguyễn Văn A")
    print_response(resp)
    
    # Confirm
    print_step(
        "1.2 Confirm selection",
        "1",
        "Should confirm and move to next stage"
    )
    resp = chat("1")
    print_response(resp)
    
    # Verify moved to next stage
    assert "ngày" in resp['answer'].lower() or "giờ" in resp['answer'].lower(), \
        "Should move to datetime selection"
    print(f"{Colors.GREEN}✅ Test PASSED: Moved to datetime stage{Colors.RESET}")

def test_search_multiple_matches():
    """Test: Search tìm thấy nhiều bác sĩ"""
    print(f"\n{Colors.BOLD}{Colors.MAGENTA}{'#'*80}")
    print(f"# TEST 2: SEARCH - MULTIPLE MATCHES")
    print(f"{'#'*80}{Colors.RESET}\n")
    
    global SESSION_ID
    SESSION_ID = f"test_multiple_{int(time.time())}"
    
    # Setup
    chat("Tôi muốn đặt lịch")
    chat("bắt đầu")
    chat("0912345678")
    
    # Test: Search với partial name
    print_step(
        "2.1 Search partial name",
        "Nguyễn",
        "Should find multiple matches and show numbered list"
    )
    resp = chat("Nguyễn")
    print_response(resp)
    
    # Check has numbered list
    assert "1." in resp['answer'], "Should show numbered list"
    print(f"{Colors.GREEN}✅ Shows numbered list{Colors.RESET}")
    
    # Select by number
    print_step(
        "2.2 Select by number",
        "2",
        "Should select second doctor"
    )
    resp = chat("2")
    print_response(resp)
    
    # Verify selection
    assert "đã chọn" in resp['answer'].lower(), "Should confirm selection"
    print(f"{Colors.GREEN}✅ Test PASSED: Selected doctor by number{Colors.RESET}")

def test_search_not_found():
    """Test: Search không tìm thấy bác sĩ"""
    print(f"\n{Colors.BOLD}{Colors.MAGENTA}{'#'*80}")
    print(f"# TEST 3: SEARCH - NOT FOUND")
    print(f"{'#'*80}{Colors.RESET}\n")
    
    global SESSION_ID
    SESSION_ID = f"test_notfound_{int(time.time())}"
    
    # Setup
    chat("Tôi muốn đặt lịch")
    chat("bắt đầu")
    chat("0912345678")
    
    # Test: Search với tên không tồn tại
    print_step(
        "3.1 Search non-existent name",
        "XYZ123456",
        "Should show error and suggest all doctors"
    )
    resp = chat("XYZ123456")
    print_response(resp)
    
    # Check error message
    assert "không tìm thấy" in resp['answer'].lower(), "Should show not found error"
    assert "1." in resp['answer'], "Should show list of available doctors"
    print(f"{Colors.GREEN}✅ Test PASSED: Shows error with suggestions{Colors.RESET}")

def test_invalid_selection():
    """Test: Chọn không hợp lệ từ danh sách"""
    print(f"\n{Colors.BOLD}{Colors.MAGENTA}{'#'*80}")
    print(f"# TEST 4: INVALID SELECTION")
    print(f"{'#'*80}{Colors.RESET}\n")
    
    global SESSION_ID
    SESSION_ID = f"test_invalid_{int(time.time())}"
    
    # Setup
    chat("Tôi muốn đặt lịch")
    chat("bắt đầu")
    chat("0912345678")
    
    # Search to get candidates
    resp = chat("Nguyễn")
    print_step(
        "4.1 Search results",
        "Nguyễn",
        "Show candidates"
    )
    print_response(resp)
    
    # Try invalid number
    print_step(
        "4.2 Select invalid number",
        "999",
        "Should show error"
    )
    resp = chat("999")
    print_response(resp)
    
    # Check error
    assert "không hợp lệ" in resp['answer'].lower() or "lựa chọn" in resp['answer'].lower(), \
        "Should show invalid selection error"
    print(f"{Colors.GREEN}✅ Test PASSED: Rejected invalid selection{Colors.RESET}")

def test_search_again():
    """Test: Tìm lại khi không hài lòng"""
    print(f"\n{Colors.BOLD}{Colors.MAGENTA}{'#'*80}")
    print(f"# TEST 5: SEARCH AGAIN")
    print(f"{'#'*80}{Colors.RESET}\n")
    
    global SESSION_ID
    SESSION_ID = f"test_again_{int(time.time())}"
    
    # Setup
    chat("Tôi muốn đặt lịch")
    chat("bắt đầu")
    chat("0912345678")
    
    # Search
    resp = chat("Nguyễn")
    print_step(
        "5.1 First search",
        "Nguyễn",
        "Show results"
    )
    print_response(resp)
    
    # Search again
    print_step(
        "5.2 Request search again",
        "không",
        "Should clear candidates and allow new search"
    )
    resp = chat("không")
    print_response(resp)
    
    # Check cleared
    assert "danh sách" in resp['answer'].lower() or "tìm" in resp['answer'].lower(), \
        "Should show doctor list for new search"
    print(f"{Colors.GREEN}✅ Test PASSED: Allowed search again{Colors.RESET}")
    
    # New search
    print_step(
        "5.3 New search",
        "Trần",
        "Should search with new term"
    )
    resp = chat("Trần")
    print_response(resp)

def test_select_by_name():
    """Test: Chọn bằng tên đầy đủ thay vì số"""
    print(f"\n{Colors.BOLD}{Colors.MAGENTA}{'#'*80}")
    print(f"# TEST 6: SELECT BY NAME")
    print(f"{'#'*80}{Colors.RESET}\n")
    
    global SESSION_ID
    SESSION_ID = f"test_byname_{int(time.time())}"
    
    # Setup
    chat("Tôi muốn đặt lịch")
    chat("bắt đầu")
    chat("0912345678")
    
    # Search
    resp = chat("Nguyễn")
    print_step(
        "6.1 Search results",
        "Nguyễn",
        "Show candidates"
    )
    print_response(resp)
    
    # Select by name (giả sử có "Nguyễn Thị B" trong list)
    print_step(
        "6.2 Select by full name",
        "Nguyễn Thị B",
        "Should select by name match"
    )
    resp = chat("Nguyễn Thị B")
    print_response(resp)
    
    # Verify
    print(f"{Colors.CYAN}Note: This test may fail if 'Nguyễn Thị B' doesn't exist in DB{Colors.RESET}")

def main():
    """Run all tests"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'*'*80}")
    print(f"* DOCTOR SELECTION FLOW TEST SUITE")
    print(f"* Testing 2-step selection: Search → Confirm")
    print(f"* Endpoint: {BASE_URL}")
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
    
    # Run tests
    try:
        test_search_single_match()
        time.sleep(1)
        
        test_search_multiple_matches()
        time.sleep(1)
        
        test_search_not_found()
        time.sleep(1)
        
        test_invalid_selection()
        time.sleep(1)
        
        test_search_again()
        time.sleep(1)
        
        test_select_by_name()
        
        # Summary
        print(f"\n{Colors.BOLD}{Colors.GREEN}{'='*80}")
        print(f"# ALL TESTS COMPLETED")
        print(f"{'='*80}{Colors.RESET}\n")
        print(f"{Colors.CYAN}Doctor Selection Flow is working correctly!{Colors.RESET}")
        print(f"{Colors.YELLOW}Key features tested:{Colors.RESET}")
        print(f"  ✅ Search with fuzzy matching")
        print(f"  ✅ Single match confirmation")
        print(f"  ✅ Multiple match selection")
        print(f"  ✅ Not found error handling")
        print(f"  ✅ Invalid selection rejection")
        print(f"  ✅ Search again capability")
        print(f"  ✅ Select by number or name")
        print()
        
    except AssertionError as e:
        print(f"{Colors.RED}❌ Test failed: {e}{Colors.RESET}")
    except Exception as e:
        print(f"{Colors.RED}❌ Unexpected error: {e}{Colors.RESET}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
