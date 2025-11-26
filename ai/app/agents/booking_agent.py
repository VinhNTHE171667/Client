import logging
import uuid
from datetime import datetime, time as dtime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import text
from langchain_core.prompts import ChatPromptTemplate

from app.db.mysql_conn import get_mysql_engine
from app.schemas import ChatResponse
from app.core.model_provider import get_chat_model

logger = logging.getLogger(__name__)


# Session store (in-memory, can be replaced with Redis)
_BOOKING_SESSIONS: Dict[str, Dict[str, Any]] = {}


class BookingAgent:
	"""
	Luồng đặt lịch theo các bước:
	1. Lấy customerId từ session (hoặc yêu cầu phone/email để tra cứu)
	2. Hỏi chọn bác sĩ → lưu doctorId
	3. Hỏi khung giờ → lưu appointment_date, startTime, endTime
	4. Hỏi note (tùy chọn)
	5. Hỏi voucher (nếu có) → lưu voucherId
	6. Xác nhận → Insert appointment với status=pending
	"""

	def __init__(self) -> None:
		self._engine = get_mysql_engine()
		# Slot length default in minutes (used to compute slot start/end)
		self.SLOT_LENGTH_MINUTES = 60
		# LLM for intent validation
		self._validation_prompt = ChatPromptTemplate.from_messages([
			("system", "Bạn là trợ lý phân tích câu trả lời. Hãy trả lời 'YES' nếu câu trả lời liên quan đến câu hỏi, 'NO' nếu không liên quan."),
			("human", "Câu hỏi: {question}\nCâu trả lời: {answer}\nCó liên quan không? (YES/NO)")
		])

	def reset_session(self, session_id: str) -> None:
		"""Xóa session đặt lịch"""
		_BOOKING_SESSIONS.pop(session_id, None)

	def set_customer_id(self, session_id: str, customer_id: str) -> None:
		"""Set customerId từ authentication layer"""
		session = self._get_session(session_id)
		session["customer_id"] = customer_id
		# Lưu luôn thông tin customer để verify sau
		session["customer_info"] = self._get_customer_info(customer_id)

	def handle(self, session_id: str, query: str) -> ChatResponse:
		"""Main handler cho luồng đặt lịch"""
		session = self._get_session(session_id)
		stage = session.get("stage", "await_start")
		
		# Add user query to conversation history
		self._add_to_history(session, "user", query)

		# Stage 0: Chờ người dùng nhập "bắt đầu"
		if stage == "await_start":
			return self._handle_await_start(session, query)

		# Stage 1: Lấy customerId
		if stage == "init":
			return self._handle_init(session, query)

		# Stage 2: Chọn bác sĩ
		if stage == "select_doctor":
			return self._handle_select_doctor(session, query)

		# Stage 3: Chọn khung giờ
		if stage == "select_datetime":
			return self._handle_select_datetime(session, query)

		# Stage 4: Nhập ghi chú
		if stage == "input_note":
			return self._handle_input_note(session, query)

		# Stage 5: Chọn dịch vụ
		if stage == "select_services":
			return self._handle_select_services(session, query)

		# Stage 6: Chọn voucher
		if stage == "select_voucher":
			return self._handle_select_voucher(session, query)

		# Stage 7: Xác nhận
		if stage == "confirm":
			return self._handle_confirm(session, query)

		# Fallback
		return ChatResponse(
			answer="Đã có lỗi xảy ra. Vui lòng bắt đầu lại.",
			intent="action"
		)

	# ============ PRIVATE METHODS ============

	def _is_relevant_answer(self, question_context: str, user_answer: str) -> bool:
		"""Kiểm tra câu trả lời có liên quan đến câu hỏi không bằng LLM"""
		try:
			response = get_chat_model().invoke(
				self._validation_prompt.format_messages(
					question=question_context,
					answer=user_answer
				)
			)
			result = response.content.strip().upper()
			return "YES" in result
		except Exception as e:
			logger.warning(f"Validation LLM error: {e}, assuming relevant")
			return True

	def _get_customer_info(self, customer_id: str) -> Optional[Dict[str, Any]]:
		"""Lấy thông tin customer từ DB"""
		try:
			with self._engine.connect() as conn:
				result = conn.execute(
					text("SELECT id, full_name, phone, email FROM customer WHERE id = :id LIMIT 1"),
					{"id": customer_id}
				).fetchone()
				if result:
					return {
						"id": str(result[0]),
						"full_name": result[1],
						"phone": result[2],
						"email": result[3]
					}
		except Exception as e:
			logger.error(f"Error getting customer info: {e}")
		return None

	def _verify_customer_identity(self, customer_info: Dict[str, Any], input_phone: Optional[str], input_email: Optional[str]) -> bool:
		"""Verify phone/email nhập vào khớp với customer đang đăng nhập"""
		if not customer_info:
			return False
		
		# Normalize phone numbers (remove spaces, dashes)
		def normalize_phone(phone: Optional[str]) -> Optional[str]:
			if not phone:
				return None
			return phone.replace(" ", "").replace("-", "").strip()
		
		# Normalize email (lowercase)
		def normalize_email(email: Optional[str]) -> Optional[str]:
			if not email:
				return None
			return email.lower().strip()
		
		customer_phone = normalize_phone(customer_info.get("phone"))
		customer_email = normalize_email(customer_info.get("email"))
		input_phone_normalized = normalize_phone(input_phone)
		input_email_normalized = normalize_email(input_email)
		
		# Check if either phone or email matches
		phone_match = input_phone_normalized and customer_phone and input_phone_normalized == customer_phone
		email_match = input_email_normalized and customer_email and input_email_normalized == customer_email
		
		return phone_match or email_match

	def _get_session(self, session_id: str) -> Dict[str, Any]:
		"""Lấy hoặc tạo session mới"""
		if session_id not in _BOOKING_SESSIONS:
			_BOOKING_SESSIONS[session_id] = {
				"session_id": session_id,
				"stage": "await_start",
				"customer_id": None,
				"doctor_id": None,
				"doctor_candidates": [],  # Danh sách bác sĩ tìm được
				"appointment_date": None,
				"start_time": None,
				"end_time": None,
				"note": None,
				"services": [],
				"service_candidates": [],  # Danh sách dịch vụ tìm được
				"add_more_service": False,  # Flag để track add-more flow
				"voucher_id": None,
				"conversation_history": [],  # Track conversation for context
			}
		return _BOOKING_SESSIONS[session_id]
	
	def _add_to_history(self, session: Dict[str, Any], role: str, content: str) -> None:
		"""Add message to conversation history"""
		if "conversation_history" not in session:
			session["conversation_history"] = []
		session["conversation_history"].append({
			"role": role,  # "user" or "assistant"
			"content": content,
			"timestamp": datetime.now().isoformat()
		})
		# Keep only last 20 messages to avoid memory bloat
		if len(session["conversation_history"]) > 20:
			session["conversation_history"] = session["conversation_history"][-20:]
	
	def _get_conversation_context(self, session: Dict[str, Any], last_n: int = 5) -> str:
		"""Get last N messages for context"""
		history = session.get("conversation_history", [])
		if not history:
			return ""
		last_messages = history[-last_n:]
		return "\n".join([f"{msg['role']}: {msg['content']}" for msg in last_messages])

	# ============ STAGE HANDLERS ============

	def _handle_await_start(self, session: Dict[str, Any], query: str) -> ChatResponse:
		"""Stage 0: Chờ người dùng nhập 'bắt đầu' - CHỈ chấp nhận chính xác từ khóa"""
		query_lower = query.lower().strip()
		
		# Danh sách từ khóa được chấp nhận (phải khớp chính xác toàn bộ query)
		start_keywords = ["bắt đầu", "bat dau", "start", "begin", "ok"]
		
		# CHỈ chấp nhận nếu query khớp CHÍNH XÁC với một trong các từ khóa
		if query_lower in start_keywords:
			session["stage"] = "init"
			return ChatResponse(
				answer="✅ Tuyệt vời! Bước đầu tiên, vui lòng cung cấp số điện thoại hoặc email của bạn để tra cứu thông tin khách hàng.",
				intent="action"
			)
		else:
			return ChatResponse(
				answer="⚠️ Bạn cần nhập CHÍNH XÁC 'bắt đầu' để tiến hành đặt lịch!\n\n"
					   "💡 Các từ khóa được chấp nhận:\n"
					   "   • 'bắt đầu' (hoặc 'bat dau')\n"
					   "   • 'start'\n"
					   "   • 'begin'\n"
					   "   • 'ok'\n\n"
					   "❌ Không chấp nhận: 'không bắt đầu', 'bắt đầu nào', 'được', v.v.\n\n"
					   "Vui lòng chỉ nhập MỘT trong các từ khóa trên! 😊",
				intent="action"
			)

	def _handle_init(self, session: Dict[str, Any], query: str) -> ChatResponse:
		"""
		Stage 1: Verify phone/email khớp với customer đang đăng nhập
		CHỈ cho phép đặt lịch nếu phone/email nhập vào khớp CHÍNH XÁC với tài khoản đã đăng nhập
		"""
		# Kiểm tra câu trả lời có liên quan không
		if not self._is_relevant_answer(
			"Vui lòng cung cấp số điện thoại hoặc email của bạn để xác nhận",
			query
		):
			return ChatResponse(
				answer="⚠️ Bạn hãy trả lời đúng trọng tâm nhé!\n\n🔐 Vui lòng cung cấp số điện thoại hoặc email của bạn để xác nhận danh tính.\n\n💡 Nhập SĐT hoặc email mà bạn đã đăng ký tài khoản.",
				intent="action"
			)
		
		# Lấy customerId từ session (được set từ authentication layer)
		customer_id = session.get("customer_id")
		customer_info = session.get("customer_info")
		
		# KIỂM TRA: Phải có customer_id từ phiên đăng nhập
		if not customer_id:
			return ChatResponse(
				answer="❌ Bạn chưa đăng nhập!\n\n🔐 Vui lòng đăng nhập tài khoản trước khi đặt lịch.\n\n💡 Chỉ có thể đặt lịch khi đã đăng nhập vào hệ thống.",
				intent="action"
			)
		
		# Nếu chưa có customer_info, lấy từ DB
		if not customer_info:
			customer_info = self._get_customer_info(customer_id)
			session["customer_info"] = customer_info
			
		if not customer_info:
			return ChatResponse(
				answer="❌ Không tìm thấy thông tin tài khoản.\n\n🔐 Vui lòng đăng xuất và đăng nhập lại.",
				intent="action"
			)
		
		# Extract phone/email từ user input
		email = self._extract_email(query)
		phone = self._extract_phone(query)
		
		# VALIDATION: Phải có ít nhất email hoặc phone
		if not email and not phone:
			return ChatResponse(
				answer="❌ Không tìm thấy số điện thoại hoặc email trong câu trả lời của bạn.\n\n📞 Vui lòng nhập số điện thoại (10 số) hoặc email hợp lệ.\n\nVí dụ: 0912345678 hoặc email@example.com",
				intent="action"
			)
		
		# VALIDATION: Verify phone/email PHẢI khớp với customer đang đăng nhập
		if not self._verify_customer_identity(customer_info, phone, email):
			# Hiển thị thông tin đã đăng ký (che bớt để bảo mật)
			registered_phone = customer_info.get("phone")
			registered_email = customer_info.get("email")
			
			phone_hint = f"{registered_phone[:3]}****{registered_phone[-2:]}" if registered_phone and len(registered_phone) >= 5 else "(chưa có)"
			email_hint = f"{registered_email[:2]}****{registered_email[registered_email.find('@'):]}" if registered_email and '@' in registered_email else "(chưa có)"
			
			return ChatResponse(
				answer=f"❌ Số điện thoại hoặc email không khớp với tài khoản đã đăng nhập!\n\n🔐 Thông tin đã đăng ký:\n\n📞 SĐT: {phone_hint}\n📧 Email: {email_hint}\n\n💡 Bạn PHẢI nhập đúng SĐT hoặc email của tài khoản đang đăng nhập.\n\n⚠️ Không thể đặt lịch cho tài khoản khác!",
				intent="action"
			)
		
		# ✅ Verified! Chuyển sang chọn bác sĩ
		session["stage"] = "select_doctor"
		session["verified"] = True
		doctors = self._list_doctors()
		doctor_list = "\n".join([f"- {doc['full_name']}" for doc in doctors])
		
		return ChatResponse(
			answer=f"✅ Xác nhận thành công!\n\nChào {customer_info.get('full_name', 'bạn')}! Bạn muốn đặt lịch với bác sĩ nào?\n\n{doctor_list}\n\nVui lòng nhập tên bác sĩ bạn muốn chọn.",
			intent="action"
		)

	def _handle_select_doctor(self, session: Dict[str, Any], query: str) -> ChatResponse:
		"""Stage 2: Chọn bác sĩ (2-step: search → confirm)"""
		candidates = session.get("doctor_candidates", [])
		
		# CASE 1: Đã có candidates → user đang chọn từ danh sách
		if candidates:
			return self._handle_doctor_selection(session, query, candidates)

		# Kiểm tra câu trả lời có liên quan không
		if not self._is_relevant_answer(
			"Bạn muốn đặt lịch với bác sĩ nào? Vui lòng nhập tên bác sĩ",
			query
		):
			doctors = self._list_doctors()
			doctor_list = "\n".join([f"{i+1}. {doc['full_name']}" for i, doc in enumerate(doctors[:10])])  # Show first 10
			return ChatResponse(
				answer=f"⚠️ Bạn hãy trả lời đúng trọng tâm nhé!\n\n👨‍⚕️ Vui lòng nhập tên bác sĩ bạn muốn tìm:\n\n{doctor_list}\n{'...' if len(doctors) > 10 else ''}\n\n💡 Bạn có thể nhập một phần tên để tìm kiếm.",
				intent="action"
			)
		
		all_doctors = self._list_doctors()
		
		# CASE 2: Chưa có candidates → user đang search
		return self._handle_doctor_search(session, query, all_doctors)

	def _handle_select_datetime(self, session: Dict[str, Any], query: str) -> ChatResponse:
		"""Stage 3: Chọn khung giờ"""
		# Kiểm tra câu trả lời có liên quan không
		if not self._is_relevant_answer(
			"Bạn muốn đặt lịch vào ngày nào và khung giờ nào?",
			query
		):
			return ChatResponse(
				answer="⚠️ Bạn hãy trả lời đúng trọng tâm nhé!\n\n📅 Vui lòng cho biết bạn muốn đặt lịch vào ngày nào và khung giờ nào?\n\nVí dụ:\n- '2024-01-15 14:00'\n- 'ngày mai lúc 2 giờ chiều'\n- 'thứ 5 tuần sau lúc 10 giờ sáng'",
				intent="action"
			)
		
		# Parse datetime từ query
		dt_info = self._parse_datetime(query)
		
		if not dt_info:
			return ChatResponse(
				answer="❌ Không thể hiểu thời gian bạn nhập.\n\n📅 Vui lòng nhập theo một trong các định dạng sau:\n\n✅ Định dạng chuẩn:\n- 2024-01-15 14:00\n- 15/01/2024 14:00\n\n✅ Ngôn ngữ tự nhiên:\n- 'ngày mai lúc 2 giờ chiều'\n- 'hôm nay lúc 3 giờ'\n- 'thứ 5 lúc 10 giờ sáng'\n\n💡 Hãy thử lại với một trong các cách trên nhé!",
				intent="action"
			)
		
		appointment_date = dt_info["date"]
		requested_time = dt_info["time"]
		# Compute slot start/end based on SLOT_LENGTH_MINUTES.
		# If user provides a time inside a slot (e.g., 14:30 and slot length 60), we treat slot as 14:00-15:00.
		slot_len = timedelta(minutes=self.SLOT_LENGTH_MINUTES)
		# Compute seconds since midnight for requested time
		req_seconds = requested_time.hour * 3600 + requested_time.minute * 60 + requested_time.second
		slot_start_seconds = (req_seconds // (self.SLOT_LENGTH_MINUTES * 60)) * (self.SLOT_LENGTH_MINUTES * 60)
		hour = slot_start_seconds // 3600
		minute = (slot_start_seconds % 3600) // 60
		slot_start_time = dtime(int(hour), int(minute), 0)
		slot_end_dt = (datetime.combine(appointment_date, slot_start_time) + slot_len)
		slot_end_time = slot_end_dt.time()
		
		# Validation: Kiểm tra thời gian không được trong quá khứ
		now = datetime.now()
		appointment_datetime = datetime.combine(appointment_date, slot_start_time)
		if appointment_datetime < now:
			return ChatResponse(
				answer="❌ Thời gian đặt lịch không được trong quá khứ!\n\n⏰ Vui lòng chọn thời gian từ hiện tại trở đi.\n\nVí dụ: 'ngày mai lúc 2 giờ chiều'",
				intent="action"
			)
		
		# Validation: Chỉ cho phép đặt lịch từ 9h sáng đến 16h chiều
		if slot_start_time.hour < 9 or slot_start_time.hour >= 16:
			return ChatResponse(
				answer="❌ Chỉ cho phép đặt lịch từ 9:00 sáng đến 16:00 chiều!\n\n⏰ Giờ làm việc: 09:00 - 16:00\n\n💡 Vui lòng chọn khung giờ trong khoảng thời gian trên.\n\nVí dụ:\n- '9 giờ sáng'\n- '2 giờ chiều' (14:00)\n- '3 giờ chiều' (15:00)",
				intent="action"
			)
		
		# Kiểm tra slot có available không (use slot_start_time/slot_end_time)
		doctor_id = session["doctor_id"]
		if not self._is_slot_available(doctor_id, appointment_date, slot_start_time, slot_end_time):
			return ChatResponse(
				answer="❌ Khung giờ này bác sĩ đã có lịch hẹn rồi!\n\n🕐 Vui lòng chọn thời gian khác.\n\n💡 Gợi ý: Hãy thử khung giờ sáng (9:00-11:00) hoặc chiều (14:00-17:00).",
				intent="action"
			)
		# Save as server schema expects: appointment_date stored as start datetime,
		# and startTime/endTime stored as full timestamps when inserting.
		session["appointment_date"] = appointment_date.strftime("%Y-%m-%d")
		session["start_time"] = slot_start_time.strftime("%H:%M:%S")
		session["end_time"] = slot_end_time.strftime("%H:%M:%S")
		session["stage"] = "input_note"
		return ChatResponse(
			answer=f"Đã chọn lịch vào {appointment_date.strftime('%d/%m/%Y')} khung {slot_start_time.strftime('%H:%M')} - {slot_end_time.strftime('%H:%M')}.\n\nBạn có muốn ghi chú gì không? (Nhập 'không' nếu bỏ qua)",
			intent="action"
		)

	def _handle_input_note(self, session: Dict[str, Any], query: str) -> ChatResponse:
		"""Stage 4: Nhập ghi chú"""
		if query.strip().lower() not in ["không", "no", "skip", ""]:
			session["note"] = query.strip()
		
		session["stage"] = "select_services"
		
		return self._handle_select_services(session, "")

	def _handle_select_services(self, session: Dict[str, Any], query: str) -> ChatResponse:
		"""Stage 5: Chọn dịch vụ"""
		if query == "":
			services = self._list_services()
			if not services:
				session["stage"] = "select_voucher"
				return self._handle_select_voucher(session, "")
			
			service_list = "\n".join([f"- {s['name']} ({s['price']:,} VND)" for s in services])
			return ChatResponse(
				answer=f"💆 Bạn muốn chọn dịch vụ nào?\n\n{service_list}\n\n💡 Nhập tên dịch vụ hoặc 'không' để bỏ qua.",
				intent="action"
			)
		
		query_lower = query.strip().lower()
		
		# CHECK: Nếu đang trong flow "add_more_service" (đã chọn dịch vụ và được hỏi có muốn thêm không)
		if session.get("add_more_service"):
			# BẮT CHẶT: CHỈ chấp nhận "có" hoặc "không" - không cho phép nhập tên dịch vụ
			if query_lower in ["có", "yes", "ok"]:
				# Reset flag và hiển thị danh sách đầy đủ
				session["add_more_service"] = False
				all_services = self._list_services()
				service_list = "\n".join([f"{i+1}. {s['name']} ({s['price']:,} VND)" for i, s in enumerate(all_services)])
				return ChatResponse(
					answer=f"💆 Vui lòng chọn dịch vụ bạn muốn thêm:\n\n{service_list}\n\n💡 Nhập số thứ tự (1, 2, 3...) hoặc tên đầy đủ dịch vụ.",
					intent="action"
				)
			elif query_lower in ["không", "no", "khong"]:
				# Reset flag và chuyển sang voucher
				session["add_more_service"] = False
				session["stage"] = "select_voucher"
				return self._handle_select_voucher(session, "")
			else:
				# KHÔNG hợp lệ - yêu cầu nhập lại
				selected_list = "\n".join([f"- {s['name']} ({s['price']:,} VND)" for s in session["services"]])
				return ChatResponse(
					answer=f"❌ Lựa chọn không hợp lệ!\n\n📋 Dịch vụ đã chọn ({len(session['services'])}):\n{selected_list}\n\n❓ Bạn có muốn chọn thêm dịch vụ nào nữa không?\n\n💡 Vui lòng chỉ nhập:\n- 'có' - để chọn thêm dịch vụ\n- 'không' - để tiếp tục\n\n⚠️ KHÔNG được nhập tên dịch vụ hoặc từ khác!",
					intent="action"
				)
		
		# Xử lý "không" để bỏ qua chọn dịch vụ (khi chưa chọn dịch vụ nào)
		if query_lower in ["không", "no", "skip", ""]:
			session["stage"] = "select_voucher"
			return self._handle_select_voucher(session, "")
		
		candidates = session.get("service_candidates", [])
		if candidates:
			return self._handle_service_selection(session, query, candidates)

		# Kiểm tra câu trả lời có liên quan không
		if not self._is_relevant_answer(
			"Bạn muốn chọn dịch vụ nào?",
			query
		):
			services = self._list_services()
			service_list = "\n".join([f"- {s['name']} ({s['price']:,} VND)" for s in services])
			return ChatResponse(
				answer=f"⚠️ Bạn hãy trả lời đúng trọng tâm nhé!\n\n💆 Vui lòng chọn dịch vụ từ danh sách sau:\n\n{service_list}\n\n💡 Nhập tên dịch vụ hoặc 'không' để bỏ qua.",
				intent="action"
			)
		
		all_services = self._list_services()
		return self._handle_service_search(session, query, all_services)

	def _handle_select_voucher(self, session: Dict[str, Any], query: str) -> ChatResponse:
		"""Stage 6: Chọn voucher"""
		if query == "":
			vouchers = self._list_vouchers(session["customer_id"])
			if not vouchers:
				session["stage"] = "confirm"
				return self._generate_confirmation_message(session)
			
			voucher_list = "\n".join([f"- {v['code']} (giảm {v['discount_percent']}%)" for v in vouchers])
			return ChatResponse(
				answer=f"🎫 Bạn có voucher nào không?\n\n{voucher_list}\n\n💡 Nhập mã voucher hoặc 'không' để bỏ qua.",
				intent="action"
			)
		
		if query.strip().lower() in ["không", "no", "skip", ""]:
			session["voucher_id"] = None
			session["stage"] = "confirm"
			return self._generate_confirmation_message(session)
		
		# Kiểm tra câu trả lời có liên quan không
		if not self._is_relevant_answer(
			"Bạn có voucher nào không? Vui lòng nhập mã voucher",
			query
		):
			vouchers = self._list_vouchers(session["customer_id"])
			if vouchers:
				voucher_list = "\n".join([f"- {v['code']} (giảm {v['discount_percent']}%)" for v in vouchers])
				return ChatResponse(
					answer=f"⚠️ Bạn hãy trả lời đúng trọng tâm nhé!\n\n🎫 Vui lòng nhập mã voucher từ danh sách:\n\n{voucher_list}\n\n💡 Hoặc nhập 'không' để bỏ qua.",
					intent="action"
				)
			else:
				session["voucher_id"] = None
				session["stage"] = "confirm"
				return self._generate_confirmation_message(session)
		
		voucher = self._find_voucher_by_code(session["customer_id"], query.strip())
		if voucher:
			session["voucher_id"] = voucher["id"]
			session["stage"] = "confirm"
			return self._generate_confirmation_message(session)
		else:
			vouchers = self._list_vouchers(session["customer_id"])
			if vouchers:
				voucher_list = "\n".join([f"- {v['code']}" for v in vouchers])
				return ChatResponse(
					answer=f"❌ Không tìm thấy mã voucher '{query}' hoặc voucher đã được sử dụng.\n\n🎫 Vui lòng chọn từ danh sách:\n\n{voucher_list}\n\n💡 Hoặc nhập 'không' để bỏ qua.",
					intent="action"
				)
			else:
				return ChatResponse(
					answer="❌ Bạn không có voucher khả dụng. Bỏ qua bước này.\n\n💡 Nhập 'không' để tiếp tục.",
					intent="action"
				)

	def _handle_confirm(self, session: Dict[str, Any], query: str) -> ChatResponse:
		"""Stage 7: Xác nhận và lưu appointment"""
		# Kiểm tra câu trả lời có liên quan không
		if not self._is_relevant_answer(
			"Bạn có xác nhận đặt lịch không? Trả lời 'có' hoặc 'không'",
			query
		):
			return ChatResponse(
				answer="⚠️ Bạn hãy trả lời đúng trọng tâm nhé!\n\n✅ Bạn có xác nhận đặt lịch với thông tin trên không?\n\n💡 Vui lòng trả lời: 'có' (để xác nhận) hoặc 'không' (để hủy)",
				intent="action"
			)
		
		query_lower = query.strip().lower()
		
		# Check for negative responses
		if query_lower in ["không", "no", "hủy", "huy", "cancel", "không đồng ý"]:
			session_id = session["session_id"]
			self.reset_session(session_id)
			return ChatResponse(
				answer="❌ Đã hủy đặt lịch.\n\n💬 Bạn có thể bắt đầu lại bất cứ lúc nào bằng cách nhập 'đặt lịch'.",
				intent="action"
			)
		
		# Check for positive responses
		if query_lower not in ["có", "yes", "ok", "xác nhận", "đồng ý", "dong y", "xac nhan"]:
			return ChatResponse(
				answer="❓ Câu trả lời không rõ ràng.\n\n✅ Vui lòng trả lời:\n- 'có' hoặc 'xác nhận' - để đặt lịch\n- 'không' hoặc 'hủy' - để hủy bỏ",
				intent="action"
			)
		
		# Lưu appointment vào DB
		try:
			appointment_id = self._insert_appointment(session)
			session_id = session["session_id"]
			
			doctor = self._get_doctor_by_id(session["doctor_id"])
			doctor_name = doctor["full_name"] if doctor else "bác sĩ"
			
			response = ChatResponse(
				answer=f"✅ Đã đặt lịch thành công!\n\nMã lịch hẹn: {appointment_id}\nBác sĩ: {doctor_name}\nThời gian: {session['appointment_date']} lúc {session['start_time']}\n\nChúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.",
				intent="action",
				metadata={"appointment_id": appointment_id}
			)
			self.reset_session(session_id)
			return response
		except Exception as e:
			logger.error(f"Lỗi khi lưu appointment: {e}")
			return ChatResponse(
				answer="Đã có lỗi xảy ra khi lưu lịch hẹn. Vui lòng thử lại sau.",
				intent="action"
			)

	# ============ HELPER METHODS ============

	def _generate_confirmation_message(self, session: Dict[str, Any]) -> ChatResponse:
		"""Tạo message xác nhận trước khi lưu"""
		doctor = self._get_doctor_by_id(session["doctor_id"])
		doctor_name = doctor["full_name"] if doctor else "bác sĩ"
		
		service_text = ""
		if session.get("services"):
			service_list = [f"{s['name']} ({s['price']} VND)" for s in session["services"]]
			service_text = f"\n- Dịch vụ: {', '.join(service_list)}"
		
		voucher_text = ""
		if session.get("voucher_id"):
			voucher = self._get_voucher_by_id(session["voucher_id"])
			if voucher:
				voucher_text = f"\n- Voucher: {voucher['code']} (giảm {voucher['discount_percent']}%)"
		
		note_text = f"\n- Ghi chú: {session['note']}" if session.get("note") else ""
		
		message = f"""Xác nhận thông tin đặt lịch:

- Bác sĩ: {doctor_name}
- Thời gian: {session['appointment_date']} lúc {session['start_time']}{service_text}{voucher_text}{note_text}

Bạn có xác nhận đặt lịch không? (Nhập 'có' hoặc 'không')"""
		
		return ChatResponse(answer=message, intent="action")

	def _extract_phone(self, text: str) -> Optional[str]:
		"""Extract số điện thoại từ text"""
		import re
		# Pattern cho số điện thoại Việt Nam
		patterns = [
			r'0\d{9}',  # 10 số bắt đầu bằng 0
			r'\+84\d{9}',  # +84 + 9 số
		]
		for pattern in patterns:
			match = re.search(pattern, text)
			if match:
				return match.group(0)
		return None

	def _extract_email(self, text: str) -> Optional[str]:
		"""Extract email từ text"""
		import re
		pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
		match = re.search(pattern, text)
		return match.group(0) if match else None

	def _lookup_customer_id(self, phone: Optional[str], email: Optional[str]) -> Optional[str]:
		"""Tra cứu customerId từ phone hoặc email"""
		with self._engine.connect() as conn:
			if phone:
				result = conn.execute(
					text("SELECT id FROM customer WHERE phone = :phone LIMIT 1"),
					{"phone": phone}
				).fetchone()
				if result:
					return str(result[0])
			
			if email:
				result = conn.execute(
					text("SELECT id FROM customer WHERE email = :email LIMIT 1"),
					{"email": email}
				).fetchone()
				if result:
					return str(result[0])
		
		return None

	def _list_doctors(self) -> List[Dict[str, Any]]:
		"""Lấy danh sách bác sĩ"""
		with self._engine.connect() as conn:
			results = conn.execute(
				text("SELECT id, full_name FROM doctor WHERE isActive = 1")
			).fetchall()
			return [{"id": str(row[0]), "full_name": row[1]} for row in results]
	
	def _remove_accents(self, text: str) -> str:
		"""Loại bỏ dấu tiếng Việt"""
		import unicodedata
		text = unicodedata.normalize('NFD', text)
		text = "".join([c for c in text if unicodedata.category(c) != 'Mn'])
		return unicodedata.normalize('NFC', text)

	def _search_doctors_by_name(self, search_term: str, all_doctors: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
		"""Tìm kiếm bác sĩ theo tên (fuzzy search, không dấu)"""
		search_lower = search_term.lower().strip()
		search_no_accent = self._remove_accents(search_lower)
		
		if not search_lower:
			return []
		
		matches = []
		seen_ids = set()
		
		# 1. Tìm chính xác (có dấu)
		for doc in all_doctors:
			if doc["full_name"].lower() == search_lower:
				if doc["id"] not in seen_ids:
					matches.append(doc)
					seen_ids.add(doc["id"])
				return [doc]  # Tìm thấy chính xác, return luôn
		
		# 2. Tìm partial match (có dấu)
		for doc in all_doctors:
			name_lower = doc["full_name"].lower()
			if search_lower in name_lower:
				if doc["id"] not in seen_ids:
					matches.append(doc)
					seen_ids.add(doc["id"])
		
		# 3. Tìm partial match (không dấu)
		for doc in all_doctors:
			name_no_accent = self._remove_accents(doc["full_name"].lower())
			if search_no_accent in name_no_accent:
				if doc["id"] not in seen_ids:
					matches.append(doc)
					seen_ids.add(doc["id"])
		
		return matches

	def _handle_doctor_search(self, session: Dict[str, Any], query: str, all_doctors: List[Dict[str, Any]]) -> ChatResponse:
		"""Xử lý việc tìm kiếm bác sĩ theo tên"""
		matches = self._search_doctors_by_name(query, all_doctors)
		
		if not matches:
			# Không tìm thấy → show gợi ý
			doctor_list = "\n".join([f"{i+1}. {doc['full_name']}" for i, doc in enumerate(all_doctors[:10])])
			return ChatResponse(
				answer=f"❌ Không tìm thấy bác sĩ có tên '{query}' trong hệ thống.\n\n👨‍⚕️ Danh sách bác sĩ có sẵn:\n\n{doctor_list}\n{'...' if len(all_doctors) > 10 else ''}\n\n💡 Vui lòng nhập tên bác sĩ từ danh sách trên (có thể nhập một phần tên).",
				intent="action"
			)
		
		if len(matches) == 1:
			# Chỉ tìm thấy 1 bác sĩ → yêu cầu xác nhận
			doctor = matches[0]
			session["doctor_candidates"] = matches
			return ChatResponse(
				answer=f"🔍 Tìm thấy bác sĩ:\n\n1. {doctor['full_name']}\n\n✅ Bạn có chắc chắn muốn chọn bác sĩ này không?\n\n💡 Nhập '1' hoặc 'có' để xác nhận, 'không' để tìm lại.",
				intent="action"
			)
		
		# Tìm thấy nhiều bác sĩ → yêu cầu chọn
		session["doctor_candidates"] = matches
		doctor_list = "\n".join([f"{i+1}. {doc['full_name']}" for i, doc in enumerate(matches)])
		return ChatResponse(
			answer=f"🔍 Tìm thấy {len(matches)} bác sĩ có tên tương tự:\n\n{doctor_list}\n\n💡 Vui lòng nhập số thứ tự (1, 2, 3...) hoặc tên đầy đủ bác sĩ bạn muốn chọn.",
			intent="action"
		)
	
	def _handle_doctor_selection(self, session: Dict[str, Any], query: str, candidates: List[Dict[str, Any]]) -> ChatResponse:
		"""Xử lý việc chọn bác sĩ từ danh sách candidates"""
		query_lower = query.lower().strip()
		
		# Check if user wants to search again
		if query_lower in ["không", "no", "tìm lại", "tim lai", "search again"]:
			session["doctor_candidates"] = []
			all_doctors = self._list_doctors()
			doctor_list = "\n".join([f"{i+1}. {doc['full_name']}" for i, doc in enumerate(all_doctors[:10])])
			return ChatResponse(
				answer=f"🔄 Được rồi, hãy tìm lại nhé!\n\n👨‍⚕️ Danh sách bác sĩ:\n\n{doctor_list}\n{'...' if len(all_doctors) > 10 else ''}\n\n💡 Nhập tên bác sĩ bạn muốn tìm.",
				intent="action"
			)
		
		# CASE: Only 1 candidate → Strict validation (ONLY accept "1" or "có")
		if len(candidates) == 1:
			if query_lower in ["1", "có", "yes", "ok", "xác nhận", "xac nhan"]:
				selected_doctor = candidates[0]
				session["doctor_id"] = selected_doctor["id"]
				session["doctor_candidates"] = []  # Clear candidates
				session["stage"] = "select_datetime"
				return ChatResponse(
					answer=f"✅ Bạn đã chọn bác sĩ {selected_doctor['full_name']}.\n\n📅 Bạn muốn đặt lịch vào ngày nào và khung giờ nào?\n\nVí dụ:\n- '2024-01-15 14:00'\n- 'ngày mai lúc 2 giờ chiều'\n- 'thứ 5 tuần sau lúc 10 giờ sáng'",
					intent="action"
				)
			else:
				# Invalid input for single candidate
				doctor = candidates[0]
				return ChatResponse(
					answer=f"❌ Lựa chọn không hợp lệ.\n\n🔍 Chỉ tìm thấy 1 bác sĩ:\n\n1. {doctor['full_name']}\n\n✅ Vui lòng nhập:\n- '1' để xác nhận\n- 'có' để xác nhận\n- 'không' để tìm lại\n\n⚠️ Không chấp nhận nhập số khác ngoài '1'!",
					intent="action"
				)
		
		# CASE: Multiple candidates → Accept any valid number
		# Try to parse as number
		try:
			index = int(query_lower) - 1
			if 0 <= index < len(candidates):
				selected_doctor = candidates[index]
				session["doctor_id"] = selected_doctor["id"]
				session["doctor_candidates"] = []  # Clear candidates
				session["stage"] = "select_datetime"
				return ChatResponse(
					answer=f"✅ Bạn đã chọn bác sĩ {selected_doctor['full_name']}.\n\n📅 Bạn muốn đặt lịch vào ngày nào và khung giờ nào?\n\nVí dụ:\n- '2024-01-15 14:00'\n- 'ngày mai lúc 2 giờ chiều'\n- 'thứ 5 tuần sau lúc 10 giờ sáng'",
					intent="action"
				)
		except ValueError:
			pass
		
		# Try to match by name
		for i, doc in enumerate(candidates):
			if doc["full_name"].lower() == query_lower or query_lower in doc["full_name"].lower():
				session["doctor_id"] = doc["id"]
				session["doctor_candidates"] = []  # Clear candidates
				session["stage"] = "select_datetime"
				return ChatResponse(
					answer=f"✅ Bạn đã chọn bác sĩ {doc['full_name']}.\n\n📅 Bạn muốn đặt lịch vào ngày nào và khung giờ nào?\n\nVí dụ:\n- '2024-01-15 14:00'\n- 'ngày mai lúc 2 giờ chiều'",
					intent="action"
				)
		
		# Invalid selection
		doctor_list = "\n".join([f"{i+1}. {doc['full_name']}" for i, doc in enumerate(candidates)])
		return ChatResponse(
			answer=f"❌ Lựa chọn không hợp lệ.\n\n🔍 Vui lòng chọn từ danh sách:\n\n{doctor_list}\n\n💡 Nhập số thứ tự (ví dụ: 1, 2, 3...) hoặc nhập 'không' để tìm lại.",
			intent="action"
		)
	
	def _find_doctor_by_name(self, name: str, doctors: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
		"""Tìm bác sĩ theo tên (fuzzy matching) - DEPRECATED, dùng _search_doctors_by_name thay thế"""
		name_lower = name.lower().strip()
		
		# Exact match
		for doc in doctors:
			if doc["full_name"].lower() == name_lower:
				return doc
		
		# Partial match
		for doc in doctors:
			if name_lower in doc["full_name"].lower():
				return doc
		
		return None

	def _get_doctor_by_id(self, doctor_id: str) -> Optional[Dict[str, Any]]:
		"""Lấy thông tin bác sĩ theo ID"""
		with self._engine.connect() as conn:
			result = conn.execute(
				text("SELECT id, full_name FROM doctor WHERE id = :id LIMIT 1"),
				{"id": doctor_id}
			).fetchone()
			if result:
				return {"id": str(result[0]), "full_name": result[1]}
		return None

	def _parse_datetime(self, text: str) -> Optional[Dict[str, Any]]:
		"""Parse ngày giờ từ text"""
		import re
		from datetime import date, timedelta
		text_lower = text.lower()
		# define today early because some patterns reference it
		today = date.today()
		# Pattern 1: YYYY-MM-DD HH:MM
		pattern1 = r'(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})'
		match1 = re.search(pattern1, text_lower)
		if match1:
			year, month, day, hour, minute = match1.groups()
			return {
				"date": date(int(year), int(month), int(day)),
				"time": dtime(int(hour), int(minute))
			}

		# Pattern 2: DD/MM/YYYY HH:MM
		pattern2 = r'(\d{1,2})/(\d{1,2})/(\d{4})\s+(\d{1,2}):(\d{2})'
		match2 = re.search(pattern2, text_lower)
		if match2:
			day, month, year, hour, minute = match2.groups()
			return {
				"date": date(int(year), int(month), int(day)),
				"time": dtime(int(hour), int(minute))
			}

		# Pattern 3: Vietnamese long form like '19 tháng 11 năm 2025' optionally with year
		pattern3 = r'(\d{1,2})\s*(?:tháng)\s*(\d{1,2})(?:\s*(?:năm)\s*(\d{4}))?'
		match3 = re.search(pattern3, text_lower)
		if match3:
			day, month, year = match3.groups()
			try:
				y = int(year) if year else today.year
			except Exception:
				y = today.year
			return {"date": date(int(y), int(month), int(day)), "time": dtime(9, 0)}

		# Natural language parsing for Vietnamese phrases
		today = date.today()
		base_date = None
		if any(k in text_lower for k in ["hôm nay", "hom nay", "hômnay"]):
			base_date = today
		elif any(k in text_lower for k in ["ngày mai", "ngay mai", "mai"]):
			base_date = today + timedelta(days=1)
		elif any(k in text_lower for k in ["ngày kia", "ngay kia"]):
			base_date = today + timedelta(days=2)
		elif any(k in text_lower for k in ["ngày mốt", "ngay mot", "ngay mot"]):
			base_date = today + timedelta(days=2)

		# Weekday parsing like 'thứ 5' or 'thứ năm' -> next occurrence of that weekday
		weekday_match = re.search(r'th[ứu]\s*(\d|một|hai|ba|bốn|nam|sáu|bảy|bay|7|6|5|4|3|2|1)', text_lower)
		if weekday_match and not base_date:
			w = weekday_match.group(1)
			map_words = {
				"một": 1, "1": 1, "hai": 2, "2": 2, "ba": 3, "3": 3,
				"bốn": 4, "4": 4, "năm": 5, "nam": 5, "5": 5, "sáu": 6, "6": 6,
				"bảy": 7, "bay": 7, "7": 7
			}
			wd = map_words.get(w, None)
			if wd:
				# 'thứ 2' -> Monday -> python weekday 0
				target = (wd - 2) % 7
				for i in range(1, 8):
					candidate = today + timedelta(days=i)
					if candidate.weekday() == target:
						base_date = candidate
						break

		# If still no base_date, and text contains a plain date/time word -> assume today
		if not base_date:
			if any(k in text_lower for k in ["giờ", "lúc", "hôm", "mai", "ngày", "thứ"]):
				base_date = today

		# Time parsing: patterns like 'lúc 2 giờ chiều', '2 giờ', '14:30'
		time_re = re.search(r'(?:lúc\s*)?(\d{1,2})(?:\s*(?:giờ|h|:))?(?:\s*(\d{1,2}))?(?:\s*(?:phút|p))?(?:\s*(sáng|chiều|tối|trưa|đêm))?', text_lower)
		if time_re and base_date:
			hour_s = time_re.group(1)
			min_s = time_re.group(2)
			period = time_re.group(3)
			try:
				hour = int(hour_s)
				minute = int(min_s) if min_s else 0
			except Exception:
				return None
			# Adjust hour by period
			if period:
				if period in ("chiều", "tối", "đêm") and hour < 12:
					hour = (hour % 12) + 12
				# 'trưa' -> 12, 'sáng' -> keep
			if hour == 24:
				hour = 0
			if 0 <= hour < 24 and 0 <= minute < 60:
				return {"date": base_date, "time": dtime(hour, minute)}

		# If user said only period like 'sáng', 'chiều' without hour
		if base_date:
			if "sáng" in text_lower:
				return {"date": base_date, "time": dtime(9, 0)}
			if "chiều" in text_lower:
				return {"date": base_date, "time": dtime(14, 0)}
			if any(k in text_lower for k in ["tối", "đêm"]):
				return {"date": base_date, "time": dtime(19, 0)}
			if "trưa" in text_lower:
				return {"date": base_date, "time": dtime(12, 0)}

		return None

	def _is_slot_available(self, doctor_id: str, appointment_date: Any, start_time: Any, end_time: Any) -> bool:
		"""Kiểm tra slot có available không"""
		start_datetime = datetime.combine(appointment_date, start_time)
		end_datetime = datetime.combine(appointment_date, end_time)
		
		with self._engine.connect() as conn:
			result = conn.execute(
				text("""
					SELECT COUNT(*) FROM appointment
					WHERE doctorId = :doctor_id
					AND appointment_date = :appointment_date
					AND (
						(startTime < :end_datetime AND endTime > :start_datetime)
					)
				"""),
				{
					"doctor_id": doctor_id,
					"appointment_date": appointment_date,
					"start_datetime": start_datetime,
					"end_datetime": end_datetime
				}
			).fetchone()
			
			return result[0] == 0 if result else True

	def _list_services(self) -> List[Dict[str, Any]]:
		"""Lấy danh sách dịch vụ"""
		with self._engine.connect() as conn:
			results = conn.execute(
				text("SELECT id, name, price FROM service WHERE isActive = 1")
			).fetchall()
			return [{"id": str(row[0]), "name": row[1], "price": row[2]} for row in results]
	
	def _search_services_by_name(self, search_term: str, all_services: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
		"""Tìm kiếm dịch vụ theo tên (fuzzy search, không dấu)"""
		search_lower = search_term.lower().strip()
		search_no_accent = self._remove_accents(search_lower)
		
		if not search_lower:
			return []
		
		matches = []
		seen_ids = set()
		
		# 1. Tìm chính xác (có dấu)
		for service in all_services:
			if service["name"].lower() == search_lower:
				if service["id"] not in seen_ids:
					matches.append(service)
					seen_ids.add(service["id"])
				return [service]  # Tìm thấy chính xác, return luôn
		
		# 2. Tìm partial match (có dấu)
		for service in all_services:
			name_lower = service["name"].lower()
			if search_lower in name_lower:
				if service["id"] not in seen_ids:
					matches.append(service)
					seen_ids.add(service["id"])
		
		# 3. Tìm partial match (không dấu)
		for service in all_services:
			name_no_accent = self._remove_accents(service["name"].lower())
			if search_no_accent in name_no_accent:
				if service["id"] not in seen_ids:
					matches.append(service)
					seen_ids.add(service["id"])
		
		return matches

	def _list_vouchers(self, customer_id: str) -> List[Dict[str, Any]]:
		"""Lấy danh sách voucher của customer"""
		with self._engine.connect() as conn:
			results = conn.execute(
				text("""
					SELECT v.id, v.code, v.discountPercent
					FROM voucher v
					JOIN customer_voucher cv ON v.id = cv.voucherId
					WHERE cv.customerId = :customer_id AND cv.isUsed = 0 AND v.isActive = 1
				"""),
				{"customer_id": customer_id}
			).fetchall()
			return [{"id": str(row[0]), "code": row[1], "discount_percent": row[2]} for row in results]

	def _handle_service_search(self, session: Dict[str, Any], query: str, all_services: List[Dict[str, Any]]) -> ChatResponse:
		"""Xậ lý việc tìm kiếm dịch vụ theo tên"""
		matches = self._search_services_by_name(query, all_services)
		
		if not matches:
			# Không tìm thấy → show gợi ý
			service_list = "\n".join([f"{i+1}. {s['name']} ({s['price']:,} VND)" for i, s in enumerate(all_services[:10])])
			return ChatResponse(
				answer=f"❌ Không tìm thấy dịch vụ có tên '{query}' trong hệ thống.\n\n💆 Danh sách dịch vụ có sẵn:\n\n{service_list}\n{'...' if len(all_services) > 10 else ''}\n\n💡 Vui lòng nhập tên dịch vụ từ danh sách trên (có thể nhập một phần tên).",
				intent="action"
			)
		
		if len(matches) == 1:
			# Chỉ tìm thấy 1 dịch vụ → yêu cầu xác nhận
			service = matches[0]
			session["service_candidates"] = matches
			return ChatResponse(
				answer=f"🔍 Tìm thấy dịch vụ:\n\n1. {service['name']} - {service['price']:,} VND\n\n✅ Bạn có chắc chắn muốn chọn dịch vụ này không?\n\n💡 Nhập '1' hoặc 'có' để xác nhận, 'không' để tìm lại.",
				intent="action"
			)
		
		# Tìm thấy nhiều dịch vụ → yêu cầu chọn
		session["service_candidates"] = matches
		service_list = "\n".join([f"{i+1}. {s['name']} - {s['price']:,} VND" for i, s in enumerate(matches)])
		return ChatResponse(
			answer=f"🔍 Tìm thấy {len(matches)} dịch vụ có tên tương tự:\n\n{service_list}\n\n💡 Vui lòng nhập số thứ tự (1, 2, 3...) hoặc tên đầy đủ dịch vụ bạn muốn chọn.",
			intent="action"
		)
	
	def _handle_service_selection(self, session: Dict[str, Any], query: str, candidates: List[Dict[str, Any]]) -> ChatResponse:
		"""Xử lý việc chọn dịch vụ từ danh sách candidates"""
		query_lower = query.lower().strip()
		
		# Check if user wants to search again
		if query_lower in ["không", "no", "tìm lại", "tim lai", "search again"]:
			session["service_candidates"] = []
			all_services = self._list_services()
			service_list = "\n".join([f"{i+1}. {s['name']} ({s['price']:,} VND)" for i, s in enumerate(all_services[:10])])
			return ChatResponse(
				answer=f"🔄 Được rồi, hãy tìm lại nhé!\n\n💆 Danh sách dịch vụ:\n\n{service_list}\n{'...' if len(all_services) > 10 else ''}\n\n💡 Nhập tên dịch vụ bạn muốn tìm.",
				intent="action"
			)
		
		# CASE: Only 1 candidate → Strict validation (ONLY accept "1" or "có")
		if len(candidates) == 1:
			if query_lower in ["1", "có", "yes", "ok", "xác nhận", "xac nhan"]:
				selected_service = candidates[0]
				# Thêm dịch vụ vào danh sách
				session["services"].append(selected_service)
				session["service_candidates"] = []  # Clear candidates
				# Hỏi có muốn chọn thêm không
				return self._handle_service_add_more(session, selected_service)
			else:
				# Invalid input for single candidate
				service = candidates[0]
				return ChatResponse(
					answer=f"❌ Lựa chọn không hợp lệ.\n\n🔍 Chỉ tìm thấy 1 dịch vụ:\n\n1. {service['name']} - {service['price']:,} VND\n\n✅ Vui lòng nhập:\n- '1' để xác nhận\n- 'có' để xác nhận\n- 'không' để tìm lại\n\n⚠️ Không chấp nhận nhập số khác ngoài '1'!",
					intent="action"
				)
		
		# CASE: Multiple candidates → BẮT CHẶT: CHỈ chấp nhận số thứ tự CHÍNH XÁC hoặc tên dịch vụ CHÍNH XÁC
		# Try to parse as number FIRST
		try:
			index = int(query_lower) - 1
			if 0 <= index < len(candidates):
				selected_service = candidates[index]
				# Thêm dịch vụ vào danh sách
				session["services"].append(selected_service)
				session["service_candidates"] = []  # Clear candidates
				# Hỏi có muốn chọn thêm không
				return self._handle_service_add_more(session, selected_service)
			else:
				# Số không hợp lệ
				service_list = "\n".join([f"{i+1}. {s['name']} - {s['price']:,} VND" for i, s in enumerate(candidates)])
				return ChatResponse(
					answer=f"❌ Số thứ tự không hợp lệ!\n\n🔍 Vui lòng chọn từ danh sách ({len(candidates)} dịch vụ):\n\n{service_list}\n\n💡 Nhập số từ 1 đến {len(candidates)}, hoặc nhập 'không' để tìm lại.\n\n⚠️ Bạn đã nhập: {query}",
					intent="action"
				)
		except ValueError:
			# Không phải số → kiểm tra tên dịch vụ CHÍNH XÁC
			# Tìm khớp CHÍNH XÁC tên dịch vụ (không phân biệt hoa thường)
			for i, service in enumerate(candidates):
				if service["name"].lower() == query_lower:
					# Thêm dịch vụ vào danh sách
					session["services"].append(service)
					session["service_candidates"] = []  # Clear candidates
					# Hỏi có muốn chọn thêm không
					return self._handle_service_add_more(session, service)
			
			# Không tìm thấy tên khớp CHÍNH XÁC
			service_list = "\n".join([f"{i+1}. {s['name']} - {s['price']:,} VND" for i, s in enumerate(candidates)])
			return ChatResponse(
				answer=f"❌ Tên dịch vụ không khớp chính xác!\n\n🔍 Vui lòng chọn từ danh sách:\n\n{service_list}\n\n💡 Nhập:\n- Số thứ tự (1, 2, 3...)\n- Hoặc tên CHÍNH XÁC dịch vụ\n- Hoặc 'không' để tìm lại\n\n⚠️ Bạn đã nhập: '{query}'",
				intent="action"
			)

		
		# Invalid selection
		service_list = "\n".join([f"{i+1}. {s['name']} - {s['price']:,} VND" for i, s in enumerate(candidates)])
		return ChatResponse(
			answer=f"❌ Lựa chọn không hợp lệ.\n\n🔍 Vui lòng chọn từ danh sách:\n\n{service_list}\n\n💡 Nhập số thứ tự (ví dụ: 1, 2, 3...) hoặc nhập 'không' để tìm lại.",
			intent="action"
		)
	
	def _handle_service_add_more(self, session: Dict[str, Any], selected_service: Dict[str, Any]) -> ChatResponse:
		"""Hỏi user có muốn chọn thêm dịch vụ không"""
		# Hiển thị danh sách dịch vụ đã chọn
		selected_list = "\n".join([f"- {s['name']} ({s['price']:,} VND)" for s in session["services"]])
		
		# Set flag để biết đang trong add-more flow
		session["add_more_service"] = True
		
		return ChatResponse(
			answer=f"✅ Đã chọn dịch vụ '{selected_service['name']}' thành công!\n\n📋 Dịch vụ đã chọn ({len(session['services'])}):\n{selected_list}\n\n❓ Bạn có muốn chọn thêm dịch vụ nào nữa không?\n\n💡 Nhập 'có' để chọn thêm, 'không' để tiếp tục.",
			intent="action"
		)
	
	def _find_service_by_name_or_id(self, query: str) -> Optional[Dict[str, Any]]:
		"""Tìm dịch vụ theo tên hoặc ID - DEPRECATED, dùng _search_services_by_name thay thế"""
		services = self._list_services()
		query_lower = query.lower()
		for s in services:
			if s["name"].lower() == query_lower or s["id"] == query:
				return s
		return None

	def _find_voucher_by_code(self, customer_id: str, code: str) -> Optional[Dict[str, Any]]:
		"""Tìm voucher theo mã"""
		vouchers = self._list_vouchers(customer_id)
		for v in vouchers:
			if v["code"].lower() == code.lower():
				return v
		return None

	def _get_voucher_by_id(self, voucher_id: str) -> Optional[Dict[str, Any]]:
		"""Lấy thông tin voucher theo ID"""
		with self._engine.connect() as conn:
			result = conn.execute(
				text("SELECT id, code, discountPercent FROM voucher WHERE id = :id LIMIT 1"),
				{"id": voucher_id}
			).fetchone()
			if result:
				return {
					"id": str(result[0]),
					"code": result[1],
					"discount_percent": result[2]
				}
		return None

	def _insert_appointment(self, session: Dict[str, Any]) -> str:
		"""Lưu appointment vào DB với status = pending"""
		appointment_id = str(uuid.uuid4())
		
		# Ensure appointment_date is date object
		appointment_date = session["appointment_date"]
		if isinstance(appointment_date, str):
			from datetime import datetime
			appointment_date = datetime.fromisoformat(appointment_date).date()
		
		# Ensure start_time and end_time are time objects
		start_time = session["start_time"]
		if isinstance(start_time, str):
			start_time = datetime.strptime(start_time, "%H:%M:%S").time()
		end_time = session["end_time"]
		if isinstance(end_time, str):
			end_time = datetime.strptime(end_time, "%H:%M:%S").time()
		
		start_datetime = datetime.combine(appointment_date, start_time)
		end_datetime = datetime.combine(appointment_date, end_time)
		
		# compute subtotal, voucher discount and totalAmount
		subtotal = 0
		for s in session.get("services", []):
			try:
				subtotal += float(s.get("price", 0)) * int(s.get("quantity", 1))
			except Exception:
				subtotal += 0

		# apply voucher if present
		discount = 0
		if session.get("voucher_id"):
			voucher = self._get_voucher_by_id(session["voucher_id"])
			if voucher and voucher.get("discount_percent"):
				discount = (voucher["discount_percent"] / 100.0) * subtotal

		# final total amount (round to nearest integer VND)
		try:
			total_amount = int(max(0, round(subtotal - discount)))
		except Exception:
			total_amount = 0

		# deposit kept as 0 for now (payment flow will compute deposit when needed)
		deposit_amount = 0

		with self._engine.begin() as conn:
			conn.execute(
				text("""
					INSERT INTO appointment (
						id, customerId, doctorId, appointment_date,
						startTime, endTime, note, voucherId,
						status, totalAmount, depositAmount, createdAt, updatedAt
					) VALUES (
						:id, :customer_id, :doctor_id, :appointment_date,
						:start_time, :end_time, :note, :voucher_id,
						'pending', :total_amount, :deposit_amount, NOW(), NOW()
					)
				"""),
				{
					"id": appointment_id,
					"customer_id": session["customer_id"],
					"doctor_id": session["doctor_id"],
					# store appointment_date as full timestamp (use start_datetime)
					"appointment_date": start_datetime,
					"start_time": start_datetime,
					"end_time": end_datetime,
					"note": session.get("note"),
					"voucher_id": session.get("voucher_id"),
					"total_amount": total_amount,
					"deposit_amount": deposit_amount
				}
			)
			
			# Đánh dấu voucher đã sử dụng nếu có
			if session.get("voucher_id"):
				conn.execute(
					text("UPDATE customer_voucher SET isUsed = 1, usedAt = NOW() WHERE voucherId = :voucher_id AND customerId = :customer_id"),
					{"voucher_id": session["voucher_id"], "customer_id": session["customer_id"]}
				)
			
			# Thêm services vào appointment_detail
			for service in session.get("services", []):
				conn.execute(
					text("INSERT INTO appointment_detail (id, appointmentId, serviceId, quantity, price) VALUES (:id, :appointmentId, :serviceId, 1, :price)"),
					{
						"id": str(uuid.uuid4()),
						"appointmentId": appointment_id,
						"serviceId": service["id"],
						"price": service["price"]
					}
				)
		
		return appointment_id
