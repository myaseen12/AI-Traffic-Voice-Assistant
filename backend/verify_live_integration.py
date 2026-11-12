import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"

def post(url, data, headers=None):
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=req_headers)
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

def get(url, headers=None):
    req_headers = {}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, headers=req_headers)
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

def patch(url, data, headers=None):
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=req_headers, method="PATCH")
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

def main():
    print("=== LIVE INTEGRATION TEST SUITE ===")

    # 1. Citizen OTP Authentication Workflow
    phone = "03009876543"
    print(f"\n[1] Testing Citizen OTP request for {phone}...")
    otp_res = post(f"{BASE_URL}/auth/send-otp", {"phone_number": phone})
    assert otp_res["status"] == "success"
    demo_code = otp_res.get("otp_demo")
    print(f"    -> OTP Dispatched. Status: {otp_res['status']}, Demo Code: {demo_code}")

    print("[2] Testing OTP Verification...")
    verify_res = post(f"{BASE_URL}/auth/verify-otp", {"phone_number": phone, "otp": demo_code})
    citizen_token = verify_res["access_token"]
    assert citizen_token is not None
    assert verify_res["user"]["role"] == "citizen"
    print(f"    -> Citizen verified. Full Name: {verify_res['user']['full_name']}, Role: {verify_res['user']['role']}")

    # 2. Citizen Profile & Dashboard
    print("\n[3] Testing Authenticated Citizen Profile (/auth/me)...")
    me = get(f"{BASE_URL}/auth/me", {"Authorization": f"Bearer {citizen_token}"})
    assert me["phone_number"] == phone
    print(f"    -> Profile loaded: {me['full_name']} ({me['driving_license_no']})")

    print("[4] Testing Citizen Dashboard (/citizens/dashboard)...")
    dash = get(f"{BASE_URL}/citizens/dashboard", {"Authorization": f"Bearer {citizen_token}"})
    assert dash["is_backend_data"] is True
    print(f"    -> Dashboard stats: total={dash['stats']['total_challans']}, pending={dash['stats']['pending_count']}, is_backend_data={dash['is_backend_data']}")

    # 3. Language Preference Synchronization
    print("\n[5] Testing Language Preference Sync (/auth/preferred-language)...")
    lang_res = patch(f"{BASE_URL}/auth/preferred-language", {"language": "ur"}, {"Authorization": f"Bearer {citizen_token}"})
    assert lang_res["preferred_language"] == "ur"
    print(f"    -> Language updated to '{lang_res['preferred_language']}' on backend.")

    # 4. Traffic Rules Catalog & Classification
    print("\n[6] Testing Public Traffic Rules (/traffic-rules)...")
    rules = get(f"{BASE_URL}/traffic-rules?category=Speed")
    assert len(rules) >= 1
    sample_rule = rules[0]
    print(f"    -> Found {len(rules)} Speed rules. Sample: {sample_rule['rule_code']} ({sample_rule['title']})")
    assert sample_rule["source"] is not None
    assert sample_rule["jurisdiction"] is not None
    assert sample_rule["is_verified"] is True

    print("[7] Testing Traffic Rule Classification (/traffic-rules/classify)...")
    classify_ver = get(f"{BASE_URL}/traffic-rules/classify?q=helmet")
    assert classify_ver["status"] == "VERIFIED"
    print(f"    -> Query 'helmet' classified as: {classify_ver['status']}")

    classify_unavail = get(f"{BASE_URL}/traffic-rules/classify?q=unobtainium_hovercraft_hyperdrive")
    assert classify_unavail["status"] == "UNAVAILABLE"
    print(f"    -> Invented query classified as: {classify_unavail['status']} (Zero hallucinations)")

    # 5. QR Code Validation
    print("\n[8] Testing Scanned QR Reference Validation (/challans/qr/validate)...")
    import sqlite3
    con = sqlite3.connect("traffic_assistant.db")
    cur = con.cursor()
    active_token = cur.execute("SELECT qr_token FROM qr_references WHERE is_revoked = 0 LIMIT 1").fetchone()[0]
    con.close()
    qr_res = post(f"{BASE_URL}/challans/qr/validate", {"qr_token": active_token})
    assert qr_res["status"] == "valid"
    print(f"    -> QR Token valid: {active_token} -> Challan #{qr_res['challan']['challan_no']}, Amount: Rs. {qr_res['challan']['amount']}")

    # 6. Admin Authentication & Management
    print("\n[9] Testing Admin Credential Login (/auth/login)...")
    admin_login = post(f"{BASE_URL}/auth/login", {"email": "hq@trafficpolice.gov.pk", "password": "Admin@123"})
    admin_token = admin_login["access_token"]
    assert admin_login["user"]["role"] == "admin"
    print(f"    -> Admin Authenticated: {admin_login['user']['full_name']} (Role: {admin_login['user']['role']})")

    print("[10] Testing Admin Command Center Dashboard (/admin/dashboard)...")
    admin_dash = get(f"{BASE_URL}/admin/dashboard", {"Authorization": f"Bearer {admin_token}"})
    assert admin_dash["is_backend_data"] is True
    print(f"    -> Admin Telemetry: Total Citations={admin_dash['metrics']['total_challans']}, Citizens={admin_dash['metrics']['total_citizens']}")

    print("[11] Testing Admin Traffic Rules Management (/admin/traffic-rules)...")
    admin_rules = get(f"{BASE_URL}/admin/traffic-rules", {"Authorization": f"Bearer {admin_token}"})
    assert len(admin_rules) >= 5
    print(f"    -> Admin rules listed: {len(admin_rules)} statutory rules found in central registry.")

    # 7. Proper Logout & Token Revocation
    print("\n[12] Testing Proper Logout & Token Invalidation (/auth/logout)...")
    logout_res = post(f"{BASE_URL}/auth/logout", {}, {"Authorization": f"Bearer {citizen_token}"})
    assert logout_res["status"] == "success"
    print(f"    -> Backend session terminated: {logout_res['message']}")

    # 8. Token Revocation Verification
    print("[13] Verifying Revoked Token Access Block...")
    try:
        get(f"{BASE_URL}/auth/me", {"Authorization": f"Bearer {citizen_token}"})
        print("    -> FAILED: Revoked token was accepted!")
        sys.exit(1)
    except urllib.error.HTTPError as e:
        assert e.code == 401
        print(f"    -> SUCCESS: Revoked token blocked with HTTP {e.code} Unauthorized.")

    print("\n ALL LIVE FULL-STACK INTEGRATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
