from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class VoiceQueryRequest(BaseModel):
    query_text: str
    language: Optional[str] = "en" # "en", "ur", "ps"
    session_id: Optional[str] = None
    user_id: Optional[int] = None
    vehicle_no: Optional[str] = None

class VoiceQueryResponse(BaseModel):
    session_id: Optional[str] = None
    transcript: str
    reply_text: str
    audio_base64: Optional[str] = None
    audio_format: Optional[str] = "mp3"
    voice_info: Optional[Dict[str, Any]] = None
    intent: str
    status: Optional[str] = "VERIFIED" # "VERIFIED", "UNAVAILABLE", "GENERAL_GREETING"
    language: str
    is_grounded: Optional[bool] = False
    model_used: Optional[str] = "llama-3-8b-instruct"
    action_data: Optional[Any] = None # e.g. list of challans or violation details
    rag_sources: Optional[List[Dict[str, Any]]] = None
    transcription_meta: Optional[Dict[str, Any]] = None

class AudioTranscriptionResponse(BaseModel):
    status: str = "SUCCESS"
    transcript: str
    detected_language: str
    confidence: float
    is_uncertain: bool = False
    uncertainty_warning: Optional[str] = None
    audio_format: str
    duration_seconds: float

class VoiceQualityInfo(BaseModel):
    voice_name: str
    language: str
    quality_tier: str  # "HIGH_QUALITY", "LOW_RESOURCE", "UNSUPPORTED"
    is_high_quality: bool
    warning: Optional[str] = None
    engine: str

class TTSRequest(BaseModel):
    text: str
    language: Optional[str] = "en"

class TTSResponse(BaseModel):
    status: str = "SUCCESS"
    audio_base64: Optional[str] = None
    format: Optional[str] = "mp3"
    duration_seconds: float = 0.0
    playable: bool = False
    language: str = "en"
    voice_info: Optional[VoiceQualityInfo] = None
    message: Optional[str] = None

class ChatMessageItem(BaseModel):
    id: int
    sender_type: str
    content: str
    detected_language: Optional[str] = None
    detected_intent: Optional[str] = None
    rag_sources: Optional[List[Dict[str, Any]]] = None
    created_at: Optional[str] = None

class ConversationHistoryResponse(BaseModel):
    session_id: str
    title: str
    language: str
    user_id: Optional[int] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    messages: List[ChatMessageItem]

class ConversationSummaryItem(BaseModel):
    session_id: str
    title: str
    language: str
    message_count: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class OCRScanResponse(BaseModel):
    challan_no: Optional[str] = None
    vehicle_no: Optional[str] = None
    violation_name: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    raw_text: str
    confidence: float
