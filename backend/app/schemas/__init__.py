from app.schemas.user import UserCreate, UserResponse, Token, LoginRequest, SendOTPRequest, VerifyOTPRequest
from app.schemas.violation import ViolationCreate, ViolationResponse
from app.schemas.challan import ChallanCreate, ChallanResponse, ChallanPayRequest, ChallanPayResponse
from app.schemas.assistant import VoiceQueryRequest, VoiceQueryResponse, TTSRequest, OCRScanResponse

__all__ = [
    "UserCreate", "UserResponse", "Token", "LoginRequest", "SendOTPRequest", "VerifyOTPRequest",
    "ViolationCreate", "ViolationResponse",
    "ChallanCreate", "ChallanResponse", "ChallanPayRequest", "ChallanPayResponse",
    "VoiceQueryRequest", "VoiceQueryResponse", "TTSRequest", "OCRScanResponse"
]
