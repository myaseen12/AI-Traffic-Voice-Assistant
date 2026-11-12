# System Architecture: AI Traffic Voice Assistant 🚦🏛️

## 1. High-Level Architecture Overview

The **AI Traffic Voice Assistant** is an intelligent multimodal civic platform designed to provide instant traffic e-challan inquiries, statutory violation explanations, and fine verification through conversational voice and text interactions in **Urdu, Pashto, and English**.

```mermaid
flowchart TD
    subgraph Client Tier
        Citizen(["Citizen (Web Browser / Mobile)"])
        Officer(["Traffic Officer / Admin"])
    end

    subgraph Presentation Layer
        NextJS["Next.js 14 Web Portal\n(Tailwind CSS, Glassmorphism, RTL/LTR Engine)"]
        VoiceWidget["Voice Assistant Widget\n(Web Audio API & Microphone Recording)"]
        QRScanner["QR Scanner Component\n(Camera Stream & Image Upload)"]
    end

    subgraph API & Gateway Layer
        FastAPI["FastAPI Core Service (Port 8000)\n- Dynamic CORS Management\n- Security Middleware & Audit Logging\n- JWT Bearer Authentication"]
    end

    subgraph Core AI Pipeline
        Whisper["Whisper STT Service\n(Multilingual Audio Transcription)"]
        ChromaRAG["ChromaDB Vector Store\n(Statutory Embeddings & Retrieval)"]
        Llama3["Meta Llama 3 LLM (Groq / Ollama)\n(Statutory Reasoning Engine)"]
        TTS["Coqui TTS / Regional Audio Synthesizer\n(Urdu, Pashto & English Speech)"]
    end

    subgraph Data & Storage Layer
        Postgres[("PostgreSQL 16 Relational DB\n(Users, Challans, Rules, QR Tokens)")]
        Redis[("Redis 7 Cache / Task Queue")]
        DiskAudio["Audio Cache Volume"]
    end

    Citizen --> NextJS
    Officer --> NextJS
    NextJS --> VoiceWidget
    NextJS --> QRScanner
    NextJS -->|REST API Calls & Audio Blobs| FastAPI

    FastAPI -->|1. Raw Audio| Whisper
    Whisper -->|2. Transcribed Text| FastAPI
    FastAPI -->|3. Query Similarity Search| ChromaRAG
    ChromaRAG -->|4. Verified Legal Chunks| FastAPI
    FastAPI -->|5. Grounded Prompt| Llama3
    Llama3 -->|6. Statutory Answer| FastAPI
    FastAPI -->|7. Synthesize Speech| TTS
    TTS -->|8. Base64 Audio| FastAPI

    FastAPI -->|CRUD Queries| Postgres
    FastAPI -->|Rate Limits & Cooldowns| Redis
    TTS --> DiskAudio
```

---

## 2. Multilingual Voice & RAG Processing Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Citizen
    participant UI as Next.js Web App
    participant API as FastAPI Backend
    participant STT as Whisper Engine
    participant RAG as ChromaDB Vector Store
    participant LLM as Llama 3 Reasoning Engine
    participant TTS as Coqui TTS Synthesizer

    Citizen->>UI: Speaks query into microphone
    UI->>API: POST /api/v1/assistant/transcribe (Audio Blob)
    API->>STT: Process speech audio
    STT-->>API: Transcribed text ("What is fine for over speeding?")
    API->>RAG: Query statutory embeddings (Motor Vehicles Ordinance 1965)
    RAG-->>API: Return top-k verified legal chunks (Section 113)
    API->>LLM: Generate grounded response using statutory context
    LLM-->>API: Grounded answer citing Section 113
    API->>TTS: Convert answer to speech audio (Urdu/Pashto/English)
    TTS-->>API: Synthesized audio stream
    API-->>UI: Return text response, citations, and playable audio
    UI->>Citizen: Displays text citation and auto-plays voice response
```

---

## 3. Security Architecture & Anti-Hallucination Guarantees

1. **Grounded Legal Retrieval (No Hallucinations):**
   - The LLM is strictly instructed via system prompts not to act as a primary legal authority.
   - If retrieved context does not contain statutory backing or the query is out of scope (e.g. general knowledge), the system explicitly refuses rather than speculating.
2. **Cryptographic QR Validation:**
   - QR codes are bound 1-to-1 with specific citation records via HMAC-signed tokens (`QRC-...`).
   - Every scan is logged in the immutable audit trail, tracking client IP and incrementing scan counts.
3. **2FA SMS OTP Mobile Verification:**
   - Enforces a 60-second cooldown between requests and caps maximum requests at 5 per hour.
   - Verification attempts lock after 5 consecutive failures.
