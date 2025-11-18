import re
import unicodedata
from datetime import date, datetime, time, timedelta
from typing import Optional


EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")


def strip_accents(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value)
    stripped = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    return stripped.replace("đ", "d").replace("Đ", "D")


def next_weekday(start: date, target_weekday: int) -> date:
    if not 0 <= target_weekday <= 6:
        return start
    delta = (target_weekday - start.weekday()) % 7
    if delta == 0:
        delta = 7
    return start + timedelta(days=delta)


def parse_date(value: str | None) -> date | None:
    if not value:
        return None
    stripped = value.strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(stripped, fmt).date()
        except ValueError:
            continue
    return None


def parse_time(value: str | None) -> time | None:
    if not value:
        return None
    stripped = value.strip()
    candidates = [stripped]
    digits_only = re.sub(r"\D", "", stripped)
    if len(stripped) == 5:
        candidates.append(f"{stripped}:00")
    if len(digits_only) == 4 and digits_only.isdigit():
        candidates.append(f"{digits_only[:2]}:{digits_only[2:]}")
    if "h" in stripped.lower():
        h_variant = stripped.lower().replace("h", ":")
        candidates.append(h_variant)
        if h_variant.endswith(":"):
            candidates.append(f"{h_variant}00")
    if len(stripped) in {1, 2} and stripped.isdigit():
        candidates.append(f"{stripped}:00")
    for candidate in candidates:
        for fmt in ("%H:%M", "%H:%M:%S"):
            try:
                return datetime.strptime(candidate, fmt).time()
            except ValueError:
                continue
    return None


def normalize_phone(phone: str | None) -> str | None:
    if not phone:
        return None
    digits = re.sub(r"\D", "", phone)
    if digits.startswith("84") and len(digits) >= 11:
        digits = "0" + digits[2:]
    if len(digits) in {9, 10, 11} and digits.startswith("0"):
        return digits
    return None


def extract_phone_number(text: str) -> str | None:
    for match in re.finditer(r"(?:\+?84|0)(?:[\s().-]*\d){8,10}", text):
        normalized = normalize_phone(match.group())
        if normalized:
            return normalized
    return None


def normalize_email(email: Optional[str]) -> Optional[str]:
    if not email:
        return None
    candidate = email.strip()
    return candidate.lower() if EMAIL_PATTERN.fullmatch(candidate) else None


def extract_email(text: str) -> Optional[str]:
    if not text:
        return None
    match = EMAIL_PATTERN.search(text)
    return match.group(0).lower() if match else None


def infer_date_from_text(text: str) -> date | None:
    normalized = strip_accents(text.lower())
    today = date.today()
    relative_map: dict[str, int] = {
        "hom nay": 0,
        "ngay hom nay": 0,
        "hom nay nhe": 0,
        "hom nay nha": 0,
        "ngay mai": 1,
        "mai": 1,
        "mai nhe": 1,
        "mai nha": 1,
        "mai luon": 1,
        "mai toi": 1,
        "ngay mot": 2,
        "mai kia": 2,
        "ngay kia": 2,
    }
    for key, delta in relative_map.items():
        if re.search(rf"\b{re.escape(key)}\b", normalized):
            return today + timedelta(days=delta)
    weekday_map: dict[str, int] = {
        "thu hai": 0,
        "thu ba": 1,
        "thu tu": 2,
        "thu nam": 3,
        "thu sau": 4,
        "thu bay": 5,
        "chu nhat": 6,
        "cn": 6,
    }
    for key, weekday in weekday_map.items():
        if key in normalized:
            return next_weekday(today, weekday)
    iso_match = re.search(r"(\d{4})-(\d{1,2})-(\d{1,2})", normalized)
    if iso_match:
        year, month, day = map(int, iso_match.groups())
        try:
            return date(year, month, day)
        except ValueError:
            return None
    generic_match = re.search(r"(?<!\d)(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?", normalized)
    if generic_match:
        day, month, year_str = generic_match.group(1), generic_match.group(2), generic_match.group(3)
        try:
            day_int = int(day)
            month_int = int(month)
            if year_str:
                year_int = int(year_str)
                if year_int < 100:
                    year_int += 2000
            else:
                year_int = today.year
            candidate = date(year_int, month_int, day_int)
            if not year_str and candidate < today:
                candidate = date(year_int + 1, month_int, day_int)
            return candidate
        except ValueError:
            return None
    phrase_match = re.search(
        r"ngay\s*(\d{1,2})(?:\s*thang\s*(\d{1,2}))?(?:\s*nam\s*(\d{2,4}))?",
        normalized,
    )
    if phrase_match:
        day_str, month_str, year_str = phrase_match.groups()
        try:
            day_int = int(day_str)
            month_int = int(month_str) if month_str else today.month
            if year_str:
                year_int = int(year_str)
                if year_int < 100:
                    year_int += 2000
            else:
                year_int = today.year
            candidate = date(year_int, month_int, day_int)
            if not year_str and candidate < today:
                candidate = date(year_int + 1, month_int, day_int)
            return candidate
        except ValueError:
            return None
    return None


def infer_time_from_text(text: str) -> time | None:
    normalized = strip_accents(text.lower())
    pattern = re.compile(
        r"(?<!\d)(\d{1,2})(?:[:h\.](\d{1,2}))?\s*(?:gio|g|h)?\s*(sang|trua|chieu|toi|dem|pm|am)?"
    )
    for match in pattern.finditer(normalized):
        hour = int(match.group(1))
        minute = int(match.group(2) or 0)
        meridiem = match.group(3)
        if meridiem:
            if meridiem in {"pm", "chieu", "toi", "dem", "trua"} and hour < 12:
                hour += 12
            if meridiem in {"am", "sang"} and hour == 12:
                hour = 0
        if 0 <= hour < 24 and 0 <= minute < 60:
            return time(hour, minute)
    return None
