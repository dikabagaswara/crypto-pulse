# 🚀 PINTU Exchange Real-Time Volatility Dashboard

Sistem Monitoring & Quantitative Volatility Detection real-time production-ready untuk koin **PINTU Exchange**, dibangun dengan **Python (FastAPI + SQLAlchemy 2.0)**, **PostgreSQL / SQLite**, dan **Next.js 14 (App Router + TailwindCSS + Recharts)**.

---

## 📌 Fitur Utama

- ⚡ **Real-Time Data Ingestion**: Mengambil data harga terbaru dari **PINTU Public API** (`https://api.pintu.co.id/v2/trade/price-changes`) secara otomatis setiap **1 menit**.
- 🧮 **Multi-Timeframe Quantitative Volatility Engine**: Menghitung Realized Volatility ($\sigma$), High-Low Range Swing %, dan Net Price Return % untuk interval **5m, 15m, 30m, dan 1h**.
- 🏆 **Composite Volatility Score**: Formula kuantitatif khusus untuk menentukan koin paling volatile secara presisi tanpa terdistorsi oleh *single price flash spike*.
- 🌐 **Real-Time WebSocket Streaming**: Pembaruan dashboard secara langsung tanpa perlu reload halaman via WebSocket (`ws://localhost:8000/api/v1/ws/live`).
- 📊 **Interactive Financial Dashboard**: Filter timeframe, instant search koin, sorting dinamis, serta modal chart historis harga menggunakan **Recharts**.
- 🐳 **Production Ready**: Mendukung **PostgreSQL** & **Docker Compose** out-of-the-box, serta fallback otomatis ke **SQLite** untuk pengujian lokal instan.

---

## 📐 Formula Matematika Quantitative Finance

Untuk setiap window $N \in \{5, 15, 30, 60\}$ menit dengan deret harga $P_0, P_1, \dots, P_{N-1}$:

1. **Log Returns / 1-Minute Percentage Returns ($r_t$)**:
   $$r_t = \frac{P_t - P_{t-1}}{P_{t-1}}$$

2. **Realized Volatility ($\sigma_N$)**:
   $$\sigma_N = \sqrt{\frac{1}{N-1} \sum_{i=1}^{N-1} (r_i - \bar{r})^2} \times 100\%$$

3. **High-Low Range Swing %**:
   $$\text{Range}_N = \frac{\max(P_{\text{window}}) - \min(P_{\text{window}})}{\min(P_{\text{window}})} \times 100\%$$

4. **Composite Volatility Score**:
   $$\text{VolScore}_N = 0.65 \times \sigma_N + 0.35 \times \text{Range}_N$$

---

## 🛠 Structure Project

```
D:\Projects\
├── backend/
│   ├── app/
│   │   ├── api/                  # REST & WebSocket endpoints
│   │   ├── services/             # PINTU API client, background fetcher & Quant engine
│   │   ├── config.py             # Pydantic Settings
│   │   ├── database.py           # Async SQLAlchemy ORM engine
│   │   ├── models.py             # Database Tables (Coin, PriceHistory, VolatilityMetric)
│   │   ├── schemas.py            # Pydantic Schemas
│   │   └── main.py               # FastAPI App entrypoint
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                     # Next.js 14 App Router + TailwindCSS + Recharts
│   ├── app/                      # Main Dashboard page & global styles
│   ├── components/               # Navbar, Overview Cards, Volatile Table, Chart Modal
│   ├── lib/                      # API client, WebSocket hook & formatters
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🚀 Cara Menjalankan Aplikasi

### Opsi A: Local Development Mode (Tanpa Docker)

#### 1. Jalankan Backend (FastAPI)
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

#### 2. Jalankan Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Buka browser di `http://localhost:3000`.

---

### Opsi B: Production Deployment via Docker Compose

Pastikan Docker Desktop aktif, lalu jalankan:
```bash
docker-compose up --build -d
```
Aplikasi akan aktif di:
- **Frontend Dashboard**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **PostgreSQL Database**: `localhost:5432`

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/v1/volatility/top?timeframe=15m&sort_by=volatility_score` | Mengambil Top Volatile Coins (5m, 15m, 30m, 1h) |
| `GET` | `/api/v1/volatility/overview` | Summary metrics & koin teratas per window |
| `GET` | `/api/v1/coins` | Daftar koin yang dipantau |
| `GET` | `/api/v1/coins/{symbol}/history?timeframe=1h` | Histori harga per menit untuk chart |
| `WS`  | `/api/v1/ws/live` | Real-time WebSocket event stream |
