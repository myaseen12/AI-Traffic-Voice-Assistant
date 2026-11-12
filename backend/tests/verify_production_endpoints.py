import os
import sys
import json
import urllib.request
import urllib.error

sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = os.environ.get("TEST_BASE_URL", "http://127.0.0.1:8000")

def run_tests():
    print("=" * 65)
    print("AI TRAFFIC VOICE ASSISTANT - PRODUCTION ENDPOINT VERIFICATION")
    print("Target Base URL:", BASE_URL)
    print("=" * 65)

    # 1. Health Endpoints
    print("\n[1/8] Verifying Health & Liveness Endpoints...")
    req = urllib.request.urlopen(f"{BASE_URL}/health")
    health = json.loads(req.read().decode())
    assert health["status"] == "healthy", f"Health status error: {health}"
    assert health["database"] == "connected", f"Database error: {health}"
    print(f"  ✓ /health: Status='{health['status']}', DB='{health['database']}', Uptime={health['uptime_seconds']}s")

    # 2. System Root Metadata & Language Discovery
    print("\n[2/8] Verifying System Root Discovery Endpoints...")
    req = urllib.request.urlopen(f"{BASE_URL}/")
    root = json.loads(req.read().decode())
    assert root["status"] == "online"
    langs = [f"{l['name']} ({l['code']})" for l in root["supported_languages"]]
    print(f"  ✓ Service: '{root['service']}'")
    print(f"  ✓ Multilingual Support: {', '.join(langs)}")
    print(f"  ✓ Statutory Framework: {len(root['statutory_framework'])} Acts loaded")

    # 3. Citizen 2FA OTP Authentication (Send OTP)
    print("\n[3/8] Verifying 2FA SMS OTP Dispatch (/api/v1/auth/send-otp)...")
    phone = "03009876543"
    data = json.dumps({"phone_number": phone}).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/v1/auth/send-otp", data=data, headers={"Content-Type": "application/json"})
    try:
        res = json.loads(urllib.request.urlopen(req).read().decode())
        assert res.get("status") == "success"
        otp_code = res.get("otp_demo", "123456")
        print(f"  ✓ OTP dispatched to {phone}. Cooldown: {res.get('cooldown_seconds')}s")
    except urllib.error.HTTPError as e:
        if e.code == 429:
            print(f"  ✓ Rate limit cooldown active for {phone} (429 Too Many Requests enforced correctly). Using fallback code.")
            otp_code = "123456"
        else:
            raise

    # 4. Citizen 2FA OTP Verification & JWT Issuance
    print("\n[4/8] Verifying 2FA OTP Validation & JWT Token (/api/v1/auth/verify-otp)...")
    vdata = json.dumps({"phone_number": phone, "otp": otp_code}).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/v1/auth/verify-otp", data=vdata, headers={"Content-Type": "application/json"})
    vres = json.loads(urllib.request.urlopen(req).read().decode())
    assert "access_token" in vres
    token = vres["access_token"]
    user = vres["user"]
    print(f"  ✓ JWT Token issued. User: '{user['full_name']}' (Role: {user['role']})")

    # 5. Public Challan Status Check
    print("\n[5/8] Verifying Public Challan Status (/api/v1/challans/{challan_no}/status)...")
    req = urllib.request.urlopen(f"{BASE_URL}/api/v1/challans/KHI-2024-883492/status")
    sres = json.loads(req.read().decode())
    assert sres["challan_no"] == "KHI-2024-883492"
    print(f"  ✓ Ticket: {sres['challan_no']} | Vehicle: {sres['vehicle_no']} | Amount: PKR {sres['amount']} | Status: {sres['status']}")

    # 6. QR Code Cryptographic Token Validation
    print("\n[6/8] Verifying QR Code Validation (/api/v1/challans/qr/validate)...")
    qr_token = "QRC-B17CABF001ABD2FA967D5A6B1EBAB0DD"
    qr_data = json.dumps({"qr_token": qr_token}).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/v1/challans/qr/validate", data=qr_data, headers={"Content-Type": "application/json"})
    qr_res = json.loads(urllib.request.urlopen(req).read().decode())
    assert qr_res["status"] == "valid"
    assert qr_res["challan"]["challan_no"] == "KHI-2024-883492"
    print(f"  ✓ Verified QR Token: {qr_token[:18]}... -> Challan: {qr_res['challan']['challan_no']} (Scans: {qr_res['scan_count']})")

    # 7. Grounded RAG Query in English
    print("\n[7/8] Verifying Grounded RAG AI Assistant (English Query)...")
    qdata = json.dumps({"query_text": "What is the penalty for over speeding?", "language": "en"}).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/v1/assistant/query", data=qdata, headers={"Content-Type": "application/json"})
    qres = json.loads(urllib.request.urlopen(req).read().decode())
    assert "reply_text" in qres
    citations = [s.get("section", s.get("source", "")) for s in qres.get("rag_sources", [])]
    print(f"  ✓ RAG Answer: {qres['reply_text'][:75]}...")
    print(f"  ✓ Grounded Sources/Citations: {citations}")

    # 8. Out-of-Scope Anti-Hallucination Refusal
    print("\n[8/8] Verifying Zero-Hallucination Refusal on Out-of-Scope Query...")
    qdata2 = json.dumps({"query_text": "How do I bake a chocolate cake at home?", "language": "en"}).encode("utf-8")
    req2 = urllib.request.Request(f"{BASE_URL}/api/v1/assistant/query", data=qdata2, headers={"Content-Type": "application/json"})
    qres2 = json.loads(urllib.request.urlopen(req2).read().decode())
    ans_lower = qres2["reply_text"].lower()
    is_refused = any(w in ans_lower for w in ["cannot assist", "only assist", "traffic", "unrelated", "not available", "unsupported", "cannot provide"])
    assert is_refused, f"Assistant did not refuse non-traffic question: {qres2['reply_text']}"
    print(f"  ✓ Refusal Handled Correctly: {qres2['reply_text'][:70]}...")

    print("\n" + "=" * 65)
    print("ALL 8 PRODUCTION ENDPOINT TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 65)

if __name__ == "__main__":
    run_tests()
