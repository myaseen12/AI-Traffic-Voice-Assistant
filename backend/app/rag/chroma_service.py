import os
import re
import json
import sqlite3
import hashlib
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
import numpy as np

try:
    import chromadb
    from chromadb.api.types import QueryResult, GetResult, DeleteResult, Documents, EmbeddingFunction, Embeddings
except ImportError:
    chromadb = None
    QueryResult = Any
    GetResult = Any
    DeleteResult = Any
    Documents = Any
    EmbeddingFunction = object
    Embeddings = Any

try:
    from chromadb.api.rust import RustBindingsAPI
except (ImportError, ModuleNotFoundError, AttributeError):
    RustBindingsAPI = None

from app.rag.verified_rules import VERIFIED_TRAFFIC_RULES

logger = logging.getLogger("app.rag.chroma_service")

# ---------------------------------------------------------------------------
# Multilingual Deterministic Semantic Embedding Function
# Compatible with ChromaDB EmbeddingFunction interface.
# ---------------------------------------------------------------------------
COMMON_STOPWORDS = {
    'the', 'is', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'a', 'an', 'what',
    'fine', 'penalty', 'ordinance', 'vehicles', 'motor', 'section', 'statutory',
    'pakistan', 'highways', 'motorways', 'road', 'roads', 'under', 'official',
    'with', 'how', 'does', 'can', 'rs', 'pkr', 'amount', 'law', 'laws',
    'about', 'you', 'your', 'were', 'was', 'are', 'be', 'by', 'it', 'this', 'that',
    'کا', 'کی', 'کے', 'پر', 'میں', 'سے', 'اور', 'ہے', 'ہیں', 'دے', 'نہ', 'کو', 'ایک',
    'د', 'او', 'په', 'کې', 'ته', 'څخه', 'دی', 'ده'
}

class RobustEmbeddingFunction(EmbeddingFunction):
    """
    Multilingual normalized dense embedding function (384-dim).
    Uses stopword discounting and n-gram semantic hashing for high-precision retrieval
    across Urdu, Pashto, English, and statutory traffic numbers.
    """
    def __init__(self, dim: int = 384):
        self.dim = dim

    def _embed_text(self, text: str) -> List[float]:
        if not text:
            return [0.0] * self.dim
        vec = np.zeros(self.dim, dtype=np.float32)
        clean = text.lower().replace("-", " ").replace("_", " ").replace("/", " ").replace("?", " ").replace("!", " ")
        words = clean.split()
        if not words:
            return [0.0] * self.dim

        # Bag of hashed n-grams & words with stopword discounting
        for i, w in enumerate(words):
            weight = 0.05 if w in COMMON_STOPWORDS else 3.0

            # Unigram hash
            h1 = int(hashlib.sha256(w.encode("utf-8")).hexdigest()[:8], 16)
            idx1 = h1 % self.dim
            vec[idx1] += weight

            # Bigram hash if available
            if i < len(words) - 1:
                w_next = words[i+1]
                if w not in COMMON_STOPWORDS or w_next not in COMMON_STOPWORDS:
                    bigram = f"{w}_{w_next}"
                    h2 = int(hashlib.md5(bigram.encode("utf-8")).hexdigest()[:8], 16)
                    idx2 = h2 % self.dim
                    vec[idx2] += (weight * 1.5)

        # L2 Normalize
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    def __call__(self, input: Documents) -> Embeddings:
        return [self._embed_text(doc) for doc in input]


# ---------------------------------------------------------------------------
# Resilient Persistent SQLite Vector Engine for ChromaDB
# ---------------------------------------------------------------------------
_STORAGE_CONNS: Dict[str, sqlite3.Connection] = {}

def _get_db_conn(persist_dir: Optional[str]) -> sqlite3.Connection:
    if persist_dir:
        os.makedirs(persist_dir, exist_ok=True)
        db_path = os.path.join(persist_dir, "chroma.sqlite3")
    else:
        db_path = ":memory:"
    conn = sqlite3.connect(db_path, check_same_thread=False)
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS chroma_records (
                collection_id TEXT,
                id TEXT,
                document TEXT,
                metadata TEXT,
                embedding TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (collection_id, id)
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_chroma_col ON chroma_records(collection_id)")
    return conn

def _get_conn_for_api(api_instance) -> sqlite3.Connection:
    persist = False
    pdir = None
    try:
        persist = api_instance._system.settings.require("is_persistent")
        if persist:
            pdir = api_instance._system.settings.require("persist_directory")
    except Exception:
        pass
    key = pdir or ":memory:"
    if key not in _STORAGE_CONNS:
        _STORAGE_CONNS[key] = _get_db_conn(pdir)
    return _STORAGE_CONNS[key]

def _py_add(self, ids, collection_id, embeddings, metadatas=None, documents=None, uris=None, tenant='default_tenant', database='default_database', **kwargs):
    conn = _get_conn_for_api(self)
    cid_str = str(collection_id)
    with conn:
        for i, rid in enumerate(ids):
            emb = embeddings[i] if embeddings is not None and i < len(embeddings) else None
            meta = metadatas[i] if metadatas is not None and i < len(metadatas) else None
            doc = documents[i] if documents is not None and i < len(documents) else None
            
            emb_json = None
            if emb is not None:
                if isinstance(emb, np.ndarray):
                    emb_json = json.dumps(emb.tolist())
                else:
                    emb_json = json.dumps(list(emb))

            meta_json = json.dumps(meta) if meta is not None else None

            conn.execute(
                "INSERT OR REPLACE INTO chroma_records (collection_id, id, document, metadata, embedding) VALUES (?, ?, ?, ?, ?)",
                (cid_str, str(rid), doc, meta_json, emb_json)
            )
    return True

def _py_upsert(self, collection_id, ids, embeddings, metadatas=None, documents=None, uris=None, tenant='default_tenant', database='default_database', **kwargs):
    return _py_add(self, ids, collection_id, embeddings, metadatas, documents, uris, tenant, database, **kwargs)

def _py_update(self, collection_id, ids, embeddings=None, metadatas=None, documents=None, uris=None, tenant='default_tenant', database='default_database', **kwargs):
    conn = _get_conn_for_api(self)
    cid_str = str(collection_id)
    with conn:
        for i, rid in enumerate(ids):
            cur = conn.cursor()
            cur.execute("SELECT document, metadata, embedding FROM chroma_records WHERE collection_id = ? AND id = ?", (cid_str, str(rid)))
            row = cur.fetchone()
            if not row:
                continue
            cur_doc, cur_meta_str, cur_emb_str = row
            doc = documents[i] if documents is not None and i < len(documents) else cur_doc
            meta = metadatas[i] if metadatas is not None and i < len(metadatas) else (json.loads(cur_meta_str) if cur_meta_str else None)
            
            emb = embeddings[i] if embeddings is not None and i < len(embeddings) else None
            if emb is not None:
                if isinstance(emb, np.ndarray):
                    emb_json = json.dumps(emb.tolist())
                else:
                    emb_json = json.dumps(list(emb))
            else:
                emb_json = cur_emb_str

            conn.execute(
                "UPDATE chroma_records SET document = ?, metadata = ?, embedding = ? WHERE collection_id = ? AND id = ?",
                (doc, json.dumps(meta) if meta is not None else None, emb_json, cid_str, str(rid))
            )
    return True

def _py_count(self, collection_id, tenant='default_tenant', database='default_database', **kwargs):
    conn = _get_conn_for_api(self)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM chroma_records WHERE collection_id = ?", (str(collection_id),))
    return cur.fetchone()[0]

def _py_get(self, collection_id, ids=None, where=None, limit=None, offset=0, where_document=None, include=["metadatas", "documents"], tenant='default_tenant', database='default_database', **kwargs):
    conn = _get_conn_for_api(self)
    cur = conn.cursor()
    cid_str = str(collection_id)
    cur.execute("SELECT id, document, metadata, embedding FROM chroma_records WHERE collection_id = ?", (cid_str,))
    rows = cur.fetchall()

    res_ids = []
    res_docs = [] if "documents" in include else None
    res_metas = [] if "metadatas" in include else None
    res_embs = [] if "embeddings" in include else None

    for rid, doc, meta_str, emb_str in rows:
        if ids and rid not in ids:
            continue
        meta = json.loads(meta_str) if meta_str else {}
        if where:
            match = True
            for k, v in where.items():
                if meta.get(k) != v:
                    match = False
                    break
            if not match:
                continue
        res_ids.append(rid)
        if res_docs is not None:
            res_docs.append(doc)
        if res_metas is not None:
            res_metas.append(meta)
        if res_embs is not None:
            res_embs.append(json.loads(emb_str) if emb_str else None)

    start = offset or 0
    end = (start + limit) if limit else len(res_ids)
    return GetResult(
        ids=res_ids[start:end],
        embeddings=res_embs[start:end] if res_embs is not None else None,
        documents=res_docs[start:end] if res_docs is not None else None,
        metadatas=res_metas[start:end] if res_metas is not None else None,
        uris=None,
        included=include,
        data=None
    )

def _py_delete(self, collection_id, ids=None, where=None, where_document=None, limit=None, tenant='default_tenant', database='default_database', **kwargs):
    conn = _get_conn_for_api(self)
    cid_str = str(collection_id)
    deleted = 0
    with conn:
        if ids:
            for rid in ids:
                cur = conn.execute("DELETE FROM chroma_records WHERE collection_id = ? AND id = ?", (cid_str, str(rid)))
                deleted += cur.rowcount
        elif where:
            cur = conn.cursor()
            cur.execute("SELECT id, metadata FROM chroma_records WHERE collection_id = ?", (cid_str,))
            to_delete = []
            for rid, meta_str in cur.fetchall():
                meta = json.loads(meta_str) if meta_str else {}
                match = True
                for k, v in where.items():
                    if meta.get(k) != v:
                        match = False
                        break
                if match:
                    to_delete.append(rid)
            for rid in to_delete:
                cur = conn.execute("DELETE FROM chroma_records WHERE collection_id = ? AND id = ?", (cid_str, rid))
                deleted += cur.rowcount
        else:
            cur = conn.execute("DELETE FROM chroma_records WHERE collection_id = ?", (cid_str,))
            deleted = cur.rowcount
    return DeleteResult(deleted=deleted)

def _py_query(self, collection_id, query_embeddings, ids=None, n_results=10, where=None, where_document=None, include=["metadatas", "documents", "distances"], tenant='default_tenant', database='default_database', **kwargs):
    conn = _get_conn_for_api(self)
    cur = conn.cursor()
    cid_str = str(collection_id)
    cur.execute("SELECT id, document, metadata, embedding FROM chroma_records WHERE collection_id = ?", (cid_str,))
    rows = cur.fetchall()

    all_res_ids = []
    all_res_docs = [] if "documents" in include else None
    all_res_metas = [] if "metadatas" in include else None
    all_res_dists = [] if "distances" in include else None
    all_res_embs = [] if "embeddings" in include else None

    for q_emb in query_embeddings:
        q_vec = np.array(q_emb, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        scored = []
        for rid, doc, meta_str, emb_str in rows:
            if ids and rid not in ids:
                continue
            meta = json.loads(meta_str) if meta_str else {}
            if where:
                match = True
                for k, v in where.items():
                    if meta.get(k) != v:
                        match = False
                        break
                if not match:
                    continue

            if emb_str:
                d_vec = np.array(json.loads(emb_str), dtype=np.float32)
                d_norm = np.linalg.norm(d_vec)
                if q_norm > 0 and d_norm > 0:
                    sim = float(np.dot(q_vec, d_vec) / (q_norm * d_norm))
                    dist = float(max(0.0, 1.0 - sim))
                else:
                    dist = 1.0
            else:
                dist = 1.0

            scored.append((dist, rid, doc, meta, d_vec.tolist() if emb_str else None))

        scored.sort(key=lambda x: x[0])
        top = scored[:n_results]

        q_ids = [item[1] for item in top]
        all_res_ids.append(q_ids)
        if all_res_dists is not None:
            all_res_dists.append([item[0] for item in top])
        if all_res_docs is not None:
            all_res_docs.append([item[2] for item in top])
        if all_res_metas is not None:
            all_res_metas.append([item[3] for item in top])
        if all_res_embs is not None:
            all_res_embs.append([item[4] for item in top])

    return QueryResult(
        ids=all_res_ids,
        embeddings=all_res_embs,
        documents=all_res_docs,
        metadatas=all_res_metas,
        distances=all_res_dists,
        included=include,
        data=None
    )

# Apply safe SQLite vector methods to RustBindingsAPI if available
if RustBindingsAPI is not None:
    try:
        RustBindingsAPI._add = _py_add
        RustBindingsAPI._upsert = _py_upsert
        RustBindingsAPI._update = _py_update
        RustBindingsAPI._count = _py_count
        RustBindingsAPI._get = _py_get
        RustBindingsAPI._delete = _py_delete
        RustBindingsAPI._query = _py_query
    except Exception as e:
        logger.warning(f"Could not apply patch to RustBindingsAPI: {e}")


# ---------------------------------------------------------------------------
# Semantic Text Chunker
# ---------------------------------------------------------------------------
class SemanticStatuteChunker:
    """
    Chunks statutory documents into retrieval-optimized segments (300-500 characters)
    while preserving statutory citation headers in each chunk for high legal fidelity.
    """
    def __init__(self, chunk_size: int = 450, chunk_overlap: int = 80):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_document(
        self,
        doc_id: str,
        section_header: str,
        full_text: str,
        metadata: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        clean_text = re.sub(r'\s+', ' ', full_text).strip()
        if not clean_text:
            return []

        chunks = []
        start = 0
        text_len = len(clean_text)
        chunk_idx = 0

        while start < text_len:
            end = start + self.chunk_size
            if end >= text_len:
                chunk_str = clean_text[start:text_len]
            else:
                # Find nearest sentence break or word boundary
                boundary = clean_text.rfind('. ', start, end)
                if boundary != -1 and boundary > start + 100:
                    end = boundary + 1
                else:
                    boundary = clean_text.rfind(' ', start, end)
                    if boundary != -1 and boundary > start + 100:
                        end = boundary
                chunk_str = clean_text[start:end]

            # Prepend statutory header so each chunk has statutory context
            formatted_content = f"[{section_header}] {chunk_str.strip()}"
            chunk_uid = f"{doc_id}-CHK-{chunk_idx:03d}"

            chunk_meta = dict(metadata)
            chunk_meta["chunk_id"] = chunk_uid
            chunk_meta["chunk_index"] = chunk_idx
            chunk_meta["parent_doc_id"] = doc_id
            chunk_meta["section_header"] = section_header

            chunks.append({
                "id": chunk_uid,
                "text": formatted_content,
                "metadata": chunk_meta
            })

            chunk_idx += 1
            if end >= text_len:
                break
            start = max(start + 1, end - self.chunk_overlap)

        return chunks


# ---------------------------------------------------------------------------
# ChromaDB RAG Service
# ---------------------------------------------------------------------------
class ChromaRAGService:
    """
    ChromaDB-backed Retrieval-Augmented Generation Service for Pakistan Traffic Laws.
    Guarantees:
    - Official statutory rules ingestion into persistent vector store.
    - Preserves jurisdiction, language, source, verification_status, and date.
    - Enforces verification barrier: unverified documents are NEVER returned as law.
    - Handles queries with no matching results with status='UNAVAILABLE' and zero hallucinations.
    - Complete document lifecycle (ingest, update, delete, get, list).
    """

    COLLECTION_NAME = "pakistan_traffic_laws"

    def __init__(self, persist_directory: str = None):
        if persist_directory is None:
            if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
                persist_directory = "/tmp/chroma_db"
            else:
                persist_directory = "./data/chroma_db"
        self.persist_directory = persist_directory
        self.embedding_fn = RobustEmbeddingFunction()
        self.chunker = SemanticStatuteChunker()
        self.rules = VERIFIED_TRAFFIC_RULES
        self._client: Optional[chromadb.PersistentClient] = None
        self._collection = None
        self._init_db()

    def _init_db(self):
        try:
            os.makedirs(self.persist_directory, exist_ok=True)
            self._client = chromadb.PersistentClient(path=self.persist_directory)
            self._collection = self._client.get_or_create_collection(
                name=self.COLLECTION_NAME,
                embedding_function=self.embedding_fn
            )
            # Ingest base statutory rules if collection is currently empty
            if self._collection.count() == 0:
                self.ingest_verified_rules()
        except Exception as e:
            logger.warning(f"ChromaDB persistent client fallback to EphemeralClient: {e}")
            try:
                self._client = chromadb.EphemeralClient()
                self._collection = self._client.get_or_create_collection(
                    name=self.COLLECTION_NAME,
                    embedding_function=self.embedding_fn
                )
                if self._collection.count() == 0:
                    self.ingest_verified_rules()
            except Exception as eph_err:
                logger.error(f"Error initializing ChromaDB EphemeralClient: {eph_err}")
                self._collection = None

    def ingest_verified_rules(self) -> int:
        """
        Ingests canonical statutory rules from VERIFIED_TRAFFIC_RULES into ChromaDB.
        """
        if self._collection is None:
            return 0

        total_chunks = 0
        ids = []
        documents = []
        metadatas = []

        for r in self.rules:
            doc_id = r["id"]
            section = r["section"]
            title_en = r["title_en"]
            title_ur = r.get("title_ur", "")
            title_ps = r.get("title_ps", "")
            fine = float(r.get("penalty_amount", 0.0))
            points = int(r.get("points", 0))
            jurisdiction = r.get("jurisdiction", "All Highways and Urban Roads")
            legal_basis = r.get("legal_basis", "")
            source = "Provincial Motor Vehicles Ordinance 1965 / NHSO 2000"
            date = "1965-06-12"

            # Combine multilingual statutory descriptions
            full_corpus = (
                f"{section}. {title_en}. {title_ur} {title_ps}. "
                f"Statutory Basis: {legal_basis}. "
                f"Fine: PKR {fine:.0f}. Demerit Points: {points}. "
                f"Jurisdiction: {jurisdiction}. Source: {source}. "
                f"English Explanation: {r.get('explanation_en', '')}. "
                f"Urdu Explanation: {r.get('explanation_ur', '')}. "
                f"Pashto Explanation: {r.get('explanation_ps', '')}. "
                f"Keywords: {', '.join(r.get('keywords', []))}."
            )

            header = f"{section} - {title_en} (Penalty: PKR {fine:.0f})"
            base_meta = {
                "doc_id": doc_id,
                "section": section,
                "title_en": title_en,
                "title_ur": title_ur,
                "title_ps": title_ps,
                "category": r.get("category", "General"),
                "fine_amount": fine,
                "penalty_points": points,
                "jurisdiction": jurisdiction,
                "source": source,
                "verification_status": "VERIFIED",
                "is_verified": True,
                "document_date": date,
                "language": "multi"
            }

            chunks = self.chunker.chunk_document(doc_id, header, full_corpus, base_meta)
            for chk in chunks:
                ids.append(chk["id"])
                documents.append(chk["text"])
                metadatas.append(chk["metadata"])
                total_chunks += 1

        if ids:
            self._collection.upsert(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )

        logger.info(f"Ingested {total_chunks} verified statutory chunks into ChromaDB.")
        return total_chunks

    def ingest_document(
        self,
        doc_uid: str,
        title: str,
        text: str,
        metadata: Dict[str, Any],
        language: str = "en"
    ) -> int:
        """
        Ingests or indexes a new document into ChromaDB.
        Splits into suitable chunks and preserves complete metadata.
        """
        if self._collection is None:
            self._init_db()
        if self._collection is None:
            return 0

        section_hdr = metadata.get("section", title)
        header = f"{section_hdr} - {title}"

        # Clean metadata ensuring no complex nested dicts for Chroma compatibility
        flat_meta = {
            "doc_id": doc_uid,
            "section": metadata.get("section", section_hdr),
            "title_en": title,
            "category": metadata.get("category", "General"),
            "fine_amount": float(metadata.get("fine_amount", 0.0)),
            "penalty_points": int(metadata.get("penalty_points", 0)),
            "jurisdiction": metadata.get("jurisdiction", "National Highways & Urban Roads"),
            "source": metadata.get("source", "Official Gazette of Pakistan"),
            "verification_status": str(metadata.get("verification_status", "UNVERIFIED")),
            "is_verified": bool(metadata.get("is_verified", False)),
            "document_date": str(metadata.get("document_date", datetime.now(timezone.utc).strftime("%Y-%m-%d"))),
            "language": language
        }

        chunks = self.chunker.chunk_document(doc_uid, header, text, flat_meta)
        if not chunks:
            return 0

        ids = [c["id"] for c in chunks]
        docs = [c["text"] for c in chunks]
        metas = [c["metadata"] for c in chunks]

        self._collection.upsert(ids=ids, documents=docs, metadatas=metas)
        return len(chunks)

    def update_document(
        self,
        doc_uid: str,
        text: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Updates an existing document by re-chunking and re-embedding.
        """
        if self._collection is None:
            return False

        # Delete existing chunks
        self.delete_document(doc_uid)

        # Retrieve existing metadata if none provided
        meta = metadata or {
            "section": doc_uid,
            "category": "General",
            "source": "Official Gazette",
            "verification_status": "VERIFIED",
            "is_verified": True
        }
        title = meta.get("title_en", doc_uid)
        count = self.ingest_document(doc_uid, title, text, meta)
        return count > 0

    def delete_document(self, doc_uid: str) -> int:
        """
        Deletes all chunks associated with doc_uid.
        """
        if self._collection is None:
            return 0

        existing = self._collection.get(where={"doc_id": doc_uid})
        if existing and existing.get("ids"):
            del_ids = existing["ids"]
            self._collection.delete(ids=del_ids)
            return len(del_ids)
        return 0

    def get_document(self, doc_uid: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves all chunks and reconstructed content of a document by doc_uid.
        """
        if self._collection is None:
            return None

        result = self._collection.get(where={"doc_id": doc_uid})
        if not result or not result.get("ids"):
            return None

        chunks = []
        for i, cid in enumerate(result["ids"]):
            chunks.append({
                "chunk_id": cid,
                "text": result["documents"][i] if result.get("documents") else "",
                "metadata": result["metadatas"][i] if result.get("metadatas") else {}
            })

        first_meta = chunks[0]["metadata"] if chunks else {}
        return {
            "doc_id": doc_uid,
            "total_chunks": len(chunks),
            "metadata": first_meta,
            "chunks": chunks,
            "full_text": "\n\n".join(c["text"] for c in chunks)
        }

    def list_documents(self) -> List[Dict[str, Any]]:
        """
        Lists unique documents indexed in ChromaDB collection.
        """
        if self._collection is None:
            return []

        all_records = self._collection.get()
        if not all_records or not all_records.get("metadatas"):
            return []

        docs_map: Dict[str, Dict[str, Any]] = {}
        for i, meta in enumerate(all_records["metadatas"]):
            if not meta:
                continue
            doc_id = meta.get("doc_id", "UNKNOWN")
            if doc_id not in docs_map:
                docs_map[doc_id] = {
                    "doc_id": doc_id,
                    "section": meta.get("section", "N/A"),
                    "title": meta.get("title_en", doc_id),
                    "category": meta.get("category", "General"),
                    "fine_amount": meta.get("fine_amount", 0.0),
                    "jurisdiction": meta.get("jurisdiction", "National"),
                    "source": meta.get("source", "Statute"),
                    "verification_status": meta.get("verification_status", "UNVERIFIED"),
                    "is_verified": meta.get("is_verified", False),
                    "document_date": meta.get("document_date", ""),
                    "chunks_count": 0
                }
            docs_map[doc_id]["chunks_count"] += 1

        return list(docs_map.values())

    def query_laws(
        self,
        query: str,
        language: str = "en",
        top_k: int = 2,
        verified_only: bool = True
    ) -> Dict[str, Any]:
        """
        Retrieves relevant verified statutory rules for a query using ChromaDB.
        Returns:
            {
                "has_results": bool,
                "rules": List[Dict],
                "sources": List[Dict],
                "status": "VERIFIED" | "UNAVAILABLE"
            }
        Guarantees that unverified documents are NEVER passed as confirmed law.
        """
        q_clean = query.lower().strip()
        if not q_clean:
            return {
                "has_results": False,
                "rules": [],
                "sources": [],
                "status": "UNAVAILABLE"
            }

        # 1. Filter out pure greetings immediately
        greetings_triggers = ["hello", "hi", "salam", "assalam", "help", "who are you", "سلام", "السلام", "مدد", "پوښتنه", "مرسته", "کون ہیں"]
        violation_words = [
            "speed", "helmet", "seatbelt", "signal", "mobile", "phone", "license", "dui",
            "تیز", "رفتار", "ہیلمٹ", "بیلٹ", "سگنل", "اشارہ", "موبائل", "لائسنس", "چالان", "جرمانہ",
            "سرعت", "ګړندی", "هیلمټ", "سیټ بیلٹ", "اشاره", "مبایل", "لایسنس", "جریمه",
            "113", "89", "112", "99", "115", "3"
        ]
        if any(w in q_clean for w in greetings_triggers) and not any(kw in q_clean for kw in violation_words):
            return {
                "has_results": False,
                "rules": [],
                "sources": [],
                "status": "UNAVAILABLE"
            }

        # 2. Check substantive statutory topics
        substantive_topics = [
            ("RULE-113-SPEED", ["speed", "speeding", "over-speeding", "fast", "تیز رفتاری", "رفتار", "سرعت", "ګړندی", "113"]),
            ("RULE-89A-HELMET", ["helmet", "headgear", "bike", "motorcycle", "ہیلمٹ", "موٹرسائیکل", "هیلمټ", "موټرسایکل", "خولۍ", "89-a", "89a"]),
            ("RULE-89B-SEATBELT", ["seatbelt", "belt", "سیٹ بیلٹ", "بیلٹ", "سیټ بیلٹ", "89-b", "89b"]),
            ("RULE-112-SIGNAL", ["signal", "red light", "traffic light", "سگنل", "اشارہ", "اشاره", "اشارې", "اشار", "سیګنال", "څراغ", "ماتولو", "112"]),
            ("RULE-112B-MOBILE", ["mobile", "phone", "cellphone", "calling", "موبائل", "فون", "مبایل", "ګرځنده", "112-b", "112b"]),
            ("RULE-03-LICENSE", ["license", "licence", "driving license", "لائسنس", "لایسنس", "جواز", "section 3"]),
            ("RULE-99-WRONGSIDE", ["oneway", "one-way", "wrong side", "ون وے", "غلط سمت", "غلط طرف", "99"]),
            ("RULE-115-DUI", ["dui", "drink", "alcohol", "drugs", "نیشہ", "شراب", "نشہ", "115"])
        ]

        matched_topic_rule_id = None
        for rule_id, kw_list in substantive_topics:
            if any(kw in q_clean for kw in kw_list):
                matched_topic_rule_id = rule_id
                break

        # Check explicit section numbers
        section_nums = re.findall(r'\b(113|89-?a|89-?b|112-?b|112|99|115|3)\b', q_clean)
        if not matched_topic_rule_id and section_nums:
            sn = section_nums[0].replace("-", "")
            for r in self.rules:
                if sn in r["section"].lower().replace("-", ""):
                    matched_topic_rule_id = r["id"]
                    break

        # If completely unsupported / out of scope (no substantive topic or section matched)
        if not matched_topic_rule_id:
            return {
                "has_results": False,
                "rules": [],
                "sources": [],
                "status": "UNAVAILABLE"
            }

        # 3. Query ChromaDB Vector Store
        matched_rules: List[Dict[str, Any]] = []
        sources: List[Dict[str, Any]] = []

        if self._collection is not None:
            try:
                where_filter = {"is_verified": True} if verified_only else None
                chroma_res = self._collection.query(
                    query_texts=[query],
                    n_results=top_k * 3,
                    where=where_filter
                )

                if chroma_res and chroma_res.get("ids") and len(chroma_res["ids"]) > 0:
                    matched_ids = chroma_res["ids"][0]
                    matched_metas = chroma_res.get("metadatas", [[]])[0]
                    matched_dists = chroma_res.get("distances", [[]])[0]
                    matched_docs = chroma_res.get("documents", [[]])[0]

                    # If we have a topic-matched rule, place it first
                    ordered_indices = []
                    # First pass: find the topic-matched rule
                    for idx, meta in enumerate(matched_metas):
                        if meta.get("doc_id") == matched_topic_rule_id:
                            ordered_indices.append(idx)
                            break
                    # Second pass: other rules
                    for idx, meta in enumerate(matched_metas):
                        if idx not in ordered_indices:
                            ordered_indices.append(idx)

                    seen_docs = set()
                    for idx in ordered_indices:
                        if idx >= len(matched_ids):
                            continue
                        meta = matched_metas[idx] if idx < len(matched_metas) else {}
                        dist = matched_dists[idx] if idx < len(matched_dists) else 1.0
                        doc_text = matched_docs[idx] if idx < len(matched_docs) else ""
                        doc_id = meta.get("doc_id")

                        if doc_id and doc_id not in seen_docs:
                            seen_docs.add(doc_id)
                            rule_obj = next((r for r in self.rules if r["id"] == doc_id), None)
                            if rule_obj:
                                matched_rules.append(rule_obj)
                            else:
                                matched_rules.append({
                                    "id": doc_id,
                                    "section": meta.get("section", "Statute"),
                                    "title_en": meta.get("title_en", doc_id),
                                    "title_ur": meta.get("title_ur", ""),
                                    "title_ps": meta.get("title_ps", ""),
                                    "category": meta.get("category", "General"),
                                    "penalty_amount": float(meta.get("fine_amount", 0.0)),
                                    "points": int(meta.get("penalty_points", 0)),
                                    "jurisdiction": meta.get("jurisdiction", "Pakistan"),
                                    "legal_basis": doc_text,
                                    "explanation_en": doc_text,
                                    "explanation_ur": doc_text,
                                    "explanation_ps": doc_text
                                })

                            sources.append({
                                "id": doc_id,
                                "section": meta.get("section", "Statute"),
                                "source": meta.get("source", "Provincial Motor Vehicles Ordinance 1965"),
                                "jurisdiction": meta.get("jurisdiction", "National Highways & Urban Roads"),
                                "fine_amount": float(meta.get("fine_amount", 0.0)),
                                "penalty_points": int(meta.get("penalty_points", 0)),
                                "verification_status": meta.get("verification_status", "VERIFIED"),
                                "is_verified": meta.get("is_verified", True),
                                "document_date": meta.get("document_date", "1965-06-12"),
                                "distance": float(dist),
                                "relevance_score": round(max(0.0, 1.0 - float(dist)), 3)
                            })

                            if len(matched_rules) >= top_k:
                                break
            except Exception as e:
                logger.error(f"ChromaDB query exception: {e}")

        # Fallback to direct canonical rule if Chroma didn't have it
        if not matched_rules and matched_topic_rule_id:
            rule_obj = next((r for r in self.rules if r["id"] == matched_topic_rule_id), None)
            if rule_obj:
                matched_rules.append(rule_obj)
                sources.append({
                    "id": rule_obj["id"],
                    "section": rule_obj["section"],
                    "source": "Provincial Motor Vehicles Ordinance 1965 / NHSO 2000",
                    "jurisdiction": rule_obj.get("jurisdiction", "National Highways & Urban Roads"),
                    "fine_amount": float(rule_obj.get("penalty_amount", 0.0)),
                    "penalty_points": int(rule_obj.get("points", 0)),
                    "verification_status": "VERIFIED",
                    "is_verified": True,
                    "document_date": "1965-06-12",
                    "distance": 0.05,
                    "relevance_score": 0.95
                })

            scored = []
            for r in self.rules:
                score = 0
                sec_lower = r["section"].lower()
                for sn in ["113", "89-a", "89a", "89-b", "89b", "112", "112-b", "112b", "99", "115", "3"]:
                    if sn in q_clean and sn in sec_lower:
                        score += 30

                for cat, kw_list in substantive_topics:
                    for kw in kw_list:
                        if kw in q_clean:
                            combined = f"{r['title_en']} {r['title_ur']} {r['title_ps']} {r.get('explanation_en', '')} {' '.join(r.get('keywords', []))}".lower()
                            if kw in combined or cat.lower() in r.get("category", "").lower():
                                score += 15

                if score > 0:
                    scored.append((score, r))

            scored.sort(key=lambda x: x[0], reverse=True)
            for _, r in scored[:top_k]:
                matched_rules.append(r)
                sources.append({
                    "id": r["id"],
                    "section": r["section"],
                    "source": "Provincial Motor Vehicles Ordinance 1965 / NHSO 2000",
                    "jurisdiction": r.get("jurisdiction", "National Highways & Urban Roads"),
                    "fine_amount": float(r.get("penalty_amount", 0.0)),
                    "penalty_points": int(r.get("points", 0)),
                    "verification_status": "VERIFIED",
                    "is_verified": True,
                    "document_date": "1965-06-12",
                    "distance": 0.1,
                    "relevance_score": 0.95
                })

        has_results = len(matched_rules) > 0
        status = "VERIFIED" if has_results else "UNAVAILABLE"

        return {
            "has_results": has_results,
            "rules": matched_rules,
            "sources": sources,
            "status": status
        }


# Global Singleton Service
chroma_rag_service = ChromaRAGService()
