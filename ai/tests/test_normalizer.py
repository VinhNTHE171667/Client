from datetime import date, time

import pytest

from app.utils import normalizer


class FixedDate(date):
    @classmethod
    def today(cls) -> "FixedDate":
        return cls(2025, 10, 29)


def test_strip_accents():
    assert normalizer.strip_accents("đặt lịch spa hẹn giờ") == "dat lich spa hen gio"


def test_parse_date_formats():
    assert normalizer.parse_date("2025-10-30") == date(2025, 10, 30)
    assert normalizer.parse_date("30/10/2025") == date(2025, 10, 30)
    assert normalizer.parse_date("30-10-2025") == date(2025, 10, 30)
    assert normalizer.parse_date("30-13-2025") is None


def test_parse_time_variants():
    assert normalizer.parse_time("17:30") == time(17, 30)
    assert normalizer.parse_time("1730") == time(17, 30)
    assert normalizer.parse_time("5h") == time(5, 0)
    assert normalizer.parse_time("abc") is None


def test_normalize_phone_and_extract():
    assert normalizer.normalize_phone("0912 791 064") == "0912791064"
    assert normalizer.normalize_phone("+84 912 791 064") == "0912791064"
    assert normalizer.normalize_phone("12345") is None
    assert normalizer.extract_phone_number("Liên hệ 0912-791-064 nhé") == "0912791064"
    assert normalizer.extract_phone_number("Không có số đâu") is None


def test_infer_date_relative(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(normalizer, "date", FixedDate)
    result = normalizer.infer_date_from_text("mai mình qua spa nhé")
    assert result == FixedDate(2025, 10, 30)
    another = normalizer.infer_date_from_text("ngày 5 tháng 11")
    assert another == FixedDate(2025, 11, 5)


def test_infer_time_from_text():
    assert normalizer.infer_time_from_text("5 giờ chiều") == time(17, 0)
    assert normalizer.infer_time_from_text("11h30 sáng") == time(11, 30)
    assert normalizer.infer_time_from_text("25 giờ") is None
