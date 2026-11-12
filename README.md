# AI Traffic Voice Assistant 🚦🎙️

> **"Ask. Understand. Follow."** — An intelligent, multilingual, multimodal platform for traffic e-challan inquiries, statutory violation explanations, and fine verification using Conversational Voice AI, Computer Vision QR decoding, and Retrieval-Augmented Generation (RAG).

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.109-009688.svg?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_14_App_Router-black.svg?style=flat-square&logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_16-336791.svg?style=flat-square&logo=postgresql)](https://www.postgresql.org)
[![ChromaDB](https://img.shields.io/badge/Vector_DB-ChromaDB-orange.svg?style=flat-square)](https://www.trychroma.com)
[![Llama 3](https://img.shields.io/badge/LLM-Meta_Llama_3-blue.svg?style=flat-square)](https://llama.meta.com)
[![Whisper](https://img.shields.io/badge/STT-OpenAI_Whisper-purple.svg?style=flat-square)](https://github.com/openai/whisper)
[![Tests](https://img.shields.io/badge/Tests-112%2F112_Pytest_%7C_18%2F18_Playwright_Passing-brightgreen.svg?style=flat-square)](docs/deployment/production-guide.md)

---

## 🌟 Key Capabilities

### 1. 🎙️ Multilingual Regional Voice Assistant
- **Supported Languages:**
  - 🇵🇰 **Urdu (اردو)** — National Language (Full RTL Layout & Voice Support)
  - 🇵🇰 **Pashto (پښتو)** — Regional Language (Full RTL Layout & Voice Support)
  - 🇬🇧 **English** — Statutory Legal Citation Standard (LTR Layout)
- **Voice Pipeline:** Real-time recording, Whisper STT audio transcription with confidence scoring, grounded Llama 3 reasoning, and high-fidelity Coqui TTS voice response playback.

### 2. 🏛️ Grounded RAG Statutory Knowledge Base (ChromaDB)
- **Zero-Hallucination Legal Grounding:** Anchored strictly in the *Motor Vehicles Ordinance 1965*, *National Highways Safety Ordinance 2000 (NHSO)*, and *Provincial Traffic Regulations*.
- **Direct Statutory Citations:** Every explanation cites specific legal sections (e.g. Section 113 for Over-speeding, Section 89-A for Helmet, Section 99 for Reckless Driving).
- **Graceful Refusals:** Refuses out-of-scope non-traffic questions and communicates missing information transparently without fabricating fines or penalties.

### 3. 📱 Cryptographic Challan QR Validation & Safe City Lookups
- Scans physical or digital e-Challan QR tokens (e.g. `QRC-B17CABF001ABD2FA967D5A6B1EBAB0DD`) with HMAC verification, scan counters, and anti-tampering guards.
- Search citations by vehicle registration number (e.g., `LEA-24-9182`, `ICT-LE-402`) or ticket ID.

### 4. 🔐 2FA OTP Authentication & Protected Citizen Portal
- Rate-limited 2FA SMS mobile verification (60-second cooldown, max 5 attempts/hour).
- Salted cryptographic OTP digests and secure JWT authorization tokens.
- Citizen profile dossier, linked vehicle registrations, and payment receipt archives.

### 5. 👮 Command & Operations Admin Portal
- Real-time Safe City operations metrics: total collections, pending fines, violation breakdown by category, and ANPR sensor hotspot heatmaps.
- Fine schedule management and vector store indexing controls.

---

## 📁 Monorepo Project Architecture

```
AI-Traffic-Voice-Assistant/
├── frontend/                     # Next.js 14 App Router Web Application
│   ├── app/                      # Next.js pages & dynamic route handlers
│   │   ├── page.jsx              # Landing page with Quick Challan Search & Hero
│   │   ├── scan-challan/         # QR Scanner & Manual Citation Lookup
│   │   ├── assistant/            # Multilingual AI Voice Assistant Q&A
│   │   ├── login/ & verify-otp/  # 2FA Mobile OTP Authentication Flow
│   │   ├── citizen/              # Citizen Dashboard, Challans & History
│   │   ├── admin/                # Safe City Police Operations Portal
│   │   └── traffic-rules/        # Interactive Statutory Rules Directory
│   ├── components/               # Navbar, Footer, VoiceAssistantWidget, ChallanCard
│   ├── context/                  # AuthContext & LanguageContext (LTR/RTL)
│   ├── services/                 # Centralized API client (Axios with interceptors)
│   ├── tests/                    # Playwright End-to-End Test Suite
│   ├── vercel.json               # Vercel Production Deployment Configuration
│   └── package.json
│
├── backend/                      # FastAPI Python High-Performance Backend
│   ├── app/
│   │   ├── main.py               # Application entry point, CORS, and health checks
│   │   ├── config.py             # Pydantic Settings & environment variables
│   │   ├── database/             # SQLAlchemy engine, session maker, and seeders
│   │   ├── models/               # SQLAlchemy DB models (User, Challan, QR, Rules)
│   │   ├── schemas/              # Pydantic validation schemas
│   │   ├── routers/              # Modular API endpoints (/auth, /challans, /assistant...)
│   │   ├── services/             # AIService, ChallanService, AuthService, TrafficService
│   │   ├── ai/                   # AI Speech & Language Pipeline
│   │   │   ├── llm/              # Llama 3 provider client (Groq / Ollama / Fallback)
│   │   │   ├── rag/              # ChromaDB vector store retriever & chunking
│   │   │   ├── whisper/          # Audio speech transcription service
│   │   │   └── tts/              # Coqui TTS & regional audio synthesizer
│   │   └── auth/                 # JWT encoding, decoding & role dependencies
│   ├── tests/                    # Pytest Unit & Integration test modules
│   └── requirements.txt
│
├── docker/                       # Production Dockerfiles
│   ├── Dockerfile.backend        # Python 3.11-slim, FFmpeg & Uvicorn runner
│   └── Dockerfile.frontend       # Multi-stage Alpine standalone Next.js runner
├── docs/                         # Architecture, API & Deployment Documentation
│   ├── deployment/production-guide.md # Complete Multi-Cloud Deployment Guide
│   ├── architecture/system-design.md  # System Architecture & Data Flow
│   ├── api/endpoints.md          # REST API Reference
│   └── database/schema.md        # Database Entity-Relationship Specification
├── docker-compose.yml            # Multi-container orchestration (FastAPI + Next.js + Postgres + Redis)
├── .dockerignore
├── .env.example
├── .gitignore                    # Robust secrets exclusion
└── README.md
```

---

## 🚀 Quickstart Guide

### Option A: Running with Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/AI-Traffic-Voice-Assistant.git
   cd AI-Traffic-Voice-Assistant
   ```
2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
3. **Build and start all services:**
   ```bash
   docker compose up --build
   ```
4. Access the web applications:
   - **Frontend Web Portal:** [http://localhost:3000](http://localhost:3000)
   - **FastAPI Interactive Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Healthcheck Endpoint:** [http://localhost:8000/health](http://localhost:8000/health)

---

### Option B: Local Development Setup

#### 1. Backend Setup (FastAPI)
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup (Next.js)
```bash
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000).

---

## 🧪 Testing & Verification

The codebase has undergone rigorous automated testing across both backend and frontend layers:

| Test Suite | Framework | Total Tests | Passed | Coverage |
| :--- | :--- | :--- | :--- | :--- |
| **Backend Unit & Integration** | Pytest | 112 | **112 (100%)** | Auth, QR, Challans, Database, Whisper, Llama 3, Coqui TTS, ChromaDB RAG |
| **Frontend End-to-End** | Playwright | 18 | **18 (100%)** | Desktop Chrome & Mobile Viewport (390x844), RTL/LTR, Voice Assistant, QR Flow |
| **Production Endpoint Verification** | Python Smoke | 8 | **8 (100%)** | Health, Root discovery, 2FA OTP, QR validation, Grounded RAG, Refusals |

### Running the Test Suites:

1. **Run Pytest Suite:**
   ```bash
   cd backend
   pytest tests/ -v
   ```

2. **Run Playwright End-to-End Suite:**
   ```bash
   cd frontend
   npx playwright test
   ```

3. **Run Live Production Endpoints Smoke Test:**
   ```bash
   cd backend
   python tests/verify_production_endpoints.py
   ```

---

## 🌐 Production Deployment

Refer to the complete, step-by-step guide in [docs/deployment/production-guide.md](docs/deployment/production-guide.md) for deploying to:
- **Frontend:** Vercel edge deployment (`vercel.json` included).
- **Backend:** Railway, Render, Fly.io, or VPS (Ubuntu 22.04 with Systemd + Nginx + Let's Encrypt).
- **Database:** Managed PostgreSQL 16 with SQLAlchemy connection pooling.
- **RAG Vector Store:** ChromaDB persistent storage volume.

---

## 🔑 Demo Credentials & Test Scenarios

- **Demo Citizen Login:**
  - Phone: `03009876543`
  - Demo OTP: `123456`
- **Demo Vehicles to Lookup:**
  - `LEA-24-9182` (Associated with Pending Challan `KHI-2024-883492`)
  - `ICT-LE-402` (Associated with Over-speeding citation `PK-2024-883921`)
- **Demo Scannable QR Token:**
  - `QRC-B17CABF001ABD2FA967D5A6B1EBAB0DD`
- **Sample Voice Assistant Questions:**
  - *"What is the penalty for over speeding?"* (Cites Section 113, Motor Vehicles Ordinance)
  - *"اوور سپیڈنگ کا کیا جرمانہ ہے؟"* (Urdu answer with RTL format)
  - *"د چټک چلولو جریمه څه ده؟"* (Pashto regional voice answer)
  - *"How do I bake a chocolate cake?"* (Refused: Zero-hallucination out-of-scope guarantee)

---

## 📜 License & Compliance

MIT License. Engineered in compliance with Pakistani Federal and Provincial Traffic Authorities, the Motor Vehicles Ordinance 1965, and the National Highways Safety Ordinance 2000.
