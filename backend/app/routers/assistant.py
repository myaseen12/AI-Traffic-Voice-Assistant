from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.auth.dependencies import get_optional_user, get_current_user
from app.models.user import User
from app.schemas.assistant import (
    VoiceQueryRequest,
    VoiceQueryResponse,
    AudioTranscriptionResponse,
    ConversationHistoryResponse,
    ConversationSummaryItem,
    TTSRequest,
    TTSResponse,
    VoiceQualityInfo,
)
from app.services.ai_service import AIService
from app.ai.tts.synthesizer import tts_synthesizer

router = APIRouter(prefix="/assistant", tags=["AI Voice Assistant"])

@router.post("/query", response_model=VoiceQueryResponse)
async def process_voice_or_text_query(
    req: VoiceQueryRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Accepts text or transcribed query and executes grounded Llama 3 statutory reasoning.
    Stores multi-turn interaction in the citizen conversation session.
    """
    ai_svc = AIService(db)
    user_id = req.user_id or (current_user.id if current_user else None)

    result = await ai_svc.ask(
        query=req.query_text,
        language=req.language or "en",
        session_id=req.session_id,
        user_id=user_id,
        vehicle_no=req.vehicle_no
    )
    return VoiceQueryResponse(**result)

@router.post("/transcribe", response_model=AudioTranscriptionResponse)
async def transcribe_audio_file(
    file: UploadFile = File(...),
    language: str = Form("en"),
    db: Session = Depends(get_db)
):
    """
    Dedicated Whisper Speech-to-Text Endpoint:
    - Accepts recorded audio in WAV, MP3, WebM, OGG, M4A, FLAC, or AAC.
    - Validates file format integrity (magic headers) and size limits (100 bytes - 25 MB).
    - Detects empty or silent audio.
    - Supports Urdu, Pashto, and English.
    - Returns transcription confidence and uncertainty warnings.
    - Preserves privacy: Audio bytes are processed in-memory and immediately discarded.
    """
    audio_bytes = await file.read()
    ai_svc = AIService(db)

    result = await ai_svc.transcriber.transcribe(
        audio_bytes=audio_bytes,
        filename=file.filename or "recording.wav",
        language=language,
        content_type=file.content_type
    )

    return AudioTranscriptionResponse(
        status="SUCCESS",
        transcript=result["transcript"],
        detected_language=result["detected_language"],
        confidence=result["confidence"],
        is_uncertain=result["is_uncertain"],
        uncertainty_warning=result["uncertainty_warning"],
        audio_format=result["audio_format"],
        duration_seconds=result["duration_seconds"]
    )

@router.post("/voice-audio", response_model=VoiceQueryResponse)
async def process_voice_audio(
    file: UploadFile = File(...),
    language: str = Form("en"),
    session_id: Optional[str] = Form(None),
    user_id: Optional[int] = Form(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Full Voice Pipeline:
    1. Transcribes incoming audio with Whisper STT.
    2. Validates format and checks for low confidence uncertainty.
    3. Feeds recognized speech to Grounded Llama 3 statutory AI engine.
    4. Generates plain-language explanation and synthesizes multilingual spoken voice.
    5. Saves conversation turn securely to database.
    """
    audio_bytes = await file.read()
    effective_user_id = user_id or (current_user.id if current_user else None)

    ai_svc = AIService(db)
    result = await ai_svc.process_audio_query(
        audio_bytes=audio_bytes,
        filename=file.filename or "recording.wav",
        language=language,
        session_id=session_id,
        user_id=effective_user_id,
        content_type=file.content_type
    )

    return VoiceQueryResponse(**result)

@router.get("/conversations/{session_id}", response_model=ConversationHistoryResponse)
@router.get("/history/{session_id}", response_model=ConversationHistoryResponse)
def get_conversation_history(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Retrieves full conversation history and statutory citations for a given session."""
    ai_svc = AIService(db)
    history = ai_svc.get_conversation_history(session_id)
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation session '{session_id}' not found."
        )
    return ConversationHistoryResponse(**history)

@router.get("/my-conversations", response_model=List[ConversationSummaryItem])
def get_my_conversations(
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Retrieves list of past AI traffic consultations for the authenticated citizen."""
    ai_svc = AIService(db)
    return ai_svc.get_user_conversations(user_id=current_user.id, skip=skip, limit=limit)

@router.delete("/conversations/{session_id}")
def delete_conversation_session(
    session_id: str,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Clears/resets an AI traffic conversation session."""
    ai_svc = AIService(db)
    user_id = current_user.id if current_user else None
    deleted = ai_svc.delete_conversation(session_id=session_id, user_id=user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation session '{session_id}' not found or access denied."
        )
    return {"status": "SUCCESS", "message": f"Conversation session '{session_id}' deleted successfully."}

@router.get("/tts/voices")
def get_tts_voices():
    """
    Returns supported voice profiles, models, and quality tiers for all languages.
    Clearly identifies which languages have high-quality neural voice vs low-resource support.
    """
    return {
        "supported_languages": ["en", "ur", "ps"],
        "voices": {
            lang: tts_synthesizer.get_voice_info(lang)
            for lang in ["en", "ur", "ps"]
        }
    }

@router.post("/tts", response_model=TTSResponse)
def text_to_speech(req: TTSRequest):
    """
    Synthesizes text into spoken voice audio with language-specific voice configuration.
    Refuses synthesis on empty text to avoid generating empty or corrupt audio.
    """
    if not req.text or not req.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voice synthesis cannot be generated for empty text."
        )

    result = tts_synthesizer.synthesize_detailed(req.text, req.language or "en")
    voice_info = result.get("voice_info")
    
    return TTSResponse(
        status="SUCCESS" if result.get("playable") else "FAILED",
        audio_base64=result.get("audio_base64"),
        format=result.get("format", "mp3"),
        duration_seconds=result.get("duration_seconds", 0.0),
        playable=result.get("playable", False),
        language=result.get("language", req.language or "en"),
        voice_info=VoiceQualityInfo(**voice_info) if voice_info else None,
        message=result.get("error")
    )
