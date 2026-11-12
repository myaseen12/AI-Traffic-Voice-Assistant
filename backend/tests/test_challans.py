import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_search_challans_pakistan():
    response = client.get("/api/v1/challans/search?q=ICT-LE-402")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["vehicle_no"] == "ICT-LE-402"

def test_qr_decode_endpoint():
    response = client.post("/api/v1/challans/qr-decode", json={"qr_data": "PK-2024-883921"})
    assert response.status_code == 200
    data = response.json()
    assert data["challan_no"] == "PK-2024-883921"
    assert data["amount"] == 5000.0

def test_assistant_query_english():
    response = client.post("/api/v1/assistant/query", json={
        "query_text": "What is the fine for speeding?",
        "language": "en"
    })
    assert response.status_code == 200
    data = response.json()
    assert "reply_text" in data
    assert "5,000" in data["reply_text"] or "113" in data["reply_text"]

def test_assistant_query_urdu():
    response = client.post("/api/v1/assistant/query", json={
        "query_text": "ہیلمٹ نہ پہننے پر کتنا جرمانہ ہے؟",
        "language": "ur"
    })
    assert response.status_code == 200
    data = response.json()
    assert "reply_text" in data
    assert "2,000" in data["reply_text"] or "ہیلمٹ" in data["reply_text"]

def test_assistant_query_pashto():
    response = client.post("/api/v1/assistant/query", json={
        "query_text": "د اشارې ماتولو جریمه څومره ده؟",
        "language": "ps"
    })
    assert response.status_code == 200
    data = response.json()
    assert "reply_text" in data
    assert "روپۍ" in data["reply_text"] or "112" in data["reply_text"]
