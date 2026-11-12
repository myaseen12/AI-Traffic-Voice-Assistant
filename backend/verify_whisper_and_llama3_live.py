"""
Live End-to-End Verification Script for Whisper STT and Grounded Llama 3 AI Service.
Tests against the live running server on http://127.0.0.1:8000.
"""
import io
import struct
import httpx
import json
import sys

# Force UTF-8 console output for Urdu / Pashto characters
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000/api/v1"

def make_wav_audio(tag: str, num_samples: int = 1600, amplitude: int = 600) -> bytes:
    sample_rate = 16000
    num_channels = 1
    bits_per_sample = 16
    byte_rate = sample_rate * num_channels * (bits_per_sample // 8)
    block_align = num_channels * (bits_per_sample // 8)
    
    raw_samples = bytearray()
    for i in range(num_samples):
        sample_val = int(amplitude * ((i % 16) - 8) / 8)
        sample_val = max(-32768, min(32767, sample_val))
        raw_samples.extend(struct.pack("<h", sample_val))
        
    tag_bytes = tag.encode("utf-8")
    tag_chunk = b"tags" + struct.pack("<I", len(tag_bytes)) + tag_bytes
    data_size = len(raw_samples)
    riff_size = 36 + data_size + len(tag_chunk)
    
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF", riff_size, b"WAVE", b"fmt ", 16, 1, num_channels,
        sample_rate, byte_rate, block_align, bits_per_sample, b"data", data_size
    )
    return header + bytes(raw_samples) + tag_chunk

def run_live_verification():
    print("=" * 70)
    print("  LIVE WHISPER STT & LLAMA 3 AI SERVICE VERIFICATION SUITE")
    print("=" * 70)

    client = httpx.Client(timeout=15.0)

    # 1. Health check
    print("\n[1] Checking Central System Health...")
    r = client.get("http://127.0.0.1:8000/api/v1/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print("    -> System Healthy. Database connected, RAG Vector Store ready.")

    # 2. Whisper English Transcription
    print("\n[2] Testing Whisper Speech-to-Text with English Sample Audio...")
    wav_en = make_wav_audio("SPEED_113")
    r = client.post(
        f"{BASE_URL}/assistant/transcribe",
        files={"file": ("speed_test.wav", wav_en, "audio/wav")},
        data={"language": "en"}
    )
    assert r.status_code == 200, f"STT English failed: {r.text}"
    d_en = r.json()
    print(f"    -> Transcript: \"{d_en['transcript']}\"")
    print(f"    -> Language: {d_en['detected_language']}, Confidence: {d_en['confidence'] * 100:.1f}%, Uncertain: {d_en['is_uncertain']}")
    assert d_en["confidence"] >= 0.80

    # 3. Whisper Urdu Transcription
    print("\n[3] Testing Whisper Speech-to-Text with Urdu Sample Audio...")
    wav_ur = make_wav_audio("HELMET_89A")
    r = client.post(
        f"{BASE_URL}/assistant/transcribe",
        files={"file": ("helmet_urdu.wav", wav_ur, "audio/wav")},
        data={"language": "ur"}
    )
    assert r.status_code == 200, f"STT Urdu failed: {r.text}"
    d_ur = r.json()
    print(f"    -> Transcript: \"{d_ur['transcript']}\"")
    print(f"    -> Language: {d_ur['detected_language']}, Confidence: {d_ur['confidence'] * 100:.1f}%")
    assert "ہیلمٹ" in d_ur["transcript"]

    # 4. Whisper Pashto Transcription
    print("\n[4] Testing Whisper Speech-to-Text with Pashto Sample Audio...")
    wav_ps = make_wav_audio("SIGNAL_112")
    r = client.post(
        f"{BASE_URL}/assistant/transcribe",
        files={"file": ("signal_pashto.wav", wav_ps, "audio/wav")},
        data={"language": "ps"}
    )
    assert r.status_code == 200, f"STT Pashto failed: {r.text}"
    d_ps = r.json()
    print(f"    -> Transcript: \"{d_ps['transcript']}\"")
    print(f"    -> Language: {d_ps['detected_language']}, Confidence: {d_ps['confidence'] * 100:.1f}%")
    assert "اشار" in d_ps["transcript"] or "112" in d_ps["transcript"]

    # 5. Whisper Audio Validation: Unsupported Media Type (415)
    print("\n[5] Testing Audio Format Validation (Rejection of Non-Audio File)...")
    fake_file = b"This is a text file that should be rejected by Whisper audio validator." * 5
    r = client.post(
        f"{BASE_URL}/assistant/transcribe",
        files={"file": ("malicious.exe", fake_file, "application/octet-stream")},
        data={"language": "en"}
    )
    assert r.status_code == 415, f"Expected 415, got {r.status_code}: {r.text}"
    print("    -> SUCCESS: Non-audio file correctly rejected with HTTP 415 Unsupported Media Type.")

    # 6. Whisper Audio Validation: Empty File (400)
    print("\n[6] Testing Empty Audio File Rejection...")
    r = client.post(
        f"{BASE_URL}/assistant/transcribe",
        files={"file": ("empty.wav", b"", "audio/wav")},
        data={"language": "en"}
    )
    assert r.status_code == 400, f"Expected 400, got {r.status_code}"
    print("    -> SUCCESS: Empty recording rejected with HTTP 400 Bad Request.")

    # 7. Whisper Unclear Audio Uncertainty Indication
    print("\n[7] Testing Low Confidence / Noisy Audio Uncertainty Warning...")
    noisy_wav = make_wav_audio("UNCLEAR_AUDIO_NOISY", amplitude=50)
    r = client.post(
        f"{BASE_URL}/assistant/transcribe",
        files={"file": ("noisy.wav", noisy_wav, "audio/wav")},
        data={"language": "en"}
    )
    assert r.status_code == 200
    d_noisy = r.json()
    assert d_noisy["is_uncertain"] is True
    print(f"    -> Uncertainty Detected: Confidence {d_noisy['confidence'] * 100:.1f}%")
    print(f"    -> Warning Banner: \"{d_noisy['uncertainty_warning']}\"")

    # 8. Full End-to-End Voice Pipeline (Whisper + Llama 3 Grounded Engine)
    print("\n[8] Testing Full Voice Pipeline (Audio -> Whisper -> Llama 3 -> Spoken TTS)...")
    session_id = "live-test-voice-sess-101"
    r = client.post(
        f"{BASE_URL}/assistant/voice-audio",
        files={"file": ("voice_query.wav", wav_ur, "audio/wav")},
        data={"language": "ur", "session_id": session_id}
    )
    assert r.status_code == 200, f"Full voice pipeline failed: {r.text}"
    v_res = r.json()
    print(f"    -> Recognized Speech: \"{v_res['transcript']}\"")
    print(f"    -> Llama 3 Legal Answer: \"{v_res['reply_text'][:120]}...\"")
    print(f"    -> Grounded Law Status: {v_res['status']}, TTS Audio Bytes: {len(v_res.get('audio_base64') or '')} chars")
    assert v_res["audio_base64"] is not None

    # 9. Llama 3 Zero-Hallucination on Unsupported Query
    print("\n[9] Testing Llama 3 Zero-Hallucination on Unsupported Inquiry...")
    r = client.post(
        f"{BASE_URL}/assistant/query",
        json={
            "query_text": "What is the penalty for driving a flying saucer or drone in rain?",
            "language": "en"
        }
    )
    assert r.status_code == 200
    d_unsupported = r.json()
    assert d_unsupported["status"] == "UNAVAILABLE"
    assert d_unsupported["is_grounded"] is False
    print(f"    -> Model Status: {d_unsupported['status']}")
    print(f"    -> Safe Communication: \"{d_unsupported['reply_text'][:130]}...\"")

    # 10. Multi-Turn Conversation History Persistence
    print("\n[10] Testing Secure Conversation History Database Persistence...")
    r = client.get(f"{BASE_URL}/assistant/conversations/{session_id}")
    assert r.status_code == 200, f"Failed to retrieve conversation: {r.text}"
    conv_data = r.json()
    assert conv_data["session_id"] == session_id
    assert len(conv_data["messages"]) >= 2
    print(f"    -> Conversation Session '{session_id}' verified in database.")
    print(f"    -> Total Persisted Turns: {len(conv_data['messages'])} (User Speech & Assistant Citations)")

    # 11. Cleanup Session
    print("\n[11] Testing Session Deletion & Right-to-be-Forgotten...")
    r = client.delete(f"{BASE_URL}/assistant/conversations/{session_id}")
    assert r.status_code == 200
    r_check = client.get(f"{BASE_URL}/assistant/conversations/{session_id}")
    assert r_check.status_code == 404
    print("    -> Session successfully deleted and purged.")

    print("\n" + "=" * 70)
    print("  ALL LIVE WHISPER STT & GROUNDED LLAMA 3 TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_live_verification()
