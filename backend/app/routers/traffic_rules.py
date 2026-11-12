from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.traffic_service import TrafficService
from app.schemas.traffic_rule import (
    TrafficRuleResponse,
    ClassifiedSearchResult,
)

router = APIRouter(prefix="/traffic-rules", tags=["Traffic Rules"])

@router.get("", response_model=List[TrafficRuleResponse])
def get_traffic_rules(
    category: Optional[str] = Query(None, description="Filter by category e.g. Speeding, Safety Equipment"),
    search: Optional[str] = Query(None, description="Search keyword in English, Urdu, or Pashto"),
    jurisdiction: Optional[str] = Query(None, description="Filter by jurisdiction e.g. Islamabad, Motorways"),
    status: Optional[str] = Query(None, description="Filter by verification status (VERIFIED, UNVERIFIED, etc.)"),
    language: Optional[str] = Query("en", description="Output language: 'en', 'ur', 'ps'"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Public and citizen-facing catalog of statutory traffic rules.
    Anchored in official Pakistani law (MVO 1965 / NHSO 2000).
    Every rule provides its statutory source, jurisdiction, and verification status.
    Supports multilingual localization in English, Urdu, and Pashto.
    """
    service = TrafficService(db)
    return service.get_rules(
        search=search,
        category=category,
        jurisdiction=jurisdiction,
        verification_status=status,
        language=language,
        is_active=True,
        skip=skip,
        limit=limit
    )

@router.get("/classify", response_model=ClassifiedSearchResult)
def search_and_classify_rules(
    q: Optional[str] = Query(None, description="Search query or violation description"),
    category: Optional[str] = Query(None, description="Optional category filter"),
    jurisdiction: Optional[str] = Query(None, description="Optional jurisdiction filter"),
    language: Optional[str] = Query("en", description="Response language: 'en', 'ur', 'ps'"),
    db: Session = Depends(get_db)
):
    """
    Strictly classifies search results into 3 legal states:
    1. 'VERIFIED': Authoritative statutory enactments under Pakistani law.
    2. 'UNVERIFIED': Community or draft content awaiting legal gazette confirmation.
    3. 'UNAVAILABLE': Information not found in official statutes; prevents hallucinating fines.
    """
    service = TrafficService(db)
    return service.search_and_classify(
        query=q,
        category=category,
        jurisdiction=jurisdiction,
        language=language
    )

@router.get("/categories")
def get_rule_categories(db: Session = Depends(get_db)):
    """Returns active traffic violation categories and rule counts."""
    service = TrafficService(db)
    return service.get_categories()

@router.get("/jurisdictions")
def get_rule_jurisdictions(db: Session = Depends(get_db)):
    """Returns all recognized jurisdictions in the official rules registry."""
    service = TrafficService(db)
    return service.get_jurisdictions()

@router.get("/verification-statuses")
def get_verification_statuses(db: Session = Depends(get_db)):
    """Returns official verification status definitions and metadata."""
    service = TrafficService(db)
    return service.get_verification_statuses()

@router.get("/{id_or_code}", response_model=TrafficRuleResponse)
def get_traffic_rule_detail(
    id_or_code: str,
    language: Optional[str] = Query("en", description="Language preference: 'en', 'ur', 'ps'"),
    db: Session = Depends(get_db)
):
    """
    Retrieves a single statutory traffic rule by ID (e.g. '1') or rule code (e.g. 'MVO-SEC-89A').
    Includes exact statutory source, jurisdiction, verbatim legal text, and verification badge.
    """
    service = TrafficService(db)
    return service.get_rule_by_id_or_code(id_or_code, language=language)
