# AI Traffic Voice Assistant - Production Deployment Guide 🚦🚀

This document provides a comprehensive, production-grade guide for deploying the **AI Traffic Voice Assistant** platform across various infrastructure topologies:
1. **Containerized Multi-Service Deployment** (Docker & Docker Compose)
2. **Cloud Serverless / Managed PaaS** (Vercel Frontend + Railway/Render Backend + Managed PostgreSQL)
3. **Enterprise VPS / Bare-Metal Linux** (Ubuntu 22.04/24.04 LTS with Nginx, Systemd, and Let's Encrypt SSL)

---

## 🏗️ 1. Architecture & Infrastructure Overview

```mermaid
flowchart TD
    subgraph Client Tier
        Browser["Citizen Web Browser / Mobile Phone"]
        Officer["Traffic Officer / Scanner App"]
    end

    subgraph CDN & Edge
        Edge["Vercel CDN / Cloudflare Reverse Proxy (SSL Termination)"]
    end

    subgraph Frontend Service
        NextJS["Next.js 14 Web Application (Port 3000)\n- App Router\n- Standalone Node Server\n- RTL / Multilingual Engine"]
    end

    subgraph Backend Core
        FastAPI["FastAPI Python Core (Port 8000)\n- RESTful API\n- JWT & 2FA SMS Security\n- QR Cryptographic Verification"]
    end

    subgraph AI Pipeline
        Whisper["OpenAI Whisper STT\n(Multilingual Audio Transcription)"]
        Llama3["Meta Llama 3 LLM (Groq / Ollama)\n(Statutory Reasoning Engine)"]
        TTS["Coqui TTS / Regional Audio Engine\n(Urdu, Pashto & English Speech)"]
        ChromaDB["ChromaDB Vector Store\n(Persistent Embeddings & Traffic Law Context)"]
    end

    subgraph Data Tier
        Postgres[("PostgreSQL 16 Relational DB\n(Users, Challans, Rules, Audit Logs)")]
        Redis[("Redis 7 Cache / Rate Limiting")]
    end

    Browser -->|HTTPS| Edge
    Officer -->|HTTPS| Edge
    Edge -->|HTTP / Reverse Proxy| NextJS
    NextJS -->|REST API /api/v1| FastAPI
    FastAPI -->|Vector Retrieval| ChromaDB
    FastAPI -->|Speech-to-Text| Whisper
    FastAPI -->|Prompt & Context| Llama3
    FastAPI -->|Audio Synthesis| TTS
    FastAPI -->|SQLAlchemy Connection Pool| Postgres
    FastAPI -->|Session & OTP Cache| Redis
```

---

## 📋 2. Environment Variables Matrix

All secret configurations must be managed securely through environment variables. **Never commit actual `.env` files into source control.**

### 2.1 Backend Environment Variables (`backend/.env`)

| Variable | Recommended Production Value | Description |
| :--- | :--- | :--- |
| `APP_NAME` | `AI Traffic Voice Assistant API` | API service identifier |
| `APP_ENV` | `production` | Environment mode (`development`, `staging`, `production`) |
| `DEBUG` | `False` | Disables debug exceptions and stack traces in production |
| `PORT` | `8000` | Backend listening port |
| `HOST` | `0.0.0.0` | Listen on all network interfaces inside containers |
| `SECRET_KEY` | *(Generate via `openssl rand -hex 32`)* | Salt for JWT HMAC-SHA256 signature tokens |
| `ALGORITHM` | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | JWT expiration (24 hours) |
| `OTP_MODE` | `production` | In `production`, strictly dispatches via SMS, omitting demo codes |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/traffic_db` | PostgreSQL connection string |
| `ALLOWED_ORIGINS` | `https://your-domain.vercel.app,https://your-domain.gov.pk` | Comma-delimited list of trusted client CORS domains |
| `LLM_PROVIDER` | `groq` (or `ollama`, `openai`) | Provider for Llama 3 inference |
| `LLAMA3_API_KEY` | `gsk_...` | Groq / HuggingFace API key |
| `LLAMA3_MODEL` | `llama-3-8b-instruct` | Specific model checkpoint |
| `WHISPER_PROVIDER` | `groq` (or `openai`, `local`) | Speech-to-text transcription engine |
| `WHISPER_API_KEY` | `gsk_...` | Whisper inference API token |
| `CHROMA_PERSIST_DIRECTORY` | `/app/chroma_db` | Persistent volume path for vector index |
| `TTS_ENGINE` | `gtts` (or `coqui`, `edgetts`) | Regional speech synthesizer |

### 2.2 Frontend Environment Variables (`frontend/.env.local` or Vercel Config)

| Variable | Recommended Production Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://api.your-domain.gov.pk/api/v1` | Public HTTPS gateway URL for backend REST API |
| `PORT` | `3000` | Node server listening port |

---

## 🐳 3. Deployment Method A: Docker Compose (Full Stack)

This is the recommended strategy for on-premises servers, cloud VPS (AWS EC2, DigitalOcean, Hetzner), or container clusters.

### Step 3.1: Prepare Production Environment File
Copy the example environment file and populate production values:
```bash
cp .env.example .env
nano .env
```
Ensure you generate a secure `SECRET_KEY`:
```bash
openssl rand -hex 32
```

### Step 3.2: Build and Launch Services
Run Docker Compose in detached mode with build triggers:
```bash
docker compose up -d --build
```

### Step 3.3: Verify Container Health
Check running container statuses:
```bash
docker compose ps
```
Expected healthy output:
```
NAME               STATUS                  PORTS
traffic-postgres   Up (healthy)            127.0.0.1:5432->5432/tcp
traffic-redis      Up (healthy)            127.0.0.1:6379->6379/tcp
traffic-backend    Up (healthy)            0.0.0.0:8000->8000/tcp
traffic-frontend   Up                      0.0.0.0:3000->3000/tcp
```

### Step 3.4: Initialize Database Migrations & Seeds
Execute database schema initialization inside the backend container:
```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python reseed.py
```

---

## ☁️ 4. Deployment Method B: Cloud Hybrid (Vercel + Railway / Render)

### 4.1 Deploying Frontend to Vercel

1. **Connect GitHub Monorepo:**
   - Log in to your [Vercel Dashboard](https://vercel.com).
   - Click **Add New...** -> **Project** -> Import your GitHub repository.
2. **Configure Project Settings:**
   - **Root Directory:** Edit and set to `frontend`.
   - **Framework Preset:** Select `Next.js`.
   - **Build Command:** `npm run build` (or leave default).
   - **Output Directory:** `.next` (default).
3. **Configure Environment Variables:**
   - Add `NEXT_PUBLIC_API_URL` = `https://api.yourdomain.com/api/v1`
4. **Deploy:** Click **Deploy**. Vercel will build the standalone Next.js application with automatic edge distribution.

### 4.2 Deploying Backend to Railway / Render / Fly.io

1. **Database:**
   - Create a managed PostgreSQL 16 database instance.
   - Note the connection string: `postgresql://user:password@host:port/dbname`.
2. **Backend Service:**
   - Root Directory: `backend` (or use root with `docker/Dockerfile.backend`).
   - Set Environment Variables from Section 2.1 (`DATABASE_URL`, `SECRET_KEY`, `ALLOWED_ORIGINS`, `LLM_PROVIDER`, etc.).
   - Make sure `ALLOWED_ORIGINS` includes your Vercel deployment URL (e.g. `https://ai-traffic-frontend.vercel.app`).
3. **Health Check Path:**
   - Configure health check endpoint to `/health` (expected HTTP 200).
4. **Volume Mount for ChromaDB:**
   - Mount persistent volume to `/app/chroma_db` (1GB to 5GB).

---

## 🖥️ 5. Deployment Method C: Enterprise Ubuntu VPS (Systemd + Nginx + SSL)

### Step 5.1: Install Dependencies
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3.11 python3.11-venv python3-pip nodejs npm nginx certbot python3-certbot-nginx git postgresql postgresql-contrib ffmpeg
```

### Step 5.2: Set Up PostgreSQL
```bash
sudo -u postgres psql -c "CREATE USER traffic_admin WITH PASSWORD 'StrongPasswordHere';"
sudo -u postgres psql -c "CREATE DATABASE traffic_assistant_db OWNER traffic_admin;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE traffic_assistant_db TO traffic_admin;"
```

### Step 5.3: Set Up Backend Systemd Service
Create `/etc/systemd/system/traffic-backend.service`:
```ini
[Unit]
Description=AI Traffic Voice Assistant Backend API
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/ai-traffic/backend
Environment="PATH=/var/www/ai-traffic/backend/venv/bin"
EnvironmentFile=/var/www/ai-traffic/backend/.env
ExecStart=/var/www/ai-traffic/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```
Enable and start backend:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now traffic-backend
```

### Step 5.4: Set Up Frontend Systemd Service
Build Next.js:
```bash
cd /var/www/ai-traffic/frontend
npm install
npm run build
```
Create `/etc/systemd/system/traffic-frontend.service`:
```ini
[Unit]
Description=AI Traffic Voice Assistant Frontend
After=network.target traffic-backend.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/ai-traffic/frontend
Environment=PORT=3000
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /var/www/ai-traffic/frontend/.next/standalone/server.js

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```
Enable and start frontend:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now traffic-frontend
```

### Step 5.5: Nginx Reverse Proxy Configuration
Create `/etc/nginx/sites-available/ai-traffic`:
```nginx
server {
    server_name traffic.yourdomain.gov.pk;

    # Frontend Reverse Proxy
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 25M;
    }

    # Backend Docs
    location /docs {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }
    location /openapi.json {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }
}
```
Enable site and obtain SSL:
```bash
sudo ln -s /etc/nginx/sites-available/ai-traffic /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d traffic.yourdomain.gov.pk
```

---

## 🔍 6. Post-Deployment Verification & Smoke Tests

Verify that all production microservices and endpoints are fully operational.

### 6.1 Automated Verification Script
Run the built-in production verification test against your deployed domain:
```bash
TEST_BASE_URL=https://api.yourdomain.gov.pk python backend/tests/verify_production_endpoints.py
```
Expected output:
```
=================================================================
AI TRAFFIC VOICE ASSISTANT - PRODUCTION ENDPOINT VERIFICATION
Target Base URL: https://api.yourdomain.gov.pk
=================================================================

[1/8] Verifying Health & Liveness Endpoints...
  ✓ /health: Status='healthy', DB='connected'
[2/8] Verifying System Root Discovery Endpoints...
  ✓ Service: 'AI Traffic Voice Assistant API'
  ✓ Multilingual Support: Urdu (ur), Pashto (ps), English (en)
[3/8] Verifying 2FA SMS OTP Dispatch (/api/v1/auth/send-otp)...
  ✓ OTP dispatched. Cooldown: 60s
[4/8] Verifying 2FA OTP Validation & JWT Token (/api/v1/auth/verify-otp)...
  ✓ JWT Token issued. User: 'Muhammad Rizwan' (Role: citizen)
[5/8] Verifying Public Challan Status (/api/v1/challans/{challan_no}/status)...
  ✓ Ticket: KHI-2024-883492 | Amount: PKR 1000.0 | Status: PENDING
[6/8] Verifying QR Code Validation (/api/v1/challans/qr/validate)...
  ✓ Verified QR Token -> Challan: KHI-2024-883492
[7/8] Verifying Grounded RAG AI Assistant (English Query)...
  ✓ RAG Answer: Under Section 113, Motor Vehicles Ordinance 1965...
  ✓ Grounded Sources/Citations: ['Section 113, Motor Vehicles Ordinance 1965']
[8/8] Verifying Zero-Hallucination Refusal on Out-of-Scope Query...
  ✓ Refusal Handled Correctly: This information is currently unavailable...

=================================================================
ALL 8 PRODUCTION ENDPOINT TESTS PASSED WITH 100% SUCCESS!
=================================================================
```

### 6.2 Manual Sanity Checks
- [ ] Visit `https://yourdomain.gov.pk` - Landing page loads instantly with 3D/glassmorphism design.
- [ ] Scan Challan QR code `QRC-B17CABF001ABD2FA967D5A6B1EBAB0DD` or enter manually.
- [ ] Log in with citizen mobile `03009876543`.
- [ ] Switch language to **Urdu (اردو)** or **Pashto (پښتو)** - UI converts to smooth RTL layout.
- [ ] Ask Voice Assistant: *"What is the penalty for driving without a helmet?"* - Response must cite Section 89-A / Motor Vehicles Ordinance.
- [ ] Verify SSL Grade on SSL Labs (Target: A+).

---

## 🛡️ 7. Security Hardening Checklist

- [x] **Zero Secrets in Source Control:** `.gitignore` blocks `.env`, `.env.local`, `*.pem`, `*.db`.
- [x] **CORS Origins Restricted:** Only authorized domains specified in `ALLOWED_ORIGINS` can access API.
- [x] **Rate Limiting:** OTP dispatch is rate-limited (60s cooldown, max 5 requests/hour per IP/Phone).
- [x] **Anti-Hallucination Guarantee:** RAG pipeline enforces strict factual grounding against statutory documents; queries without verified legal grounding are refused explicitly.
- [x] **Input Sanitization:** Pakistani phone numbers, vehicle registrations, and uploaded audio file sizes (max 25MB) are strictly validated.
- [x] **Statutory Attribution:** All fine amounts and legal sections are bound directly to official law ordinance data.
