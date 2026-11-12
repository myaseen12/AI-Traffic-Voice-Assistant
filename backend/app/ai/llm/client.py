import re
from typing import Dict, Any, Optional, List
from app.config import settings
from app.rag.chroma_service import chroma_rag_service
from app.ai.llm.llama3_engine import llama3_engine

class Llama3Assistant:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.rag = chroma_rag_service
        self.engine = llama3_engine

    def extract_vehicle_number(self, text: str) -> Optional[str]:
        """
        Extracts Pakistan vehicle registration plates:
        e.g. ICT-LE-402, LEB-19-4402, RIP-8839, KHI-2021-9988, Peshawar PR-1234
        """
        pattern = r'\b([A-Z]{2,4}[ -]?[0-9]{2,4}[ -]?[A-Z0-9]{1,4})\b'
        match = re.search(pattern, text.upper())
        if match:
            clean = re.sub(r'[\s]', '-', match.group(0))
            return clean
        return None

    def extract_challan_number(self, text: str) -> Optional[str]:
        pattern = r'\b(CH[-0-9A-Z]{6,20}|PK[-0-9A-Z]{6,20})\b'
        match = re.search(pattern, text.upper())
        if match:
            return match.group(0)
        return None

    async def analyze_query(
        self,
        query: str,
        language: str = "en", # 'en', 'ur', 'ps'
        context_data: Optional[Dict[str, Any]] = None,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Analyzes citizen queries using Llama 3 logic grounded in ChromaDB RAG.
        Strictly adheres to verified Pakistan traffic statutes.
        """
        lang = language.lower() if language else "en"
        if lang not in ["en", "ur", "ps", "urdu", "pashto"]:
            lang = "en"
        if lang in ["urdu"]:
            lang = "ur"
        if lang in ["pashto"]:
            lang = "ps"

        vehicle_no = self.extract_vehicle_number(query)
        challan_no = self.extract_challan_number(query)

        # 1. If citizen queries a vehicle or challan ID directly
        if vehicle_no or challan_no:
            if vehicle_no:
                if lang == "ur":
                    reply = f"گاڑی نمبر {vehicle_no} کے لیے فعال ای چالان کی تفصیلات حاصل کی جا رہی ہیں۔"
                elif lang == "ps":
                    reply = f"د ګاډي نمبر {vehicle_no} لپاره د فعال چالان جزئیات پلټل کیږي."
                else:
                    reply = f"Retrieving active e-challan records for vehicle {vehicle_no}."

                return {
                    "intent": "CHECK_CHALLAN_BY_VEHICLE",
                    "reply_text": reply,
                    "vehicle_no": vehicle_no,
                    "language": lang,
                    "status": "VERIFIED",
                    "rag_sources": []
                }
            elif challan_no:
                if lang == "ur":
                    reply = f"چالان نمبر {challan_no} کا تصدیق شدہ ریکارڈ نکالا جا رہا ہے۔"
                elif lang == "ps":
                    reply = f"د چالان نمبر {challan_no} تصدیق شوي معلومات راخیستل کیږي."
                else:
                    reply = f"Fetching verified citation details for Challan #{challan_no}."

                return {
                    "intent": "CHECK_CHALLAN_BY_ID",
                    "reply_text": reply,
                    "challan_no": challan_no,
                    "language": lang,
                    "status": "VERIFIED",
                    "rag_sources": []
                }

        # 2. RAG Retrieval via ChromaDB
        relevant_rules = self.rag.query_laws(query, top_k=2)

        # 3. Llama 3 Grounded Generation
        synth = await self.engine.generate_response(
            query=query,
            context_rules=relevant_rules,
            language=lang,
            challan_context=context_data,
            chat_history=chat_history
        )

        intent = "TRAFFIC_RULE_INFO" if relevant_rules else (
            "GENERAL_GREETING" if synth.get("status") == "GENERAL_GREETING" else "UNAVAILABLE_INFO"
        )

        return {
            "intent": intent,
            "reply_text": synth["reply_text"],
            "model_used": synth.get("model_used", "llama-3-8b-instruct"),
            "provider": synth.get("provider", "llama3"),
            "status": synth.get("status", "VERIFIED"),
            "is_grounded": synth.get("is_grounded", False),
            "rag_sources": relevant_rules,
            "language": lang
        }

llama3_assistant = Llama3Assistant()
llm_client = llama3_assistant
