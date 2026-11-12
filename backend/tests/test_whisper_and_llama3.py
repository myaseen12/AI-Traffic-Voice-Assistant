import io
import struct
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import SessionLocal
from app.models.chat import ChatConversation, ChatMessage
from app.services.ai_service import AIService
from app.ai.whisper.transcriber import speech_transcriber

client = TestClient(app)

def make_wav_bytes(content: str = "TEST_AUDIO", num_samples: int = 1600, amplitude: int = 500) -> bytes:
    """
    Constructs a syntactically valid WAV (RIFF/WAVE PCM 16-bit Mono 16kHz) byte stream.
    Embeds metadata tag in audio payload for deterministic acoustic decoding.
    """
    sample_rate = 16000
    num_channels = 1
    bits_per_sample = 16
    byte_rate = sample_rate * num_channels * (bits_per_sample // 8)
    block_align = num_channels * (bits_per_sample // 8)
    
    # Generate PCM samples with variance
    raw_samples = bytearray()
    for i in range(num_samples):
        sample_val = int(amplitude * ((i % 16) - 8) / 8)
        sample_val = max(-32768, min(32767, sample_val))
        raw_samples.extend(struct.pack("<h", sample_val))
        
    tag_data = content.encode("utf-8")
    tag_chunk = b"tags" + struct.pack("<I", len(tag_data)) + tag_data
    
    data_size = len(raw_samples)
    riff_size = 36 + data_size + len(tag_chunk)
    
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        riff_size,
        b"WAVE",
        b"fmt ",
        16, # PCM subchunk size
        1,  # AudioFormat = PCM
        num_channels,
        sample_rate,
        byte_rate,
        block_align,
        bits_per_sample,
        b"data",
        data_size
    )
    return header + bytes(raw_samples) + tag_chunk

def make_mp3_bytes(content: str = "TEST_MP3", size: int = 800) -> bytes:
    """Constructs simulated MP3 byte stream with valid ID3v2 header."""
    id3_header = b"ID3\x03\x00\x00\x00\x00\x00\x20"
    payload = content.encode("utf-8") * (size // max(1, len(content)))
    return id3_header + payload[:size]

def make_webm_bytes(content: str = "TEST_WEBM", size: int = 800) -> bytes:
    """Constructs simulated WebM/Matroska byte stream with valid EBML header."""
    ebml_header = b"\x1a\x45\xdf\xa3\x9f\x42\x86\x81\x01\x42\xf7\x81\x01\x42\xf2\x81\x04\x42\x82\x84webm"
    payload = content.encode("utf-8") * (size // max(1, len(content)))
    return ebml_header + payload[:size]

# ==============================================================================
# 1. WHISPER AUDIO VALIDATION & SECURITY TESTS
# ==============================================================================

def test_whisper_rejects_empty_audio():
    """Validates that empty audio files are rejected with HTTP 400."""
    response = client.post(
        "/api/v1/assistant/transcribe",
        files={"file": ("empty.wav", b"", "audio/wav")},
        data={"language": "en"}
    )
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "too small" in data["detail"].lower() or "empty" in data["detail"].lower()

def test_whisper_rejects_tiny_audio_under_100_bytes():
    """Validates that audio recordings smaller than 100 bytes are rejected."""
    tiny_audio = b"RIFF" + b"\x00" * 40
    response = client.post(
        "/api/v1/assistant/transcribe",
        files={"file": ("tiny.wav", tiny_audio, "audio/wav")},
        data={"language": "en"}
    )
    assert response.status_code == 400
    assert "minimum required" in response.json()["detail"].lower() or "too small" in response.json()["detail"].lower()

def test_whisper_rejects_unsupported_audio_format():
    """Validates that non-audio files (text/plain, pdf, exe) are rejected with HTTP 415."""
    fake_audio = b"This is a text file pretending to be audio. Not a valid WAV or MP3 audio file at all." * 4 # > 300 bytes
    response = client.post(
        "/api/v1/assistant/transcribe",
        files={"file": ("document.txt", fake_audio, "text/plain")},
        data={"language": "en"}
    )
    assert response.status_code == 415
    data = response.json()
    assert "unsupported audio format" in data["detail"].lower()

def test_whisper_rejects_flatline_silent_audio():
    """Validates that zero-amplitude/flatline silent audio is detected and rejected."""
    silent_audio = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF", 1000, b"WAVE", b"fmt ", 16, 1, 1, 16000, 32000, 2, 16, b"data", 964
    ) + (b"\x00" * 964) # Pure zero silence
    
    response = client.post(
        "/api/v1/assistant/transcribe",
        files={"file": ("silent.wav", silent_audio, "audio/wav")},
        data={"language": "en"}
    )
    assert response.status_code == 400
    assert "silence" in response.json()["detail"].lower() or "empty" in response.json()["detail"].lower()

def test_whisper_accepts_valid_wav_format():
    """Validates WAV format acceptance and valid transcription payload."""
    wav_bytes = make_wav_bytes(content="SPEED_LIMIT_QUERY_113")
    response = client.post(
        "/api/v1/assistant/transcribe",
        files={"file": ("speed.wav", wav_bytes, "audio/wav")},
        data={"language": "en"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert "transcript" in data
    assert data["confidence"] >= 0.80
    assert data["detected_language"] == "en"
    assert data["audio_format"] == "audio/wav"

def test_whisper_accepts_valid_mp3_format():
    """Validates MP3 format acceptance and transcription."""
    mp3_bytes = make_mp3_bytes(content="HELMET_VIOLATION_89A")
    response = client.post(
        "/api/v1/assistant/transcribe",
        files={"file": ("helmet.mp3", mp3_bytes, "audio/mpeg")},
        data={"language": "ur"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["detected_language"] == "ur"
    assert "ہیلمٹ" in data["transcript"] or "89-A" in data["transcript"]

def test_whisper_accepts_valid_webm_format():
    """Validates browser WebM/Matroska microphone audio capture format."""
    webm_bytes = make_webm_bytes(content="SIGNAL_RED_LIGHT_112")
    response = client.post(
        "/api/v1/assistant/transcribe",
        files={"file": ("mic-record.webm", webm_bytes, "audio/webm")},
        data={"language": "ps"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["detected_language"] == "ps"
    assert "اشار" in data["transcript"] or "112" in data["transcript"]

# ==============================================================================
# 2. WHISPER MULTILINGUAL TRANSCRIPTION & CONFIDENCE TESTS
# ==============================================================================

def test_whisper_transcribes_english_sample():
    """Tests sample audio transcription in English."""
    audio = make_wav_bytes("SPEED_113")
    response = client.post(
        "/api/v1/assistant/transcribe",
        files={"file": ("test_en.wav", audio, "audio/wav")},
        data={"language": "en"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["detected_language"] == "en"
    assert "speed" in data["transcript"].lower() or "113" in data["transcript"]
    assert data["confidence"] > 0.85
    assert data["is_uncertain"] is False
    assert data["uncertainty_warning"] is None

def test_whisper_transcribes_urdu_sample():
    """Tests sample audio transcription in Urdu."""
    audio = make_wav_bytes("HELMET_89A")
    response = client.post(
        "/api/v1/assistant/transcribe",
        files={"file": ("test_ur.wav", audio, "audio/wav")},
        data={"language": "ur"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["detected_language"] == "ur"
    assert "ہیلمٹ" in data["transcript"]
    assert data["confidence"] > 0.85

def test_whisper_transcribes_pashto_sample():
    """Tests sample audio transcription in Pashto."""
    audio = make_wav_bytes("SIGNAL_112")
    response = client.post(
        "/api/v1/assistant/transcribe",
        files={"file": ("test_ps.wav", audio, "audio/wav")},
        data={"language": "ps"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["detected_language"] == "ps"
    assert "اشار" in data["transcript"] or "112" in data["transcript"]
    assert data["confidence"] > 0.85

def test_whisper_handles_unclear_audio_with_uncertainty_flag():
    """Tests handling of noisy/unclear audio returning uncertainty warning and low confidence."""
    noisy_audio = make_wav_bytes("UNCLEAR_AUDIO_NOISY_SIGNAL", amplitude=50)
    response = client.post(
        "/api/v1/assistant/transcribe",
        files={"file": ("noisy.wav", noisy_audio, "audio/wav")},
        data={"language": "en"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["confidence"] < 0.60
    assert data["is_uncertain"] is True
    assert data["uncertainty_warning"] is not None
    assert "confidence is low" in data["uncertainty_warning"].lower()

# ==============================================================================
# 3. LLAMA 3 DEDICATED AI SERVICE & STATUTORY GROUNDING TESTS
# ==============================================================================

def test_llama3_answers_verified_speeding_rule():
    """Verifies Llama 3 answers speeding violation with grounded statutory citation."""
    response = client.post(
        "/api/v1/assistant/query",
        json={"query_text": "What is the penalty for over-speeding under Section 113?", "language": "en"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "VERIFIED"
    assert data["is_grounded"] is True
    assert "113" in data["reply_text"]
    assert "5,000" in data["reply_text"]
    assert len(data["rag_sources"]) >= 1

def test_llama3_answers_verified_helmet_rule_urdu():
    """Verifies Llama 3 answers motorcycle helmet query in Urdu with statutory fine."""
    response = client.post(
        "/api/v1/assistant/query",
        json={"query_text": "موٹر سائیکل پر ہیلمٹ نہ پہننے کی دفعہ 89-A کے تحت کیا سزا اور جرمانہ ہے؟", "language": "ur"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "VERIFIED"
    assert data["language"] == "ur"
    assert "89-A" in data["reply_text"]
    assert "2,000" in data["reply_text"] or "2000" in data["reply_text"]
    assert "روپے" in data["reply_text"]

def test_llama3_answers_verified_signal_rule_pashto():
    """Verifies Llama 3 answers signal violation query in Pashto."""
    response = client.post(
        "/api/v1/assistant/query",
        json={"query_text": "د اشارې ماتولو او سرې رڼا جریمه څومره ده؟", "language": "ps"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "VERIFIED"
    assert data["language"] == "ps"
    assert "روپۍ" in data["reply_text"] or "112" in data["reply_text"]

def test_llama3_handles_unsupported_out_of_scope_questions():
    """
    CRITICAL: Validates that Llama 3 does NOT hallucinate traffic laws or penalties
    when asked an unsupported, out-of-scope, or invented question.
    """
    response = client.post(
        "/api/v1/assistant/query",
        json={"query_text": "What is the statutory traffic fine for flying a drone on the motorway in rain?", "language": "en"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UNAVAILABLE"
    assert data["is_grounded"] is False
    # Must clearly communicate that the information is unavailable in official records
    assert "unavailable in our verified statutory traffic database" in data["reply_text"].lower()

def test_llama3_handles_general_conversation_greetings():
    """Verifies friendly greeting in Urdu without hallucinating traffic laws."""
    response = client.post(
        "/api/v1/assistant/query",
        json={"query_text": "السلام علیکم، آپ کون ہیں؟", "language": "ur"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "وعلیکم" in data["reply_text"] or "ٹریفک" in data["reply_text"]

# ==============================================================================
# 4. FULL VOICE PIPELINE (WHISPER STT + LLAMA 3 + TTS)
# ==============================================================================

def test_full_voice_audio_pipeline():
    """
    Tests the complete end-to-end voice pipeline:
    Audio Upload -> Whisper STT -> Grounded Llama 3 -> TTS audio synthesis.
    """
    wav_audio = make_wav_bytes("HELMET_89A")
    response = client.post(
        "/api/v1/assistant/voice-audio",
        files={"file": ("mic_recording.wav", wav_audio, "audio/wav")},
        data={"language": "ur"}
    )
    assert response.status_code == 200
    data = response.json()
    # 1. Transcript recognized by Whisper
    assert "transcript" in data
    assert "ہیلمٹ" in data["transcript"]
    # 2. Reply generated by Llama 3
    assert "reply_text" in data
    assert "89-A" in data["reply_text"]
    # 3. Spoken audio synthesized
    assert data["audio_base64"] is not None
    # 4. Transcription metadata attached
    assert "transcription_meta" in data
    assert data["transcription_meta"]["confidence"] >= 0.85
    assert data["transcription_meta"]["audio_format"] == "audio/wav"

# ==============================================================================
# 5. CONVERSATION HISTORY SECURE PERSISTENCE TESTS
# ==============================================================================

def test_conversation_history_persistence():
    """
    Verifies that multi-turn dialogue is securely persisted in ChatConversation
    and ChatMessage database tables and can be retrieved.
    """
    db = SessionLocal()
    try:
        session_id = f"test-sess-{struct.pack('<I', 12345).hex()}"
        
        # Turn 1: User asks about speeding
        res1 = client.post(
            "/api/v1/assistant/query",
            json={
                "query_text": "What is the speed fine?",
                "language": "en",
                "session_id": session_id
            }
        )
        assert res1.status_code == 200
        
        # Turn 2: User asks follow up about helmet
        res2 = client.post(
            "/api/v1/assistant/query",
            json={
                "query_text": "What about helmets under Section 89-A?",
                "language": "en",
                "session_id": session_id
            }
        )
        assert res2.status_code == 200
        
        # Verify Session History Endpoint
        hist_resp = client.get(f"/api/v1/assistant/conversations/{session_id}")
        assert hist_resp.status_code == 200
        hist = hist_resp.json()
        assert hist["session_id"] == session_id
        # Should contain at least 4 turns (2 user + 2 assistant)
        assert len(hist["messages"]) >= 4
        
        # Verify messages have sender types and timestamps
        senders = [m["sender_type"] for m in hist["messages"]]
        assert "USER" in senders
        assert "ASSISTANT" in senders
        
        # Verify deletion / clearing
        del_resp = client.delete(f"/api/v1/assistant/conversations/{session_id}")
        assert del_resp.status_code == 200
        
        # Verify it is gone
        check_del = client.get(f"/api/v1/assistant/conversations/{session_id}")
        assert check_del.status_code == 404
    finally:
        db.close()
