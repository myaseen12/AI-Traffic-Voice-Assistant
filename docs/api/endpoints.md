# API Endpoints Reference

All endpoints are prefixed with `/api/v1`.

### 1. Authentication (`/auth`)
- `POST /auth/send-otp`: Request 6-digit verification code.
- `POST /auth/verify-otp`: Validate OTP and receive JWT access token.
- `POST /auth/login`: Admin/Citizen password login.
- `GET /auth/me`: Current authenticated user profile.

### 2. Challans (`/challans`)
- `GET /challans/search?q={query}`: Search challans by vehicle number or challan number.
- `GET /challans/{challan_no}`: Retrieve detailed challan record with violation section.
- `POST /challans/{challan_id}/pay`: Initiate mock UPI/Card payment for fine settlement.
- `POST /challans/scan-ocr`: Upload challan receipt or image for OCR detail extraction.

### 3. AI Voice Assistant (`/assistant`)
- `POST /assistant/query`: Submit text query (with optional language code) to get synthesized voice + action data.
- `POST /assistant/voice-audio`: Upload raw audio blob for transcription (Whisper), LLM processing, and speech audio playback.
- `POST /assistant/tts`: Direct text to speech conversion.

### 4. Traffic Rules (`/traffic-rules`)
- `GET /traffic-rules`: Retrieve traffic rules, legal sections, fine amounts, and penalty points.

### 5. Citizen & Admin
- `GET /citizens/dashboard`: Citizen stats and pending challans.
- `GET /admin/dashboard`: Metrics on collections, pending fines, and violation types.
- `GET /admin/challans`: Paginated challan management.
