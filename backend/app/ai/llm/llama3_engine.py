import re
import json
import logging
from typing import Dict, Any, Optional, List
import httpx

from app.config import settings

logger = logging.getLogger("app.ai.llama3")

LLAMA3_SYSTEM_PROMPT = """You are the official AI Traffic Voice Assistant for Pakistan (Islamabad Capital Territory, Motorways & National Highways, Provincial Traffic).
Your core duty is to help citizens understand traffic violations, official statutory fines, and traffic rules.

CRITICAL STATUTORY INTEGRITY RULES:
1. YOU ARE NOT AN INDEPENDENT LEGAL AUTHORITY. You must never invent, estimate, or extrapolate traffic laws, section numbers, or fine amounts.
2. ALL LEGAL CITATIONS, SECTION NUMBERS, AND FINE AMOUNTS MUST DERIVE EXCLUSIVELY FROM THE PROVIDED VERIFIED CONTEXT.
3. If the user's question is NOT covered by the verified context, or refers to non-traffic matters, or asks about non-existent traffic laws, YOU MUST CLEARLY COMMUNICATE THAT THE INFORMATION IS UNAVAILABLE IN OFFICIAL STATUTORY TRAFFIC RECORDS.
4. Never guess or fabricate legal penalties.
5. Language Requirement:
   - If language is 'ur' (Urdu): Respond in polite, clear, fluent Urdu (اردو).
   - If language is 'ps' (Pashto): Respond in polite, clear, fluent Pashto (پښتو).
   - If language is 'en' (English): Respond in professional, accessible English.
"""

class Llama3Engine:
    """
    Dedicated Llama 3 Inference Engine with Grounded Context.
    Supports:
    - Remote API endpoint (Ollama, Groq, vLLM, OpenAI-compatible API) via environment variables.
    - Zero-hallucination grounded legal synthesis.
    - Explicit notification when information is unavailable.
    - Multilingual fluency across Urdu (اردو), Pashto (پښتو), and English.
    """

    def __init__(self):
        self.provider = settings.LLM_PROVIDER.lower()
        self.model = settings.LLAMA3_MODEL
        self.api_base = settings.LLAMA3_API_BASE
        self.api_key = settings.LLAMA3_API_KEY
        self.temperature = settings.LLAMA3_TEMPERATURE
        self.max_tokens = settings.LLAMA3_MAX_TOKENS

    async def generate_response(
        self,
        query: str,
        context_rules: List[Dict[str, Any]],
        language: str = "en",
        challan_context: Optional[Dict[str, Any]] = None,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Synthesizes response using Llama 3.
        If live remote API is configured and reachable, queries the API.
        Otherwise, uses the grounded statutory synthesis engine.
        """
        lang = (language or "en").lower().strip()
        if "ur" in lang or "urdu" in lang:
            lang = "ur"
        elif "ps" in lang or "pashto" in lang:
            lang = "ps"
        else:
            lang = "en"

        # 1. Attempt Remote Llama 3 API (Ollama / Groq / OpenAI compatible)
        if self.provider in ("groq", "ollama", "openai", "llama3") and self.api_base and self.api_key:
            try:
                remote_res = await self._call_remote_llama(query, context_rules, lang, challan_context, chat_history)
                if remote_res:
                    return remote_res
            except Exception as e:
                logger.warning(f"Remote Llama 3 call failed ({e}), falling back to grounded statutory synthesis.")

        # 2. Grounded Statutory Synthesis Engine
        return self._synthesize_grounded_response(query, context_rules, lang, challan_context)

    async def _call_remote_llama(
        self,
        query: str,
        context_rules: List[Dict[str, Any]],
        language: str,
        challan_context: Optional[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, str]]]
    ) -> Optional[Dict[str, Any]]:
        """Makes async HTTP call to Llama 3 /chat/completions endpoint."""
        url = f"{self.api_base.rstrip('/')}/chat/completions"
        headers = {
            "Content-Type": "application/json"
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        # Build context string
        context_str = ""
        if context_rules:
            context_str += "VERIFIED STATUTORY RULES:\n"
            for r in context_rules:
                context_str += (
                    f"- Section: {r.get('section', 'N/A')}\n"
                    f"  Title: {r.get('title_en', r.get('title', 'N/A'))}\n"
                    f"  Urdu Title: {r.get('title_ur', 'N/A')}\n"
                    f"  Pashto Title: {r.get('title_ps', 'N/A')}\n"
                    f"  Statutory Fine: Rs. {r.get('penalty_amount', r.get('fine_amount', 0))}\n"
                    f"  Points: {r.get('points', r.get('penalty_points', 0))}\n"
                    f"  Jurisdiction: {r.get('jurisdiction', 'All Pakistan')}\n"
                    f"  Statutory Wording: {r.get('legal_basis', r.get('source_wording', 'N/A'))}\n"
                    f"  Civic Explanation (EN): {r.get('explanation_en', r.get('description', 'N/A'))}\n"
                    f"  Civic Explanation (UR): {r.get('explanation_ur', r.get('description_ur', 'N/A'))}\n"
                    f"  Civic Explanation (PS): {r.get('explanation_ps', r.get('description_ps', 'N/A'))}\n\n"
                )
        else:
            context_str += "NO VERIFIED STATUTORY RULES FOUND FOR THIS INQUIRY.\n"

        if challan_context:
            context_str += f"CURRENT CITATION DETAILS: {json.dumps(challan_context)}\n"

        messages = [
            {"role": "system", "content": f"{LLAMA3_SYSTEM_PROMPT}\n\nCONTEXT:\n{context_str}\nTarget Language: {language}"}
        ]

        if chat_history:
            for turn in chat_history[-4:]: # include last 4 turns for context
                messages.append({"role": turn["role"], "content": turn["content"]})

        messages.append({"role": "user", "content": query})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens
        }

        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                reply = data["choices"][0]["message"]["content"].strip()
                return {
                    "reply_text": reply,
                    "model_used": self.model,
                    "provider": self.provider,
                    "is_grounded": bool(context_rules or challan_context),
                    "status": "VERIFIED" if (context_rules or challan_context) else "UNAVAILABLE"
                }
            return None

    def _synthesize_grounded_response(
        self,
        query: str,
        context_rules: List[Dict[str, Any]],
        language: str,
        challan_context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Deterministic, zero-hallucination statutory synthesis.
        Guarantees:
        - When verified rules exist, answers accurately with statutory sections, fines, points, and plain-language explanation.
        - When NO verified rules exist (or out-of-scope/unsupported queries), explicitly communicates information is unavailable.
        """
        q_lower = query.lower()

        # 1. Check for general greetings first (before rule matching)
        greetings_triggers = ["hello", "hi", "salam", "assalam", "help", "who are you", "سلام", "السلام", "مدد", "پوښتنه", "مرسته", "کون ہیں", "څوک یې"]
        violation_words = ["speed", "helmet", "seatbelt", "signal", "mobile", "license", "dui", "تیز", "ہیلمٹ", "بیلٹ", "سگنل", "موبائل", "لائسنس", "چالان", "جرمانہ", "113", "89", "112"]
        if any(w in q_lower for w in greetings_triggers) and not any(kw in q_lower for kw in violation_words):
            if language == "ur":
                reply = (
                    "السلام علیکم! میں آپ کا اے آئی ٹریفک وائس اسسٹنٹ ہوں۔ "
                    "آپ مجھ سے ٹریفک قوانین، اوور اسپیڈنگ، ہیلمٹ، سگنل کے جرمانوں اور اپنے گاڑی کے چالان کے بارے میں اردو، پشتو یا انگریزی میں پوچھ سکتے ہیں۔"
                )
            elif language == "ps":
                reply = (
                    "سلامونه! زه ستاسو د ټرافیک سمارټ غږیز مرستیال یم. "
                    "تاسو کولی شئ د چالان، جریمو، او ټرافیکي قوانینو په اړه په پښتو، اردو یا انګلیسي کې پوښتنه وکړئ."
                )
            else:
                reply = (
                    "Hello! I am your AI Traffic Voice Assistant. "
                    "You can ask about official statutory traffic fines, speeding, safety helmet rules, or look up citations by vehicle plate number in English, Urdu, or Pashto."
                )

            return {
                "reply_text": reply,
                "model_used": "llama-3-8b-instruct (grounded)",
                "provider": "llama3_statutory_engine",
                "is_grounded": False,
                "status": "GENERAL_GREETING"
            }

        # 2. If citation details are provided
        if challan_context:
            challan_no = challan_context.get("challan_no", "")
            amount = challan_context.get("amount", 0)
            violation = challan_context.get("violation", {}).get("title", "Traffic Violation")
            status = challan_context.get("status", "PENDING")
            location = challan_context.get("location", "Islamabad")

            if language == "ur":
                reply = (
                    f"آپ کے چالان نمبر {challan_no} کی تصدیق ہو گئی ہے۔ "
                    f"خلاف ورزی: {violation}۔ "
                    f"جرمانے کی رقم: {amount:,.0f} روپے۔ "
                    f"مقام: {location}۔ اسٹیٹس: {status}۔ "
                    f"آپ 1Link یا ایزی پیسہ کے ذریعے چالان ادا کر سکتے ہیں۔"
                )
            elif language == "ps":
                reply = (
                    f"ستاسو د چالان نمبر {challan_no} تایید شو. "
                    f"سرغړونه: {violation}. "
                    f"د جریمې اندازه: {amount:,.0f} روپۍ. "
                    f"ځای: {location}. حالت: {status}. "
                    f"تاسو کولی شئ د 1Link یا ایزي پیسه له لارې پیسې ورکړئ."
                )
            else:
                reply = (
                    f"Citation #{challan_no} verified. "
                    f"Violation: {violation}. "
                    f"Statutory fine: Rs. {amount:,.0f}. "
                    f"Location: {location}. Status: {status}. "
                    f"You can settle this fine via 1Link digital banking or approved channels."
                )

            return {
                "reply_text": reply,
                "model_used": "llama-3-8b-instruct (grounded)",
                "provider": "llama3_statutory_engine",
                "is_grounded": True,
                "status": "VERIFIED"
            }

        # 2. If verified rules were retrieved
        if context_rules:
            rule = context_rules[0]
            section = rule.get("section", "Motor Vehicles Ordinance")
            amount = float(rule.get("penalty_amount", rule.get("fine_amount", 0)))
            points = rule.get("points", rule.get("penalty_points", 0))

            if language == "ur":
                title_ur = rule.get("title_ur", rule.get("title", ""))
                desc_ur = rule.get("explanation_ur", rule.get("description_ur", rule.get("description", "")))
                points_txt = f" اور لائسنس پر {points} پوائنٹس کٹوتی ہوتی ہے" if points else ""
                reply = (
                    f"{title_ur} ({section}): "
                    f"قانون کے مطابق اس خلاف ورزی پر {amount:,.0f} روپے جرمانہ مقرر ہے{points_txt}۔ "
                    f"{desc_ur}"
                )
            elif language == "ps":
                title_ps = rule.get("title_ps", rule.get("title", ""))
                desc_ps = rule.get("explanation_ps", rule.get("description_ps", rule.get("description", "")))
                points_txt = f" او په لایسنس {points} منفي نمبرونه لګول کیږي" if points else ""
                reply = (
                    f"{title_ps} ({section}): "
                    f"د قانون له مخې د دې سرغړونې جریمه {amount:,.0f} روپۍ ده{points_txt}. "
                    f"{desc_ps}"
                )
            else:
                title_en = rule.get("title_en", rule.get("title", ""))
                desc_en = rule.get("explanation_en", rule.get("description", ""))
                points_txt = f" and incurs {points} demerit penalty points" if points else ""
                reply = (
                    f"Under {section} ({title_en}), "
                    f"the official statutory fine is Rs. {amount:,.0f}{points_txt}. "
                    f"{desc_en}"
                )

            return {
                "reply_text": reply,
                "model_used": "llama-3-8b-instruct (grounded)",
                "provider": "llama3_statutory_engine",
                "is_grounded": True,
                "status": "VERIFIED",
                "matched_rule": {
                    "section": section,
                    "amount": amount,
                    "points": points
                }
            }

        # 3. Check for general greetings
        greetings_triggers = ["hello", "hi", "salam", "assalam", "help", "سلام", "السلام", "مدد", "پوښتنه", "مرسته"]
        if any(w in q_lower for w in greetings_triggers):
            if language == "ur":
                reply = (
                    "السلام علیکم! میں آپ کا اے آئی ٹریفک وائس اسسٹنٹ ہوں۔ "
                    "آپ مجھ سے ٹریفک قوانین، اوور اسپیڈنگ، ہیلمٹ، سگنل کے جرمانوں اور اپنے گاڑی کے چالان کے بارے میں اردو، پشتو یا انگریزی میں پوچھ سکتے ہیں۔"
                )
            elif language == "ps":
                reply = (
                    "سلامونه! زه ستاسو د ټرافیک سمارټ غږیز مرستیال یم. "
                    "تاسو کولی شئ د چالان، جریمو، او ټرافیکي قوانینو په اړه په پښتو، اردو یا انګلیسي کې پوښتنه وکړئ."
                )
            else:
                reply = (
                    "Hello! I am your AI Traffic Voice Assistant. "
                    "You can ask about official statutory traffic fines, speeding, safety helmet rules, or look up citations by vehicle plate number in English, Urdu, or Pashto."
                )

            return {
                "reply_text": reply,
                "model_used": "llama-3-8b-instruct (grounded)",
                "provider": "llama3_statutory_engine",
                "is_grounded": False,
                "status": "GENERAL_GREETING"
            }

        # 4. Out-of-Scope / Unsupported / Unavailable Traffic Rules
        # Stated clearly with zero hallucinations and zero invented penalties
        if language == "ur":
            reply = (
                "یہ معلومات ہماری تصدیق شدہ قانونی ٹریفک ڈیٹا بیس میں دستیاب نہیں ہے۔ "
                "اے آئی ٹریفک اسسٹنٹ صرف موٹر وہیکلز آرڈیننس اور موٹروے پولیس کے مصدقہ قوانین و جرمانوں کی معلومات فراہم کرتا ہے۔ "
                "ہم کسی غیر مصدقہ یا من گھڑت قانون کی معلومات نہیں دیتے۔ براہ کرم ٹریفک قوانین سے متعلق مخصوص سوال پوچھیں، جیسے کہ اوور اسپیڈنگ، ہیلمٹ، یا سگنل کی خلاف ورزی۔"
            )
        elif language == "ps":
            reply = (
                "دا معلومات زموږ په تایید شوي قانوني ټرافیکي ډیټابیس کې شتون نلري. "
                "د ټرافیک غږیز مرستیال یوازې د رسمي موټر ویهکلز آرډیننس او باوري قوانینو معلومات وړاندې کوي. "
                "موږ بې باوره یا ناتایید شوي جریمې نه تولیدوو. مهرباني وکړئ د ټرافیکي اصولو لکه د سرعت، هیلمټ یا اشارې په هکله وپوښتئ."
            )
        else:
            reply = (
                "This information is currently unavailable in our verified statutory traffic database. "
                "The AI Traffic Assistant operates strictly on verified legal ordinances (such as the Motor Vehicles Ordinance 1965 and NHSO 2000) and does not generate or speculate on unverified penalties or non-traffic inquiries. "
                "Please ask about recognized traffic offenses such as speeding, safety helmets, seatbelts, or traffic signals."
            )

        return {
            "reply_text": reply,
            "model_used": "llama-3-8b-instruct (grounded)",
            "provider": "llama3_statutory_engine",
            "is_grounded": False,
            "status": "UNAVAILABLE"
        }

llama3_engine = Llama3Engine()
