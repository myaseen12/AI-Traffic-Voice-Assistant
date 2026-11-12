import pytest
import os
from app.rag.chroma_service import (
    ChromaRAGService,
    SemanticStatuteChunker,
    RobustEmbeddingFunction,
    chroma_rag_service,
)

@pytest.fixture(scope="module")
def rag_service():
    test_dir = "./data/test_chroma_rag_db"
    svc = ChromaRAGService(persist_directory=test_dir)
    svc.ingest_verified_rules()
    yield svc
    # Cleanup after tests
    import shutil
    shutil.rmtree(test_dir, ignore_errors=True)

def test_statutory_chunker_preserves_headers():
    chunker = SemanticStatuteChunker(chunk_size=200, chunk_overlap=40)
    meta = {
        "section": "Section 113",
        "category": "Speeding",
        "fine_amount": 5000.0,
        "is_verified": True
    }
    chunks = chunker.chunk_document(
        doc_id="DOC-113",
        section_header="MVO Section 113: Speed Limit",
        full_text="No person shall drive a motor vehicle at a speed exceeding the maximum speed prescribed. Over-speeding on highways carries severe civic and legal consequences.",
        metadata=meta
    )
    assert len(chunks) >= 1
    for chk in chunks:
        assert "[MVO Section 113: Speed Limit]" in chk["text"]
        assert chk["metadata"]["section"] == "Section 113"
        assert chk["metadata"]["fine_amount"] == 5000.0
        assert chk["metadata"]["is_verified"] is True

def test_robust_multilingual_embedding():
    ef = RobustEmbeddingFunction(dim=384)
    embs = ef(["Speed limit violation on highway", "موٹر سائیکل ہیلمٹ", "د ټرافیکي اشارې سرغړونه"])
    assert len(embs) == 3
    for emb in embs:
        assert len(emb) == 384
        assert any(v != 0.0 for v in emb)

def test_rag_retrieves_speeding_rule_english(rag_service):
    res = rag_service.query_laws("What is the fine for over-speeding on the highway?", top_k=2)
    assert res["has_results"] is True
    assert res["status"] == "VERIFIED"
    assert len(res["rules"]) >= 1
    assert "113" in res["rules"][0]["section"]
    assert res["rules"][0]["penalty_amount"] == 5000.0
    assert len(res["sources"]) >= 1
    src = res["sources"][0]
    assert "113" in src["section"]
    assert src["fine_amount"] == 5000.0
    assert src["is_verified"] is True
    assert "document_date" in src

def test_rag_retrieves_helmet_rule_urdu(rag_service):
    res = rag_service.query_laws("ہیلمٹ نہ پہننے پر کتنا جرمانہ ہے؟", top_k=2)
    assert res["has_results"] is True
    assert res["status"] == "VERIFIED"
    assert len(res["rules"]) >= 1
    assert "89-A" in res["rules"][0]["section"]
    assert res["rules"][0]["penalty_amount"] == 2000.0

def test_rag_retrieves_signal_rule_pashto(rag_service):
    res = rag_service.query_laws("د سرې اشارې ماتولو جریمه څومره ده؟", top_k=2)
    assert res["has_results"] is True
    assert res["status"] == "VERIFIED"
    assert len(res["rules"]) >= 1
    assert "112" in res["rules"][0]["section"]
    assert res["rules"][0]["penalty_amount"] == 2500.0

def test_rag_handles_unsupported_out_of_scope_query(rag_service):
    res = rag_service.query_laws("What is the statutory traffic fine for flying a drone on the motorway in rain?", top_k=2)
    assert res["has_results"] is False
    assert res["status"] == "UNAVAILABLE"
    assert len(res["rules"]) == 0
    assert len(res["sources"]) == 0

def test_rag_document_lifecycle(rag_service):
    # 1. Ingest new document
    doc_uid = "DOC-TEST-EV-2026"
    title = "Electric Scooter Urban Lane Regulations 2026"
    text = "Electric scooter riders shall use dedicated bicycle or secondary lanes and must not exceed 25 km/h on urban avenues. Penalty for violation is PKR 1,000."
    meta = {
        "section": "Regulation 4",
        "category": "Micro-Mobility",
        "fine_amount": 1000.0,
        "penalty_points": 1,
        "jurisdiction": "Islamabad Safe City",
        "source": "Safe City Regulation 2026",
        "verification_status": "VERIFIED",
        "is_verified": True,
        "document_date": "2026-01-15"
    }
    chunks_count = rag_service.ingest_document(doc_uid, title, text, meta)
    assert chunks_count > 0

    # 2. Get document
    doc_data = rag_service.get_document(doc_uid)
    assert doc_data is not None
    assert doc_data["doc_id"] == doc_uid
    assert doc_data["metadata"]["section"] == "Regulation 4"
    assert "Electric scooter riders" in doc_data["full_text"]

    # 3. List documents
    docs_list = rag_service.list_documents()
    assert any(d["doc_id"] == doc_uid for d in docs_list)

    # 4. Update document
    updated_text = "Electric scooter riders shall use dedicated bicycle lanes and must wear reflective jackets at night. Fine is PKR 1,500."
    meta["fine_amount"] = 1500.0
    updated = rag_service.update_document(doc_uid, updated_text, meta)
    assert updated is True
    updated_doc = rag_service.get_document(doc_uid)
    assert "reflective jackets" in updated_doc["full_text"]

    # 5. Delete document
    del_count = rag_service.delete_document(doc_uid)
    assert del_count > 0
    assert rag_service.get_document(doc_uid) is None

def test_rag_unverified_document_cannot_be_retrieved_as_law(rag_service):
    # Ingest unverified draft proposal
    draft_uid = "DRAFT-PARKING-PROPOSAL"
    title = "Draft Parking Proposal by Local Market Association"
    text = "Unverified draft proposal to fine wrong parking Rs 25,000 on private plazas."
    meta = {
        "section": "Draft Clause 1",
        "category": "Parking",
        "fine_amount": 25000.0,
        "jurisdiction": "Private Markets",
        "source": "Market Association Proposal",
        "verification_status": "UNVERIFIED",
        "is_verified": False,
        "document_date": "2026-05-01"
    }
    rag_service.ingest_document(draft_uid, title, text, meta)

    # Query with verified_only=True (default for citizen legal advice)
    res = rag_service.query_laws("draft parking proposal private plazas", verified_only=True)
    # The unverified document MUST NOT be returned as verified law
    for r in res.get("rules", []):
        assert r.get("id") != draft_uid
    for s in res.get("sources", []):
        assert s.get("id") != draft_uid
        assert s.get("is_verified") is True

    # Cleanup
    rag_service.delete_document(draft_uid)
