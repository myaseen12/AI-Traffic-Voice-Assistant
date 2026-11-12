import base64
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.ai.tts.synthesizer import tts_synthesizer, CoquiTTSSynthesizer

client = TestClient(app)


def test_voice_configurations():
    """Validates language-specific voice profiles and low-resource transparency."""
    # English Voice Profile
    v_en = tts_synthesizer.get_voice_info("en")
    assert v_en["quality_tier"] == "HIGH_QUALITY"
    assert v_en["is_high_quality"] is True
    assert v_en["warning"] is None
    assert "English" in v_en["voice_name"]

    # Urdu Voice Profile
    v_ur = tts_synthesizer.get_voice_info("ur")
    assert v_ur["quality_tier"] == "HIGH_QUALITY"
    assert v_ur["is_high_quality"] is True
    assert v_ur["warning"] is None
    assert "Urdu" in v_ur["voice_name"]

    # Pashto Voice Profile: Must clearly identify low-resource status
    v_ps = tts_synthesizer.get_voice_info("ps")
    assert v_ps["quality_tier"] == "LOW_RESOURCE"
    assert v_ps["is_high_quality"] is False
    assert v_ps["warning"] is not None
    assert "unavailable for Pashto" in v_ps["warning"]
    assert "phonetic approximation" in v_ps["warning"]


def test_empty_response_prevention():
    """Ensures audio is NEVER generated when text is empty or blank."""
    # Empty string
    res_empty = tts_synthesizer.synthesize_detailed("")
    assert res_empty["audio_base64"] is None
    assert res_empty["playable"] is False
    assert res_empty["error"] == "EMPTY_TEXT"
    assert tts_synthesizer.synthesize("") is None

    # Whitespace only
    res_ws = tts_synthesizer.synthesize_detailed("   \t  \n  ")
    assert res_ws["audio_base64"] is None
    assert res_ws["playable"] is False
    assert res_ws["error"] == "EMPTY_TEXT"
    assert tts_synthesizer.synthesize("   \n   ") is None

    # None input
    res_none = tts_synthesizer.synthesize_detailed(None)
    assert res_none["audio_base64"] is None
    assert res_none["playable"] is False


def test_synthesize_english_playable():
    """Tests English speech synthesis produces valid playable audio."""
    text = "The speed limit on Islamabad Expressway is 80 kilometers per hour."
    res = tts_synthesizer.synthesize_detailed(text, language="en")

    assert res["playable"] is True
    assert res["audio_base64"] is not None
    assert res["duration_seconds"] > 0
    assert res["format"] in ["mp3", "wav"]
    assert res["voice_info"]["quality_tier"] == "HIGH_QUALITY"

    raw_audio = base64.b64decode(res["audio_base64"])
    assert len(raw_audio) > 500
    # Playable audio header: MP3 frame or RIFF WAVE
    is_mp3 = raw_audio.startswith(b"ID3") or raw_audio[:2] in [b"\xff\xfb", b"\xff\xf3", b"\xff\xf2"]
    is_wav = raw_audio.startswith(b"RIFF") and b"WAVE" in raw_audio[:16]
    assert is_mp3 or is_wav


def test_synthesize_urdu_playable():
    """Tests Urdu speech synthesis generates valid playable audio."""
    text = "موٹر وہیکل آرڈیننس کے تحت ہیلمٹ نہ پہننے پر جرمانہ 2000 روپے ہے۔"
    res = tts_synthesizer.synthesize_detailed(text, language="ur")

    assert res["playable"] is True
    assert res["audio_base64"] is not None
    assert res["voice_info"]["quality_tier"] == "HIGH_QUALITY"
    assert res["voice_info"]["is_high_quality"] is True

    raw_audio = base64.b64decode(res["audio_base64"])
    assert len(raw_audio) > 500


def test_synthesize_pashto_low_resource_flag():
    """Tests Pashto synthesis generates playable audio while explicitly flagging low-resource status."""
    text = "د اشارې ماتولو جریمه څومره ده؟"
    res = tts_synthesizer.synthesize_detailed(text, language="ps")

    assert res["playable"] is True
    assert res["audio_base64"] is not None
    assert res["voice_info"]["quality_tier"] == "LOW_RESOURCE"
    assert res["voice_info"]["is_high_quality"] is False
    assert "Pashto" in res["voice_info"]["warning"]

    raw_audio = base64.b64decode(res["audio_base64"])
    assert len(raw_audio) > 500


def test_resilient_wav_generator():
    """Tests the standalone offline acoustic WAV generator guarantees playable audio."""
    synth = CoquiTTSSynthesizer()
    wav_bytes = synth._synthesize_wav_fallback("Traffic citation verification confirmed.")

    assert len(wav_bytes) > 1000
    assert wav_bytes.startswith(b"RIFF")
    assert b"WAVE" in wav_bytes[:16]

    duration = synth._calculate_wav_duration(wav_bytes)
    assert duration > 0.5


def test_api_get_voices():
    """Tests GET /api/v1/assistant/tts/voices returns language profiles."""
    resp = client.get("/api/v1/assistant/tts/voices")
    assert resp.status_code == 200
    data = resp.json()
    assert "voices" in data
    assert data["voices"]["en"]["quality_tier"] == "HIGH_QUALITY"
    assert data["voices"]["ur"]["quality_tier"] == "HIGH_QUALITY"
    assert data["voices"]["ps"]["quality_tier"] == "LOW_RESOURCE"
    assert "unavailable for Pashto" in data["voices"]["ps"]["warning"]


def test_api_tts_empty_text_rejected():
    """Tests POST /api/v1/assistant/tts enforces validation against empty text."""
    # Empty text
    resp_empty = client.post("/api/v1/assistant/tts", json={"text": "", "language": "en"})
    assert resp_empty.status_code == 400
    assert "empty" in resp_empty.json()["detail"].lower()

    # Whitespace text
    resp_ws = client.post("/api/v1/assistant/tts", json={"text": "    \n   ", "language": "en"})
    assert resp_ws.status_code == 400
    assert "empty" in resp_ws.json()["detail"].lower()


def test_api_tts_valid_synthesis():
    """Tests POST /api/v1/assistant/tts successfully synthesizes spoken voice audio."""
    resp = client.post(
        "/api/v1/assistant/tts",
        json={"text": "Your challan has been verified.", "language": "en"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "SUCCESS"
    assert data["playable"] is True
    assert data["audio_base64"] is not None
    assert data["voice_info"]["quality_tier"] == "HIGH_QUALITY"

    # Pashto synthesis API check
    resp_ps = client.post(
        "/api/v1/assistant/tts",
        json={"text": "د موټر چلولو لایسنس", "language": "ps"}
    )
    assert resp_ps.status_code == 200
    data_ps = resp_ps.json()
    assert data_ps["status"] == "SUCCESS"
    assert data_ps["playable"] is True
    assert data_ps["voice_info"]["quality_tier"] == "LOW_RESOURCE"
    assert "Pashto" in data_ps["voice_info"]["warning"]
