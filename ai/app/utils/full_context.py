import os
import glob
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class FullContextManager:
    """
    Load full-text docs from a folder (or a single file) and query Gemini.

    Usage:
      mgr = FullContextManager(docs_dir="/abs/path/to/folder", api_key="...")
      if mgr.is_enabled():
          answer = mgr.get_answer("Hỏi gì đó")

    This is best-effort: on any SDK / network error it returns None so callers
    can safely fallback to RAG.
    """

    def __init__(self, docs_dir: Optional[str] = None, api_key: Optional[str] = None, model_name: str = "gemini-2.5-flash"):
        self.enabled = False
        self.model_name = model_name
        self.document_text = ""
        self._chat = None
        # prefer explicit api_key param; otherwise read from environment variables
        # Do NOT hardcode API keys in source. Use env vars like GOOGLE_API_KEY or GEMINI_API_KEY.
        self._api_key = api_key or os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        # If no docs_dir passed, default to the user's specific file path
        default_path = r"D:\Desktop\Đồ án test\ai\do_an_fa25\app\data\Chi tiết dịch vụ.txt"
        self._init_docs(docs_dir or default_path)
        if self.document_text:
            self._init_genai()

    def _init_docs(self, docs_dir: Optional[str]):
        base = docs_dir or os.path.join(os.path.dirname(__file__), "..", "data", "full_docs")
        base = os.path.abspath(os.path.normpath(base))
        parts = []

        # Accept either a single .txt file path or a directory containing .txt files.
        if os.path.isfile(base) and base.lower().endswith(".txt"):
            files = [base]
        elif os.path.isdir(base):
            files = sorted(glob.glob(os.path.join(base, "*.txt")))
        else:
            logger.info("FullContext: docs path not found or not readable: %s", base)
            return

        for fp in files:
            try:
                with open(fp, "r", encoding="utf-8") as f:
                    parts.append(f.read())
            except Exception as e:
                logger.warning("FullContext: can't read %s: %s", fp, e)

        self.document_text = "\n\n".join(p.strip() for p in parts if p and p.strip())

    def _init_genai(self):
        if not self._api_key:
            logger.info("FullContext: no api_key provided; manager disabled")
            return
        try:
            import google.generativeai as genai  # optional dependency

            genai.configure(api_key=self._api_key)
            model = genai.GenerativeModel(self.model_name)
            system_prompt = (
                "Bạn là trợ lý spa. CHỈ trả lời dựa trên TÀI LIỆU NỘI BỘ dưới đây. "
                "Nếu không có thông tin, trả lời: 'Xin lỗi, tôi không có thông tin ...'.\n\n"
                "--- BẮT ĐẦU TÀI LIỆU NỘI BỘ ---\n\n"
                f"{self.document_text}\n\n--- KẾT THÚC TÀI LIỆU NỘI BỘ ---"
            )
            # start a chat session seeded with the system prompt
            self._chat = model.start_chat(history=[{"role": "user", "parts": [system_prompt]}])
            self.enabled = True
            logger.info("FullContext: enabled (model=%s)", self.model_name)
        except Exception as e:
            logger.warning("FullContext: disabled due to error: %s", e)
            self.enabled = False

    def is_enabled(self) -> bool:
        return self.enabled

    def get_answer(self, query: str, timeout_sec: int = 20) -> Optional[str]:
        """
        Best-effort: return string answer or None (so caller can fallback to RAG).
        """
        if not self.enabled or not self._chat:
            return None
        try:
            resp = self._chat.send_message(query)
            # SDK response shapes vary; try common fields
            text = getattr(resp, "text", None) or (resp.get("content") if isinstance(resp, dict) else None)
            if isinstance(text, str) and text.strip():
                return text.strip()
        except Exception as e:
            logger.warning("FullContext: query failed: %s", e)
        return None
