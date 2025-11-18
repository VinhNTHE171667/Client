# 🧠 Chatbot Đặt Lịch Thông Minh (do_an_fa25)

## 1️⃣ Mục tiêu hệ thống

Xây dựng chatbot hỗ trợ đặt lịch hẹn dịch vụ thông minh, có khả năng:

- Hiểu ngữ cảnh hội thoại tự nhiên (Gemini 2.5 Flash)
- Đọc dữ liệu mô tả dịch vụ qua RAG (Milvus + Google Embedding)
- Truy cập realtime dữ liệu MySQL qua SQL Agent (LangChain Tool)
- Tự động cập nhật dữ liệu tĩnh qua ingestion file `.txt`

## 2️⃣ Tổng quan kiến trúc

```text
Người dùng → FastAPI /chat → Trình phân loại intent
                       ├── Booking Agent (MySQL bookingdb)
                       ├── Knowledge Agent (Milvus RAG)
                       └── Chat Agent (Smalltalk Greeting)

Gemini 2.5 Flash hỗ trợ cả bước phân loại intent và trích xuất slot.
```

### Thành phần chính

| Thành phần              | Vai trò                                          |
| ----------------------- | ------------------------------------------------ |
| **IntentClassifier**    | Nhận diện `book_slot`, `rag_query`, `smalltalk`   |
| **Booking Agent**       | Chuẩn hóa slot, ghi nhận lịch hẹn vào MySQL      |
| **Knowledge Agent**     | Chạy truy vấn RAG trên Milvus                    |
| **Chat Agent**          | Giữ hội thoại tự nhiên, hướng người dùng         |
| **Gemini 2.5 Flash**    | Nền tảng xử lý ngôn ngữ & trích xuất JSON        |
| **text-embedding-004**  | Sinh embedding phục vụ truy vấn Milvus           |
| **FastAPI**             | API entrypoint, quản lý session theo intent      |
| **MySQL + Milvus**      | Nền tảng dữ liệu realtime và tri thức            |

## 3️⃣ Cấu trúc thư mục

```text
do_an_fa25/
├── app/
│   ├── __init__.py
│   ├── main.py              # Router FastAPI + session manager
│   ├── rag_ingest.py
│   ├── agents/
│   │   ├── booking_agent.py
│   │   ├── chat_agent.py
│   │   ├── intent_classifier.py
│   │   └── rag_agent.py
│   ├── core/
│   │   └── model_provider.py
│   ├── utils/
│   │   ├── normalizer.py
│   │   └── slot_extractor.py
│   ├── data/
│   ├── vector/
│   │   └── milvus_client.py
│   └── db/
│       └── mysql_conn.py
├── tests/
│   └── test_normalizer.py
├── Dockerfile
├── README.md
├── docker-compose.yml
└── requirements.txt
```

## 4️⃣ Hướng dẫn Setup & Chạy Local

### 1️⃣ Cài đặt yêu cầu

- Python >= 3.10
- MySQL (XAMPP/WAMP/MAMP hoặc Docker)
- Milvus (local hoặc Zilliz Cloud)

### 2️⃣ Clone source & cài thư viện

```bash
git clone https://github.com/your-repo/do_an_fa25.git
cd do_an_fa25
pip install -r requirements.txt
```

### 3️⃣ Cấu hình `.env`

Tạo file `.env` tại thư mục gốc:

```
GOOGLE_API_KEY=your_google_api_key
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DB=bookingdb
MILVUS_HOST=localhost
MILVUS_PORT=19530
```

### 4️⃣ Khởi tạo MySQL với dữ liệu mẫu

Sử dụng scripts đã chuẩn hóa trong thư mục `db_for_do_an/sql`:

```powershell
# Tạo schema + seed dữ liệu
mysql -h 127.0.0.1 -u root -ppassword < ..\db_for_do_an\sql\01_schema.sql
mysql -h 127.0.0.1 -u root -ppassword < ..\db_for_do_an\sql\02_seed.sql
```

> Lưu ý: Nếu chạy MySQL bằng Docker Compose của dự án, thay host bằng `mysql` và sử dụng `docker compose exec` để import.

### 5️⃣ Khởi chạy Milvus (hoặc toàn bộ stack Docker)

```powershell
docker compose up -d milvus minio etcd
```

> Ưu tiên chạy lệnh từ thư mục gốc dự án. Muốn chạy toàn bộ API + MySQL + Milvus cùng lúc, dùng `docker compose up -d`.

### 6️⃣ Khởi tạo dữ liệu RAG

```bash
python app/rag_ingest.py
```

### 7️⃣ Chạy chatbot API

```bash
uvicorn app.main:app --reload
```

Truy cập: `http://127.0.0.1:8000/chat?query="15h hôm nay còn slot không?"`

## 5️⃣ Luồng hội thoại & các Agent

1. **IntentClassifier** nhận câu đầu tiên → trả về một trong ba intent.
2. FastAPI gán intent vào session và phát lời chào tương ứng (entry prompt).
3. Với intent `book_slot`, Booking Agent:
   - gọi Gemini để chuẩn hóa JSON slot (dịch vụ, ngày/giờ, số điện thoại…)
   - chuẩn hóa lại bằng `normalizer` (hiểu “ngày mai”, “5 giờ chiều”, v.v.)
   - ánh xạ dịch vụ, tạo khách hàng nếu cần rồi ghi `appointments` kèm snapshot `customer_name`/`customer_phone`.
4. Với intent `rag_query`, Knowledge Agent tạo embedding và truy vấn Milvus, tổng hợp câu trả lời.
5. `smalltalk` được Chat Agent xử lý nhằm dẫn hướng người dùng về hai intent chính.

## 6️⃣ Triển khai Docker

```bash
docker-compose up -d
```

## 7️⃣ Kiểm thử & vận hành

- Chạy unit test: `pytest`
- Lưu ý cài đặt: `pip install -r requirements.txt` (đã kèm `pytest`).
- Khi cập nhật schema, chạy lại `db_for_do_an/sql/01_schema.sql` và `02_seed.sql` để bổ sung hai cột `customer_name`, `customer_phone` trong bảng `appointments`.

## 8️⃣ Bảo mật & vận hành

- Bảo vệ API key trong `.env`
- Dùng parameter binding tránh SQL injection
- Log hành động agent
- Có thể thêm session memory (Redis / SQLite)

## 9️⃣ Kết luận

Hệ thống chatbot đặt lịch kết hợp RAG + SQL Agent, chạy được local hoặc Docker. Dễ bảo trì, mở rộng, và gần như miễn phí vận hành.

## 10️⃣ Chạy lại dự án (Windows PowerShell) — nhanh cho lần sau

Phần này là cheatsheet để bạn khởi động toàn bộ project nhanh trên Windows (PowerShell). Các bước copy → dán từng dòng vào PowerShell (mở nhiều terminal cho backend / frontend nếu cần).

1) (Tuỳ chọn lần đầu) Tạo & kích hoạt virtualenv

```powershell
# (chỉ cần chạy lần đầu)
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2) Chuẩn bị biến môi trường (`.env`) — tạo file `.env` ở thư mục gốc `do_an_fa25` nếu chưa có

```
GOOGLE_API_KEY=your_google_api_key
GEMINI_MODEL=gemini-2.5-flash        # có thể để không có tiền tố, code sẽ tự chuẩn hoá
EMBEDDING_MODEL=text-embedding-004   # code đã chuẩn hoá trước khi gửi request
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DB=bookingdb
MILVUS_HOST=localhost
MILVUS_PORT=19530
```

3) Khởi Docker services (Milvus, MySQL, MinIO, etcd...) — từ thư mục gốc project

```powershell
# Nếu dùng Docker Compose v2
docker compose up -d

# hoặc chỉ bật các service cần thiết
docker compose up -d milvus mysql minio etcd
```

4) Seed / import MySQL (nếu cần)

```powershell
# Nếu bạn chạy MySQL local (host=localhost)
# Tùy đường dẫn file SQL trong repo của bạn
mysql -h 127.0.0.1 -u root -ppassword < .\db_for_do_an\sql\01_schema.sql
mysql -h 127.0.0.1 -u root -ppassword < .\db_for_do_an\sql\02_seed.sql
```

5) Khởi tạo dữ liệu RAG (ingest) — sau khi Milvus đã sẵn sàng

```powershell
# active venv nếu chưa active
.\.venv\Scripts\Activate.ps1
# Chạy script ingest (sẽ sử dụng GOOGLE_API_KEY và MILVUS_* env vars)
.\.venv\Scripts\python.exe -m app.rag_ingest
```

6) Chạy backend FastAPI

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

7) Chạy Node proxy & frontend (mở 2 terminal mới hoặc tab)

```powershell
# Backend proxy (giao_dien_chat/backend)
cd .\giao_dien_chat\backend
npm install      # lần đầu, nếu đã cài thì bỏ qua
npm run dev

# Frontend (giao_dien_chat/frontend)
cd ..\frontend
npm install
npm run dev
```

8) Ports mặc định

- FastAPI: http://localhost:8000
- Node proxy: http://localhost:5050 (nếu repo có proxy)
- Vite frontend: http://localhost:5173

9) Kiểm tra nhanh khi có lỗi

- Kiểm tra Docker: `docker ps` để xác nhận Milvus / MySQL đang chạy.
- Kiểm tra port backend: `Get-NetTCPConnection -LocalPort 8000` (PowerShell).
- Kiểm tra biến môi trường: mở `.env` có đúng `GOOGLE_API_KEY` hay không.
- Nếu gặp lỗi embedding/model name: code hiện đã tự chuẩn hoá model name (tiền tố `models/`) nên chỉ cần đảm bảo `GOOGLE_API_KEY` hợp lệ.

10) Restart nhanh (khi đã từng cấu hình 1 lần)

```powershell
# 1. Start Docker services (nếu đã tắt)
docker compose up -d

# 2. Activate venv
.\.venv\Scripts\Activate.ps1

# 3. Run ingest (nếu có thay đổi file dưới app/data)
.\.venv\Scripts\python.exe -m app.rag_ingest

# 4. Start backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 5. Start frontend(s) nếu cần
cd .\giao_dien_chat\backend; npm run dev
cd ..\frontend; npm run dev
```

Ghi chú: không cần sửa code nếu chỉ muốn restart — các lỗi 500 trước đây do model name đã được chỉnh sửa trong `app/core/model_provider.py` và `app/rag_ingest.py`.
