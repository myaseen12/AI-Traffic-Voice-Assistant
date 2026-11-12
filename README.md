# AI Traffic Voice Assistant 🚦🎙️

An intelligent, multilingual, multimodal platform for traffic e-challan inquiries, violation explanations, and fine settlements using conversational voice AI, computer vision OCR, and modern web technologies.

---

## 🌟 Key Features

1. **🎙️ Multilingual Regional Voice Assistant:**
   - Powered by OpenAI Whisper STT, domain LLM intent extraction, and regional Text-to-Speech (gTTS).
   - Speaks and comprehends multiple regional languages (English, Hindi, Marathi, Tamil, Telugu, Bengali, Gujarati, Kannada).
   - Conversational voice queries (e.g. *"Check pending challans for MH-12-AB-1234"* or *"What is the fine for driving without helmet?"*).

2. **📸 Smart Challan Vision OCR Scanner:**
   - Scan physical traffic violation paper notices or upload screenshots to instantly extract vehicle numbers, violation sections, and fine amounts.

3. **🏛️ Motor Vehicles Act Statutory Knowledge Base:**
   - Interactive directory of traffic laws, demerit points, and statutory penalty schedules under the amended Motor Vehicles Act.

4. **💳 Instant Citizen Settlement & Dispute Flow:**
   - Direct UPI / Card settlement with simulated digital receipts and clearance certificate generation.

5. **📊 Dual Citizen & Traffic Authority Portals:**
   - **Citizen Portal:** Track registered vehicles, dispute wrong citations, download tax receipts.
   - **Admin / Law Enforcement Operations:** Monitor collection metrics, violation breakdown by category, sensor hotspots, and manage fine amounts.

---

## 📁 Project Structure

```
AI-Traffic-Voice-Assistant/
│
├── frontend/                     # Next.js 14 App Router with Tailwind CSS
│   ├── app/
│   │   ├── page.jsx              # Landing page with Quick Challan Search & Hero
│   │   ├── layout.jsx            # Global layout with Navbar, Footer & VoiceWidget
│   │   ├── globals.css           # Tailwind & custom glassmorphism styles
│   │   ├── about/                # About project mission & transparency
│   │   ├── features/             # Feature breakdown
│   │   ├── how-it-works/         # 4-step workflow guide
│   │   ├── traffic-rules/        # Interactive rules & penalties directory
│   │   ├── faq/                  # Interactive FAQ accordion
│   │   ├── contact/              # Emergency helplines & citizen inquiry form
│   │   ├── login/                # Phone number login
│   │   ├── verify-otp/           # 6-digit OTP verification screen
│   │   ├── scan-challan/         # Camera / File OCR ticket scanner
│   │   ├── language-selection/   # Regional language selector
│   │   ├── assistant/            # Live Multilingual Voice Assistant with TTS audio
│   │   ├── citizen/
│   │   │   ├── dashboard/        # Citizen metrics & pending fines
│   │   │   ├── challans/         # Challan list with instant pay
│   │   │   ├── history/          # Payment receipts archive
│   │   │   └── profile/          # Citizen profile & linked DL
│   │   └── admin/
│   │       ├── dashboard/        # Police operations & collection revenue
│   │       ├── challans/         # Master challan audit table
│   │       ├── citizens/         # Citizen license directory
│   │       ├── violations/       # Sensor hotspot statistics
│   │       ├── traffic-rules/    # Fine scheduler & rule modifier
│   │       └── settings/         # AI model & Whisper settings
│   ├── components/               # Navbar, Footer, VoiceWidget, ChallanCard
│   ├── hooks/                    # useSpeechRecognition
│   ├── services/                 # API client & backend endpoints
│   ├── context/                  # AuthContext & LanguageContext
│   └── package.json
│
├── backend/                      # FastAPI Python Backend
│   ├── app/
│   │   ├── main.py               # FastAPI entry point, CORS, lifespan seeding
│   │   ├── config.py             # App environment configuration
│   │   ├── database/             # SQLAlchemy engine & session maker
│   │   ├── models/               # User, Challan, Violation, VoiceLog models
│   │   ├── schemas/              # Pydantic schemas
│   │   ├── routers/              # auth, challans, assistant, rules, admin, citizen
│   │   ├── services/             # ChallanService, AuthService, TrafficService
│   │   ├── repositories/         # Database query repositories
│   │   ├── middleware/           # Logging & response time headers
│   │   ├── auth/                 # JWT encoding/decoding & auth dependencies
│   │   ├── ai/                   # AI Pipeline
│   │   │   ├── llm/              # Intent classification & query analyzer
│   │   │   ├── whisper/          # Audio speech transcription
│   │   │   └── tts/              # Text-to-speech audio synthesis (gTTS)
│   │   └── utils/                # Helpers & formatters
│   ├── tests/                    # Pytest test cases
│   └── requirements.txt
│
├── database/
│   ├── migrations/               # Alembic database migrations
│   └── seeds/                    # Seed script for initial rules & sample challans
│
├── docs/
│   ├── architecture/             # System design & architecture diagrams
│   ├── api/                      # REST API endpoints reference
│   └── database/                 # Database schema ERD documentation
│
├── docker/
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Backend Setup (FastAPI)

1. Open a terminal in `backend/`:
   ```bash
   cd backend
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the development server (auto-creates tables and seeds demo violations):
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
4. API Interactive Swagger Documentation:
   Visit **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

### 2. Frontend Setup (Next.js)

1. Open a terminal in `frontend/`:
   ```bash
   cd frontend
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser at **[http://localhost:3000](http://localhost:3000)**.

---

### 3. Running with Docker Compose

Run the entire full-stack application (FastAPI + Next.js + PostgreSQL + Redis) with a single command:

```bash
docker-compose up --build
```

---

## 🧪 Demo Credentials & Testing

- **Demo Vehicle Numbers to Search:**
  - `MH-12-AB-1234` (Has 2 pending challans + 1 paid challan)
  - `DL-01-CA-9999` (Has 1 pending speeding challan)
- **Demo Citizen Login:**
  - Phone: `9876543210`
  - OTP: `123456`
- **Voice Queries to Try in the Voice Assistant:**
  - *"Check pending challans for vehicle MH-12-AB-1234"*
  - *"What is the penalty for riding without a helmet?"*
  - *"हेलमेट न पहनने पर कितना जुर्माना है?"* (Hindi)
  - *"How do I dispute a signal jump ticket?"*

---

## 📜 License
MIT License. Built for civic intelligence and road safety transparency.
