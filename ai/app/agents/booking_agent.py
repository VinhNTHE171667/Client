import logging
import uuid
from datetime import datetime, time as dtime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import text

from app.db.mysql_conn import get_mysql_engine
from app.schemas import ChatResponse

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

	def reset_session(self, session_id: str) -> None:
		"""Xóa session đặt lịch"""
		_BOOKING_SESSIONS.pop(session_id, None)

	def set_customer_id(self, session_id: str, customer_id: str) -> None:
		"""Set customerId từ authentication layer"""
		session = self._get_session(session_id)
		session["customer_id"] = customer_id

	def handle(self, session_id: str, query: str) -> ChatResponse:
		"""Main handler cho luồng đặt lịch"""
		session = self._get_session(session_id)
		stage = session.get("stage", "await_start")

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

	def _get_session(self, session_id: str) -> Dict[str, Any]:
		"""Lấy hoặc tạo session mới"""
		if session_id not in _BOOKING_SESSIONS:
			_BOOKING_SESSIONS[session_id] = {
				"session_id": session_id,
				"stage": "await_start",
				"customer_id": None,
				"doctor_id": None,
				"appointment_date": None,
				"start_time": None,
				"end_time": None,
				"note": None,
				"services": [],
				"voucher_id": None,
			}
		return _BOOKING_SESSIONS[session_id]

	# ============ STAGE HANDLERS ============

	def _handle_await_start(self, session: Dict[str, Any], query: str) -> ChatResponse:
		"""Stage 0: Chờ người dùng nhập 'bắt đầu'"""
		query_lower = query.lower().strip()
		
		# Kiểm tra các từ khóa bắt đầu
		start_keywords = ["bắt đầu", "bat dau", "start", "begin", "bắt đầu nào", "ok", "được", "đồng ý"]
		if any(keyword in query_lower for keyword in start_keywords):
			session["stage"] = "init"
			return ChatResponse(
				answer="Tuyệt vời! Bước đầu tiên, vui lòng cung cấp số điện thoại hoặc email của bạn để tra cứu thông tin khách hàng.",
				intent="action"
			)
		else:
			return ChatResponse(
				answer="Vui lòng nhập 'bắt đầu' để tiến hành đặt lịch nhé! 😊",
				intent="action"
			)

	def _handle_init(self, session: Dict[str, Any], query: str) -> ChatResponse:
		"""
		Stage 1: Lấy customerId từ session (giả sử đã có sẵn từ authentication)
		Nếu có customerId → chuyển thẳng sang chọn bác sĩ
		"""
		# Lấy customerId từ session (được set từ authentication layer)
		customer_id = session.get("customer_id")
		# Nếu user vừa nhập email hoặc phone ở bước init, cố gắng tra cứu
		if not customer_id and query and query.strip():
			email = self._extract_email(query)
			phone = self._extract_phone(query)
			if email or phone:
				found = self._lookup_customer_id(phone=phone, email=email)
				if found:
					customer_id = found
					session["customer_id"] = customer_id
				else:
					# Nếu không tìm thấy customer, tạo mới (demo convenience)
					new_id = str(uuid.uuid4())
					full_name = None
					with self._engine.begin() as conn:
						conn.execute(
							text("INSERT INTO customer (id, full_name, email, phone, createdAt, updatedAt, isActive) VALUES (:id, :full_name, :email, :phone, NOW(), NOW(), 1)"),
							{"id": new_id, "full_name": full_name or 'Khách mới', "email": email, "phone": phone}
						)
					session["customer_id"] = new_id
					customer_id = new_id

		# Nếu vẫn chưa có customer_id, fallback: lấy customer đầu tiên (demo)
		if not customer_id:
			with self._engine.connect() as conn:
				result = conn.execute(
					text("SELECT id FROM customer LIMIT 1")
				).fetchone()
				if result:
					customer_id = str(result[0])
					session["customer_id"] = customer_id
				else:
					return ChatResponse(
						answer="Không tìm thấy thông tin khách hàng trong hệ thống. Vui lòng liên hệ quản trị viên.",
						intent="action"
					)

		# Đã có customerId → chuyển sang chọn bác sĩ
		session["stage"] = "select_doctor"
		doctors = self._list_doctors()
		doctor_list = "\n".join([f"- {doc['full_name']}" for doc in doctors])
		
		return ChatResponse(
			answer=f"Chào mừng bạn! Bạn muốn đặt lịch với bác sĩ nào?\n\n{doctor_list}\n\nVui lòng nhập tên bác sĩ bạn muốn chọn.",
			intent="action"
		)

	def _handle_select_doctor(self, session: Dict[str, Any], query: str) -> ChatResponse:
		"""Stage 2: Chọn bác sĩ"""
		doctors = self._list_doctors()
		doctor = self._find_doctor_by_name(query, doctors)
		
		if not doctor:
			doctor_list = "\n".join([f"- {doc['full_name']}" for doc in doctors])
			return ChatResponse(
				answer=f"Không tìm thấy bác sĩ '{query}'. Vui lòng chọn từ danh sách:\n\n{doctor_list}",
				intent="action"
			)
		
		session["doctor_id"] = doctor["id"]
		session["stage"] = "select_datetime"
		
		return ChatResponse(
			answer=f"Bạn đã chọn bác sĩ {doctor['full_name']}.\n\nBạn muốn đặt lịch vào ngày nào và khung giờ nào?\nVí dụ: '2024-01-15 14:00' hoặc 'ngày mai lúc 2 giờ chiều'",
			intent="action"
		)

	def _handle_select_datetime(self, session: Dict[str, Any], query: str) -> ChatResponse:
		"""Stage 3: Chọn khung giờ"""
		# Parse datetime từ query
		dt_info = self._parse_datetime(query)
		
		if not dt_info:
			return ChatResponse(
				answer="Không hiểu thời gian bạn nhập. Vui lòng nhập theo định dạng:\n- YYYY-MM-DD HH:MM (ví dụ: 2024-01-15 14:00)\n- Hoặc: 'ngày mai lúc 2 giờ chiều'",
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
		
		# Kiểm tra slot có available không (use slot_start_time/slot_end_time)
		doctor_id = session["doctor_id"]
		if not self._is_slot_available(doctor_id, appointment_date, slot_start_time, slot_end_time):
			return ChatResponse(
				answer="Khung giờ này bác sĩ đã có lịch hẹn. Vui lòng chọn thời gian khác.",
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
			
			service_list = "\n".join([f"- {s['name']}" for s in services])
			return ChatResponse(
				answer=f"Bạn muốn chọn dịch vụ nào? (Nhập tên hoặc ID dịch vụ, hoặc 'không' để bỏ qua)\n\n{service_list}",
				intent="action"
			)
		
		if query.strip().lower() in ["không", "no", "skip", ""]:
			session["services"] = []
			session["stage"] = "select_voucher"
			return self._handle_select_voucher(session, "")
		
		service = self._find_service_by_name_or_id(query.strip())
		if service:
			session["services"] = [service]  # List for future multiple services
			session["stage"] = "select_voucher"
			return self._handle_select_voucher(session, "")
		else:
			return ChatResponse(
				answer="Không tìm thấy dịch vụ. Vui lòng nhập lại tên hoặc ID dịch vụ.",
				intent="action"
			)

	def _handle_select_voucher(self, session: Dict[str, Any], query: str) -> ChatResponse:
		"""Stage 6: Chọn voucher"""
		if query == "":
			vouchers = self._list_vouchers(session["customer_id"])
			if not vouchers:
				session["stage"] = "confirm"
				return self._generate_confirmation_message(session)
			
			voucher_list = "\n".join([f"- {v['code']} (giảm {v['discount_percent']}%)" for v in vouchers])
			return ChatResponse(
				answer=f"Bạn có voucher nào không? (Nhập mã voucher, hoặc 'không' để bỏ qua)\n\n{voucher_list}",
				intent="action"
			)
		
		if query.strip().lower() in ["không", "no", "skip", ""]:
			session["voucher_id"] = None
			session["stage"] = "confirm"
			return self._generate_confirmation_message(session)
		
		voucher = self._find_voucher_by_code(session["customer_id"], query.strip())
		if voucher:
			session["voucher_id"] = voucher["id"]
			session["stage"] = "confirm"
			return self._generate_confirmation_message(session)
		else:
			return ChatResponse(
				answer="Không tìm thấy voucher. Vui lòng nhập lại mã voucher.",
				intent="action"
			)

	def _handle_confirm(self, session: Dict[str, Any], query: str) -> ChatResponse:
		"""Stage 6: Xác nhận và lưu appointment"""
		if query.strip().lower() not in ["có", "yes", "ok", "xác nhận", "đồng ý"]:
			session_id = session["session_id"]
			self.reset_session(session_id)
			return ChatResponse(
				answer="Đã hủy đặt lịch. Bạn có thể bắt đầu lại bất cứ lúc nào.",
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

	def _find_doctor_by_name(self, name: str, doctors: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
		"""Tìm bác sĩ theo tên (fuzzy matching)"""
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

	def _find_service_by_name_or_id(self, query: str) -> Optional[Dict[str, Any]]:
		"""Tìm dịch vụ theo tên hoặc ID"""
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
