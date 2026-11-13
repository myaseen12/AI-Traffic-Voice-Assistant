import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow"
    )

    APP_NAME: str = "AI Traffic Voice Assistant API"
    APP_ENV: str = os.getenv("APP_ENV", "development") # "development", "staging", "production"
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1")
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "127.0.0.1")

    # Security & JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecret-traffic-voice-assistant-jwt-key-development-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24))) # 24 hours

    # Authentication & OTP Policies
    OTP_MODE: str = os.getenv("OTP_MODE", "development") # "development" (returns demo code for testing) or "production"
    OTP_LENGTH: int = 6
    OTP_EXPIRE_MINUTES: int = int(os.getenv("OTP_EXPIRE_MINUTES", "5"))
    OTP_COOLDOWN_SECONDS: int = int(os.getenv("OTP_COOLDOWN_SECONDS", "60"))
    OTP_MAX_ATTEMPTS: int = int(os.getenv("OTP_MAX_ATTEMPTS", "5"))
    OTP_MAX_RESENDS_PER_HOUR: int = int(os.getenv("OTP_MAX_RESENDS_PER_HOUR", "5"))

    # SMS Gateway (invoked in production when credentials are provided)
    SMS_PROVIDER: str = os.getenv("SMS_PROVIDER", "mock") # "mock", "twilio", "infobip", "pta_gateway"
    SMS_API_KEY: str = os.getenv("SMS_API_KEY", "")
    SMS_API_SECRET: str = os.getenv("SMS_API_SECRET", "")
    SMS_SENDER_ID: str = os.getenv("SMS_SENDER_ID", "TRAFFICPOL")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./traffic_assistant.db")

    # AI & Speech (Llama 3 LLM & Whisper STT)
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "llama3") # "llama3", "groq", "ollama", "openai", "gemini", or "mock"
    LLAMA3_MODEL: str = os.getenv("LLAMA3_MODEL", "llama-3-8b-instruct")
    LLAMA3_API_BASE: str = os.getenv("LLAMA3_API_BASE", "http://localhost:11434/v1")
    LLAMA3_API_KEY: str = os.getenv("LLAMA3_API_KEY", "")
    LLAMA3_TEMPERATURE: float = float(os.getenv("LLAMA3_TEMPERATURE", "0.1"))
    LLAMA3_MAX_TOKENS: int = int(os.getenv("LLAMA3_MAX_TOKENS", "512"))

    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    WHISPER_PROVIDER: str = os.getenv("WHISPER_PROVIDER", "auto") # "auto", "local", "groq", "openai", "mock"
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "base")
    WHISPER_API_BASE: str = os.getenv("WHISPER_API_BASE", "")
    WHISPER_API_KEY: str = os.getenv("WHISPER_API_KEY", "")
    MAX_AUDIO_SIZE_BYTES: int = int(os.getenv("MAX_AUDIO_SIZE_BYTES", str(25 * 1024 * 1024))) # 25 MB
    MIN_AUDIO_SIZE_BYTES: int = int(os.getenv("MIN_AUDIO_SIZE_BYTES", "100")) # 100 bytes

    TTS_ENGINE: str = os.getenv("TTS_ENGINE", "gtts")
    DEFAULT_LANGUAGE: str = "en"

    # CORS Allowed Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://traffic-voice-assistant.vercel.app",
        "https://frontend-wheat-beta-16.vercel.app"
    ]

    @property
    def allowed_origins(self) -> List[str]:
        origins = list(self.CORS_ORIGINS)
        env_origins = os.getenv("ALLOWED_ORIGINS", os.getenv("CORS_ORIGINS", ""))
        if env_origins:
            for o in env_origins.split(","):
                clean = o.strip()
                if clean and clean not in origins:
                    origins.append(clean)
        return origins

settings = Settings()
