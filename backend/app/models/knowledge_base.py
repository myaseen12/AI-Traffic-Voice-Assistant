from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.base import Base

class KnowledgeBaseDocument(Base):
    """
    Verified civic traffic law repository documents used by RAG for factual question answering.
    Supports official statutes, police standard operating procedures, and multilingual legal texts.
    """
    __tablename__ = "knowledge_base_documents"

    id = Column(Integer, primary_key=True, index=True)
    doc_uid = Column(String(64), unique=True, index=True, nullable=False) # e.g. "KB-MVO-SEC89A"
    title = Column(String(255), nullable=False)
    document_type = Column(String(50), default="statute", nullable=False) # "statute", "manual", "circular", "faq"
    authority_name = Column(String(120), default="National Highway and Motorway Police (NHMP)", nullable=False)
    rule_id = Column(Integer, ForeignKey("traffic_rules.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Multilingual Content Corpora for Grounded RAG Retrieval
    content_english = Column(Text, nullable=False)
    content_urdu = Column(Text, nullable=True)
    content_pashto = Column(Text, nullable=True)

    # Vector Index Integration (e.g. ChromaDB / pgvector collection ID)
    embedding_id = Column(String(100), nullable=True, index=True)
    is_indexed = Column(Boolean, default=False, index=True, nullable=False)
    version = Column(String(20), default="1.0", nullable=False)
    last_indexed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    traffic_rule = relationship("TrafficRule", back_populates="kb_documents")
