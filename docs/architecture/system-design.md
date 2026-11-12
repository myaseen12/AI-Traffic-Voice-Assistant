# System Architecture: AI Traffic Voice Assistant

## Overview
The AI Traffic Voice Assistant is an intelligent multimodal civic platform designed to simplify traffic challan discovery, violation explanations, and fine payments through conversational voice and text interactions in multiple regional languages.

## Architecture Diagram

```mermaid
graph TD
    User([Citizen / Traffic Officer]) -->|Voice / Text / OCR Scan| Frontend[Next.js 14 Web Portal]
    Frontend -->|REST API & Audio Streams| Backend[FastAPI Backend Server]
    
    subgraph AI Pipeline
        Backend --> Whisper[Whisper STT - Speech to Text]
        Whisper --> LLM[LLM Agent - Intent & Entity Extraction]
        LLM --> TTS[TTS Engine - Regional Speech Synthesis]
        TTS -->|Base64 Audio Reply| Backend
    end
    
    subgraph Data & Storage
        Backend --> DB[(PostgreSQL / SQLite Database)]
        Backend --> Cache[(Redis Cache / Task Queue)]
    end
```

## Key Modules
1. **Multilingual Voice Pipeline:**
   - **Whisper Speech-to-Text:** Converts microphone audio clips into structured text prompts.
   - **LLM Reasoning Engine:** Detects intent (`CHECK_CHALLAN`, `TRAFFIC_RULE_QUERY`, `PAYMENT_HELP`), extracts license numbers, and queries the database.
   - **TTS Audio Synthesizer:** Converts text responses into natural regional speech (Hindi, Marathi, English, etc.).
2. **Citizen Portal:**
   - OTP-based login, vehicle registration tracking, real-time challan search, fine settlement.
3. **Admin Portal:**
   - Real-time violation statistics, rule fine overrides, citizen inquiry logs.
