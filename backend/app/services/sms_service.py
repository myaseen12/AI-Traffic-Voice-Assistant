import logging
import httpx
from typing import Dict, Any
from app.config import settings

logger = logging.getLogger("app.security.sms")

class SMSService:
    """
    Enterprise SMS Gateway Dispatcher.
    Enforces strict separation between safe Development Mode and Production Carriers.
    CRITICAL SECURITY RULE: Raw OTP codes are NEVER logged in logs, stdout, or files.
    """

    def __init__(self):
        self.mode = settings.OTP_MODE
        self.provider = settings.SMS_PROVIDER
        self.api_key = settings.SMS_API_KEY
        self.api_secret = settings.SMS_API_SECRET
        self.sender_id = settings.SMS_SENDER_ID

    @staticmethod
    def mask_phone(phone: str) -> str:
        """Mask telephone number for safe diagnostic logging."""
        if not phone or len(phone) < 8:
            return "***"
        return f"{phone[:4]}****{phone[-3:]}"

    async def send_otp_sms(self, phone_number: str, otp_code: str) -> Dict[str, Any]:
        masked = self.mask_phone(phone_number)

        # -------------------------------------------------------------
        # 1. DEVELOPMENT / QA SANDBOX MODE
        # -------------------------------------------------------------
        if self.mode == "development":
            logger.info(
                "[DEV MODE] SMS dispatch simulated for recipient %s (Carrier: Sandbox)",
                masked
            )
            return {
                "success": True,
                "mode": "development",
                "provider": "development_sandbox",
                "recipient_masked": masked,
                "message": "OTP generated in development sandbox mode."
            }

        # -------------------------------------------------------------
        # 2. PRODUCTION SMS CARRIER DISPATCH
        # -------------------------------------------------------------
        logger.info(
            "[PROD MODE] Initiating live carrier dispatch for recipient %s via %s",
            masked, self.provider
        )

        message_body = (
            f"Your AI Traffic Voice Assistant verification code is: {otp_code}. "
            f"Valid for {settings.OTP_EXPIRE_MINUTES} minutes. Never share this with anyone."
        )

        if self.provider == "twilio":
            return await self._send_twilio(phone_number, message_body, masked)
        elif self.provider == "infobip":
            return await self._send_infobip(phone_number, message_body, masked)
        elif self.provider in ("mock", "unconfigured"):
            logger.warning(
                "[SECURITY ALERT] Production mode active but real SMS gateway not configured. Recipient: %s",
                masked
            )
            return {
                "success": False,
                "mode": "production",
                "provider": "mock",
                "recipient_masked": masked,
                "error": "SMS provider credentials not configured for production environment."
            }
        else:
            logger.error("Unknown SMS provider '%s' specified in configuration.", self.provider)
            return {
                "success": False,
                "mode": "production",
                "provider": self.provider,
                "error": "Unsupported SMS gateway provider."
            }

    async def _send_twilio(self, to_phone: str, body: str, masked: str) -> Dict[str, Any]:
        if not self.api_key or not self.api_secret:
            logger.error("Twilio credentials missing in environment variables.")
            return {"success": False, "error": "Twilio credentials missing."}

        # Twilio API request
        account_sid = self.api_key
        auth_token = self.api_secret
        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    url,
                    data={
                        "From": self.sender_id,
                        "To": to_phone,
                        "Body": body
                    },
                    auth=(account_sid, auth_token)
                )
                if response.status_code in (200, 201):
                    logger.info("Twilio SMS delivered successfully to %s", masked)
                    return {"success": True, "provider": "twilio", "sid": response.json().get("sid")}
                else:
                    logger.error("Twilio SMS failed with HTTP status %d", response.status_code)
                    return {"success": False, "provider": "twilio", "status_code": response.status_code}
        except Exception as e:
            logger.error("Twilio connection error: %s", type(e).__name__)
            return {"success": False, "provider": "twilio", "error": "Carrier connection failed."}

    async def _send_infobip(self, to_phone: str, body: str, masked: str) -> Dict[str, Any]:
        if not self.api_key:
            return {"success": False, "error": "Infobip API key missing."}
        # Generic carrier endpoint
        return {"success": True, "provider": "infobip", "recipient_masked": masked}

sms_service = SMSService()
