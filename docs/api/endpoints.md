# REST API Endpoints Specification 📜

All API endpoints are prefixed with `/api/v1`. Interactive Swagger documentation is available at `/docs` and ReDoc at `/redoc`.

---

## 1. System & Health (`/`)
- `GET /`: Service metadata, supported languages (Urdu, Pashto, English), and statutory framework list.
- `GET /health` & `GET /api/v1/health`: System health check verifying database ping, vector store status, and server uptime.

---

## 2. Authentication & 2FA (`/api/v1/auth`)
- `POST /auth/send-otp`: Dispatches 6-digit SMS verification code with 60-second cooldown and rate limiting.
- `POST /auth/verify-otp`: Validates 6-digit OTP code against salted cryptographic digest and returns signed JWT access token.
- `POST /auth/login`: Citizen or officer password login.
- `POST /auth/admin/login`: Safe city operations officer login with badge credentials.
- `GET /auth/me`: Retrieves current authenticated user profile.
- `POST /auth/logout`: Revokes current JWT session token.
- `PATCH /auth/preferences/language`: Updates preferred language (`ur`, `ps`, `en`).

---

## 3. Challans & QR Validation (`/api/v1/challans`)
- `GET /challans/search?q={query}`: Searches citations by vehicle registration number (`LEA-24-9182`, `ICT-LE-402`) or ticket number.
- `GET /challans/my-challans`: Returns all citations issued to the authenticated citizen.
- `GET /challans/{challan_no}/status`: Public citizen status verification (ticket amount, violation title, status).
- `GET /challans/{challan_no}`: Authorized full citation dossier (requires citizen ownership or admin role).
- `POST /challans/qr/validate`: Cryptographically validates scanned QR reference tokens (`QRC-...`), verifying expiry, revocation, and incrementing scan counts.
- `POST /challans/{challan_id}/pay`: Initiates 1Link / simulated digital settlement and generates receipt transaction ID.
- `POST /challans/scan-ocr`: Uploads challan image or notice for OCR extraction.

---

## 4. Multilingual AI Voice Assistant (`/api/v1/assistant`)
- `POST /assistant/query`: Processes user question (text) with language parameter (`ur`, `ps`, `en`), retrieves ChromaDB statutory context, prompts Llama 3, and generates synthesized speech.
- `POST /assistant/transcribe`: Uploads microphone audio file (`.wav`, `.mp3`, `.ogg`, `.webm`), validates file format and size (max 25MB), and transcribes via Whisper STT.
- `POST /assistant/tts`: Converts text string into spoken audio in the specified target language using Coqui TTS / Regional TTS.
- `GET /assistant/history`: Retrieves multi-turn conversational history for the authenticated user.
- `DELETE /assistant/history`: Clears conversational session memory.

---

## 5. Traffic Rules & Penalties (`/api/v1/traffic-rules`)
- `GET /traffic-rules`: Retrieves statutory fine schedules authorized under the Motor Vehicles Ordinance 1965 and NHSO 2000.
- `GET /traffic-rules/{id}`: Detailed rule specifications, penalty points, and legal sections.
- `POST /traffic-rules`: (Admin only) Adds verified traffic violation schedule.
- `PUT /traffic-rules/{id}`: (Admin only) Updates statutory fine amount or description.

---

## 6. Citizen & Admin Portals (`/api/v1/citizens` & `/api/v1/admin`)
- `GET /citizens/dashboard`: Returns citizen summary (total challans, pending dues, registered vehicles).
- `GET /admin/dashboard`: Real-time Safe City command metrics (collection revenue, pending fines, violation breakdown).
- `GET /admin/challans`: Paginated master challan audit table.
- `GET /admin/violations/hotspots`: ANPR camera sensor hotspots and violation density analytics.
