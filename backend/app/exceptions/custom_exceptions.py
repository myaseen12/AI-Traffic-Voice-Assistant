from typing import Optional, Any, Dict

class TrafficAppException(Exception):
    """Base exception for AI Traffic Voice Assistant backend."""
    def __init__(
        self,
        message: str,
        status_code: int = 400,
        error_code: str = "BAD_REQUEST",
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        super().__init__(message)

class NotFoundError(TrafficAppException):
    def __init__(self, message: str = "Requested resource not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=404, error_code="RESOURCE_NOT_FOUND", details=details)

class UnauthorizedError(TrafficAppException):
    def __init__(self, message: str = "Authentication required or invalid credentials", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=401, error_code="UNAUTHORIZED", details=details)

class ForbiddenError(TrafficAppException):
    def __init__(self, message: str = "Access forbidden: insufficient administrative clearance", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=403, error_code="FORBIDDEN", details=details)

class ValidationError(TrafficAppException):
    def __init__(self, message: str = "Validation failed for supplied input", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=422, error_code="VALIDATION_ERROR", details=details)

class CitationAlreadyPaidError(TrafficAppException):
    def __init__(self, challan_no: str):
        super().__init__(
            message=f"Traffic citation {challan_no} has already been settled and cleared.",
            status_code=400,
            error_code="CHALLAN_ALREADY_PAID",
            details={"challan_no": challan_no}
        )

class UnsupportedAudioFormatError(TrafficAppException):
    def __init__(self, message: str = "Unsupported audio format. Supported formats: WAV, MP3, WebM, OGG, M4A, FLAC, AAC.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=415, error_code="UNSUPPORTED_AUDIO_FORMAT", details=details)

class AudioSizeLimitExceededError(TrafficAppException):
    def __init__(self, message: str = "Audio recording exceeds the maximum allowable upload size (25 MB).", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=413, error_code="AUDIO_SIZE_LIMIT_EXCEEDED", details=details)

class EmptyAudioError(TrafficAppException):
    def __init__(self, message: str = "Audio recording is empty, silent, or below minimum length. Please speak clearly into the microphone.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=400, error_code="EMPTY_OR_SILENT_AUDIO", details=details)

class AudioTranscriptionError(TrafficAppException):
    def __init__(self, message: str = "Failed to transcribe audio speech. Please try again or type your question.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=502, error_code="TRANSCRIPTION_ENGINE_ERROR", details=details)