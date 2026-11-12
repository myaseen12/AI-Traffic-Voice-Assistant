import re
import uuid
import json
import logging
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.config import settings
from app.models.chat import ChatConversation, ChatMessage, MessageSenderType
from app.models.voice_log import VoiceLog
from app.models.traffic_rule import TrafficRule, RuleVerificationStatus
from app.models.user import User
from app.ai.whisper.transcriber import speech_transcriber
from app.ai.llm.llama3_engine import llama3_engine
from app.ai.tts.synthesizer import tts_synthesizer
from app.services.challan_service import ChallanService
from app.rag.verified_rules import VERIFIED_TRAFFIC_RULES
from app.rag.chroma_service import chroma_rag_service

logger = logging.getLogger("app.services.ai_service")

class AIService:
    """
    Dedicated AI Service orchestrating:
    - Whisper Speech-to-Text audio transcription.
    - Grounded Llama 3 legal reasoning with statutory context.
    - Multilingual synthesis (Urdu, Pashto, English).
    - Handling unsupported / out-of-scope inquiries with zero hallucinations.
    - Secure conversation and chat turn persistence.
    """

    def __init__(self, db: Session):
        self.db = db
        self.transcriber = speech_transcriber
        self.engine = llama3_engine
        self.tts = tts_synthesizer
        self.challan_svc = ChallanService(db)

    def normalize_language(self, language: Optional[str]) -> str:
        if not language:
            return "en"
        lang = language.lower().strip().replace("-", "_")
        if "ur" in lang or "urdu" in lang:
            return "ur"
        elif "ps" in lang or "pashto" in lang or "pushto" in lang:
            return "ps"
        return "en"

    # -------------------------------------------------------------------------
    # Conversation Session Management
    # -------------------------------------------------------------------------
    def get_or_create_conversation(
        self,
        session_id: Optional[str] = None,
        user_id: Optional[int] = None,
        language: str = "en",
        title: Optional[str] = None
    ) -> ChatConversation:
        """
        Retrieves active conversation by session_id or creates a new secure session.
        """
        conv = None
        if session_id:
            conv = self.db.query(ChatConversation).filter(
                ChatConversation.session_id == session_id
            ).first()

        if not conv:
            new_session_id = session_id or f"conv-{uuid.uuid4().hex[:16]}"
            conv = ChatConversation(
                session_id=new_session_id,
                user_id=user_id,
                language=self.normalize_language(language),
                title=title or "AI Traffic Assistance",
                channel="web_voice",
                is_active=True
            )
            self.db.add(conv)
            self.db.commit()
            self.db.refresh(conv)
        else:
            if user_id and not conv.user_id:
                conv.user_id = user_id
                self.db.commit()

        return conv

    def save_chat_turn(
        self,
        conversation_id: int,
        sender_type: MessageSenderType,
        content: str,
        detected_language: str,
        detected_intent: Optional[str] = None,
        rag_sources: Optional[List[Dict[str, Any]]] = None,
        audio_duration_ms: Optional[int] = None
    ) -> ChatMessage:
        """Saves a message turn securely into the database."""
        msg = ChatMessage(
            conversation_id=conversation_id,
            sender_type=sender_type,
            content=content,
            detected_language=detected_language,
            detected_intent=detected_intent,
            audio_duration_ms=audio_duration_ms
        )
        if rag_sources:
            msg.set_rag_sources(rag_sources)

        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)
        return msg

    # -------------------------------------------------------------------------
    # Grounded Statutory Rules Retrieval
    # -------------------------------------------------------------------------
    def retrieve_verified_rules(self, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        """
        Retrieves verified statutory traffic rules using ChromaDB persistent collection
        and SQLite database.
        Guarantees that unverified, pending, or arbitrary rules are NEVER passed as context.
        """
        q_clean = query.lower().strip()
        matched_rules: List[Dict[str, Any]] = []

        # 1. Query ChromaDB Vector Store
        try:
            chroma_res = chroma_rag_service.query_laws(query=query, language="en", top_k=top_k, verified_only=True)
            if chroma_res.get("has_results") and chroma_res.get("rules"):
                matched_rules.extend(chroma_res["rules"])
        except Exception as e:
            logger.warning(f"ChromaDB retrieval warning: {e}")

        # 2. Also search DB verified rules if needed
        if len(matched_rules) < top_k:
            substantive_topics = [
                ("speed", ["speed", "speeding", "over-speeding", "fast", "تیز رفتاری", "رفتار", "سرعت", "ګړندی"]),
                ("helmet", ["helmet", "headgear", "ہیلمٹ", "هیلمټ", "خولۍ"]),
                ("seatbelt", ["seatbelt", "belt", "سیٹ بیلٹ", "بیلٹ", "سیټ بیلٹ"]),
                ("signal", ["signal", "red light", "traffic light", "سگنل", "اشارہ", "اشاره", "اشارې", "اشار", "سیګنال", "څراغ", "ماتولو"]),
                ("mobile", ["mobile", "phone", "cellphone", "موبائل", "فون", "مبایل", "ګرځنده"]),
                ("license", ["license", "licence", "driving license", "لائسنس", "لایسنس", "جواز"]),
            ]
            db_rules = self.db.query(TrafficRule).filter(
                TrafficRule.is_active == True,
                TrafficRule.verification_status == RuleVerificationStatus.VERIFIED.value
            ).all()

            for r in db_rules:
                score = 0
                sec_lower = r.section.lower()
                for sn in ["113", "89-a", "89a", "89-b", "89b", "112", "116", "3"]:
                    if sn in q_clean and sn in sec_lower:
                        score += 20

                for cat, kw_list in substantive_topics:
                    for kw in kw_list:
                        if kw in q_clean:
                            combined = f"{r.title} {r.title_ur or ''} {r.title_ps or ''} {r.description} {r.category}".lower()
                            if kw in combined or cat.lower() in r.category.lower():
                                score += 12

                if score > 0:
                    matched_rules.append({
                        "id": f"RULE-DB-{r.id}",
                        "section": r.section,
                        "title_en": r.title,
                        "title_ur": r.title_ur or r.title,
                        "title_ps": r.title_ps or r.title,
                        "category": r.category,
                        "penalty_amount": float(r.fine_amount),
                        "points": r.penalty_points,
                        "jurisdiction": r.jurisdiction,
                        "legal_basis": r.source_wording or r.description,
                        "explanation_en": r.description,
                        "explanation_ur": r.description_ur or r.description,
                        "explanation_ps": r.description_ps or r.description
                    })

        # Deduplicate by section
        unique_rules = []
        seen_sections = set()
        for r in matched_rules:
            sec_key = r["section"][:15].strip()
            if sec_key not in seen_sections:
                seen_sections.add(sec_key)
                unique_rules.append(r)
                if len(unique_rules) >= top_k:
                    break

        return unique_rules

    # -------------------------------------------------------------------------
    # Core User Question Answering (Llama 3 Grounded Engine)
    # -------------------------------------------------------------------------
    async def ask(
        self,
        query: str,
        language: str = "en",
        session_id: Optional[str] = None,
        user_id: Optional[int] = None,
        vehicle_no: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Accepts user question, retrieves grounded context, runs Llama 3 synthesis,
        stores the conversation turn securely, and returns synthesized answer with audio.
        """
        lang = self.normalize_language(language)

        # 1. Retrieve or create Conversation Session
        conv = self.get_or_create_conversation(session_id=session_id, user_id=user_id, language=lang)

        # 2. Extract vehicle plate or citation number if present in query
        detected_vehicle = vehicle_no or self._extract_vehicle_number(query)
        detected_challan = self._extract_challan_number(query)

        # 3. Handle Direct Vehicle or Challan Lookup
        action_data = None
        challan_context = None

        if detected_vehicle:
            challans = self.challan_svc.search(detected_vehicle)
            action_data = [
                {
                    "challan_no": c.challan_no,
                    "amount": float(c.amount),
                    "status": c.status.value,
                    "location": c.location,
                    "violation": c.violation.title if c.violation else "Traffic Violation"
                }
                for c in challans
            ]
            if challans:
                c_first = challans[0]
                challan_context = {
                    "challan_no": c_first.challan_no,
                    "amount": float(c_first.amount),
                    "status": c_first.status.value,
                    "location": c_first.location,
                    "violation": {"title": c_first.violation.title if c_first.violation else "Traffic Citation"}
                }
        elif detected_challan:
            try:
                c = self.challan_svc.get_by_challan_no(detected_challan)
                if c:
                    action_data = [{
                        "challan_no": c.challan_no,
                        "amount": float(c.amount),
                        "status": c.status.value,
                        "location": c.location,
                        "violation": c.violation.title if c.violation else "Traffic Citation"
                    }]
                    challan_context = {
                        "challan_no": c.challan_no,
                        "amount": float(c.amount),
                        "status": c.status.value,
                        "location": c.location,
                        "violation": {"title": c.violation.title if c.violation else "Traffic Citation"}
                    }
            except Exception:
                pass

        # 4. Retrieve Verified Statutory Rules
        verified_rules = []
        if not challan_context:
            verified_rules = self.retrieve_verified_rules(query, top_k=2)

        # 5. Load recent chat history turns
        recent_turns: List[Dict[str, str]] = []
        past_msgs = self.db.query(ChatMessage).filter(
            ChatMessage.conversation_id == conv.id
        ).order_by(ChatMessage.created_at.desc()).limit(4).all()

        for m in reversed(past_msgs):
            recent_turns.append({
                "role": "user" if m.sender_type == MessageSenderType.USER else "assistant",
                "content": m.content
            })

        # 6. Execute Grounded Llama 3 Inference
        llama_res = await self.engine.generate_response(
            query=query,
            context_rules=verified_rules,
            language=lang,
            challan_context=challan_context,
            chat_history=recent_turns
        )

        reply_text = llama_res["reply_text"]
        intent = "CHECK_CHALLAN" if challan_context else (
            "TRAFFIC_RULE_INFO" if verified_rules else llama_res.get("status", "GENERAL")
        )
        status_flag = llama_res.get("status", "VERIFIED")

        # 7. Synthesize Spoken TTS Audio (Multilingual Coqui/gTTS)
        audio_b64 = None
        audio_format = "mp3"
        voice_info = None
        try:
            tts_res = self.tts.synthesize_detailed(reply_text, language=lang)
            audio_b64 = tts_res.get("audio_base64")
            audio_format = tts_res.get("format", "mp3")
            voice_info = tts_res.get("voice_info")
        except Exception as e:
            logger.warning(f"TTS synthesis warning: {e}")

        # 8. Securely Persist Interaction in Database
        # User message turn
        self.save_chat_turn(
            conversation_id=conv.id,
            sender_type=MessageSenderType.USER,
            content=query,
            detected_language=lang,
            detected_intent=intent
        )

        # Assistant response turn
        self.save_chat_turn(
            conversation_id=conv.id,
            sender_type=MessageSenderType.ASSISTANT,
            content=reply_text,
            detected_language=lang,
            detected_intent=intent,
            rag_sources=verified_rules
        )

        # Log into VoiceLog for telemetry
        try:
            vlog = VoiceLog(
                user_id=user_id,
                query_text=query,
                response_text=reply_text,
                detected_intent=intent,
                language=lang
            )
            self.db.add(vlog)
            self.db.commit()
        except Exception:
            self.db.rollback()

        return {
            "session_id": conv.session_id,
            "transcript": query,
            "reply_text": reply_text,
            "audio_base64": audio_b64,
            "audio_format": audio_format,
            "voice_info": voice_info,
            "intent": intent,
            "status": status_flag,
            "language": lang,
            "is_grounded": llama_res.get("is_grounded", False),
            "model_used": llama_res.get("model_used", "llama-3-8b-instruct"),
            "rag_sources": verified_rules,
            "action_data": action_data
        }

    # -------------------------------------------------------------------------
    # Audio Speech Transcription + Answering Pipeline (Whisper + Llama 3)
    # -------------------------------------------------------------------------
    async def process_audio_query(
        self,
        audio_bytes: bytes,
        filename: str = "recording.wav",
        language: str = "en",
        session_id: Optional[str] = None,
        user_id: Optional[int] = None,
        content_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Full Pipeline:
        1. Validates audio format, size, and silence.
        2. Transcribes with Whisper STT (Urdu, Pashto, English).
        3. Measures confidence & uncertainty warning.
        4. Wipes audio from memory immediately (Privacy Guard).
        5. Hands transcript over to Grounded Llama 3 AI Engine.
        """
        stt_result = await self.transcriber.transcribe(
            audio_bytes=audio_bytes,
            filename=filename,
            language=language,
            content_type=content_type
        )

        transcript = stt_result["transcript"]
        detected_lang = stt_result["detected_language"]

        ai_result = await self.ask(
            query=transcript,
            language=detected_lang,
            session_id=session_id,
            user_id=user_id
        )

        ai_result["transcription_meta"] = {
            "confidence": stt_result["confidence"],
            "is_uncertain": stt_result["is_uncertain"],
            "uncertainty_warning": stt_result["uncertainty_warning"],
            "audio_format": stt_result["audio_format"],
            "duration_seconds": stt_result["duration_seconds"]
        }

        return ai_result

    # -------------------------------------------------------------------------
    # History & Session Inspection
    # -------------------------------------------------------------------------
    def get_conversation_history(self, session_id: str, limit: int = 50) -> Optional[Dict[str, Any]]:
        """Retrieves messages for a session."""
        conv = self.db.query(ChatConversation).filter(
            ChatConversation.session_id == session_id
        ).first()

        if not conv:
            return None

        messages = self.db.query(ChatMessage).filter(
            ChatMessage.conversation_id == conv.id
        ).order_by(ChatMessage.created_at.asc()).limit(limit).all()

        return {
            "session_id": conv.session_id,
            "title": conv.title,
            "language": conv.language,
            "user_id": conv.user_id,
            "created_at": conv.created_at.isoformat() if conv.created_at else None,
            "updated_at": conv.updated_at.isoformat() if conv.updated_at else None,
            "messages": [
                {
                    "id": m.id,
                    "sender_type": m.sender_type.value if hasattr(m.sender_type, "value") else str(m.sender_type),
                    "content": m.content,
                    "detected_language": m.detected_language,
                    "detected_intent": m.detected_intent,
                    "rag_sources": m.get_rag_sources(),
                    "created_at": m.created_at.isoformat() if m.created_at else None
                }
                for m in messages
            ]
        }

    def get_user_conversations(self, user_id: int, skip: int = 0, limit: int = 20) -> List[Dict[str, Any]]:
        """Lists conversations for an authenticated user."""
        convs = self.db.query(ChatConversation).filter(
            ChatConversation.user_id == user_id
        ).order_by(ChatConversation.updated_at.desc()).offset(skip).limit(limit).all()

        results = []
        for c in convs:
            msg_count = self.db.query(ChatMessage).filter(ChatMessage.conversation_id == c.id).count()
            results.append({
                "session_id": c.session_id,
                "title": c.title,
                "language": c.language,
                "message_count": msg_count,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "updated_at": c.updated_at.isoformat() if c.updated_at else None
            })
        return results

    def delete_conversation(self, session_id: str, user_id: Optional[int] = None) -> bool:
        """Deletes a conversation session."""
        query = self.db.query(ChatConversation).filter(ChatConversation.session_id == session_id)
        if user_id:
            query = query.filter(ChatConversation.user_id == user_id)
        conv = query.first()
        if not conv:
            return False

        self.db.delete(conv)
        self.db.commit()
        return True

    def _extract_vehicle_number(self, text: str) -> Optional[str]:
        pattern = r'\b([A-Z]{2,4}[ -]?[0-9]{2,4}[ -]?[A-Z0-9]{1,4})\b'
        match = re.search(pattern, text.upper())
        if match:
            return re.sub(r'[\s]', '-', match.group(0))
        return None

    def _extract_challan_number(self, text: str) -> Optional[str]:
        pattern = r'\b(CH[-0-9A-Z]{6,20}|PK[-0-9A-Z]{6,20})\b'
        match = re.search(pattern, text.upper())
        if match:
            return match.group(0)
        return None
