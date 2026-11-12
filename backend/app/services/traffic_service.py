from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from fastapi import HTTPException, status

from app.models.traffic_rule import TrafficRule, RuleVerificationStatus, Violation
from app.models.challan import Challan
from app.models.user import User, UserRole
from app.models.audit_log import AuditLog
from app.schemas.traffic_rule import (
    TrafficRuleCreate,
    TrafficRuleUpdate,
    TrafficRuleVerifyRequest,
    TrafficRuleResponse,
    ClassifiedSearchResult,
)

class TrafficService:
    """
    Core service managing Pakistan statutory traffic violation rules.
    Enforces legal accuracy:
    - Anchors every rule in its statutory enactment, jurisdiction, and verification status.
    - Strictly forbids fabricating fines or legal rules.
    - Distinguishes verified rules, unverified content, and unavailable information.
    """

    def __init__(self, db: Session):
        self.db = db

    # -------------------------------------------------------------
    # 1. Retrieval & Localized Presentation
    # -------------------------------------------------------------
    def _format_rule_response(self, rule: TrafficRule, language: str = "en") -> TrafficRuleResponse:
        """Enriches rule with localized titles, descriptions, and verification badges."""
        lang = (language or "en").lower().strip()
        if lang == "ur":
            loc_title = rule.title_ur or rule.title
            loc_desc = rule.description_ur or rule.description
            lang_used = "ur"
        elif lang == "ps":
            loc_title = rule.title_ps or rule.title
            loc_desc = rule.description_ps or rule.description
            lang_used = "ps"
        else:
            loc_title = rule.title
            loc_desc = rule.description
            lang_used = "en"

        badges = {
            RuleVerificationStatus.VERIFIED.value: "Verified Statutory Law (Official Gazette)",
            RuleVerificationStatus.PENDING_VERIFICATION.value: "Pending Legal Review",
            RuleVerificationStatus.UNVERIFIED.value: "Unverified Content (Advisory Only)",
            RuleVerificationStatus.DEPRECATED.value: "Superseded / Deprecated",
        }
        badge = badges.get(rule.verification_status, "Unverified")

        return TrafficRuleResponse(
            id=rule.id,
            rule_code=rule.rule_code,
            section=rule.section,
            title=rule.title,
            title_ur=rule.title_ur,
            title_ps=rule.title_ps,
            description=rule.description,
            description_ur=rule.description_ur,
            description_ps=rule.description_ps,
            category=rule.category,
            fine_amount=rule.fine_amount,
            penalty_points=rule.penalty_points,
            penalty_amount=float(rule.fine_amount),
            source=rule.source,
            jurisdiction=rule.jurisdiction,
            source_wording=rule.source_wording,
            source_url=rule.source_url,
            verification_status=RuleVerificationStatus(rule.verification_status)
            if rule.verification_status in RuleVerificationStatus.__members__
            else RuleVerificationStatus.VERIFIED,
            is_active=rule.is_active,
            is_verified=rule.is_verified,
            verified_by_id=rule.verified_by_id,
            verified_at=rule.verified_at,
            verification_notes=rule.verification_notes,
            created_at=rule.created_at,
            updated_at=rule.updated_at,
            localized_title=loc_title,
            localized_description=loc_desc,
            language_used=lang_used,
            verification_badge=badge,
            statutory_disclaimer=(
                "Statutory citation under Pakistani law. Fines and penalty points reflect official gazetted schedules."
                if rule.is_verified
                else "Caution: This rule is UNVERIFIED and pending official legal gazette confirmation. Fines cannot be enforced."
            ),
        )

    def get_rules(
        self,
        search: Optional[str] = None,
        category: Optional[str] = None,
        jurisdiction: Optional[str] = None,
        verification_status: Optional[str] = None,
        language: str = "en",
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[TrafficRuleResponse]:
        """
        Retrieves traffic rules with keyword search, category filtering,
        jurisdiction filtering, and verification status filtering.
        """
        query = self.db.query(TrafficRule)

        if is_active is not None:
            query = query.filter(TrafficRule.is_active == is_active)

        if category and category.upper() != "ALL":
            query = query.filter(TrafficRule.category.ilike(f"%{category}%"))

        if jurisdiction and jurisdiction.upper() != "ALL":
            query = query.filter(TrafficRule.jurisdiction.ilike(f"%{jurisdiction}%"))

        if verification_status and verification_status.upper() != "ALL":
            query = query.filter(TrafficRule.verification_status == verification_status.upper())

        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    TrafficRule.title.ilike(term),
                    TrafficRule.title_ur.ilike(term),
                    TrafficRule.title_ps.ilike(term),
                    TrafficRule.description.ilike(term),
                    TrafficRule.description_ur.ilike(term),
                    TrafficRule.description_ps.ilike(term),
                    TrafficRule.section.ilike(term),
                    TrafficRule.rule_code.ilike(term),
                    TrafficRule.source.ilike(term),
                    TrafficRule.jurisdiction.ilike(term),
                    TrafficRule.category.ilike(term),
                )
            )

        rules = query.order_by(TrafficRule.id.asc()).offset(skip).limit(limit).all()
        return [self._format_rule_response(r, language=language) for r in rules]

    def get_rule_by_id_or_code(self, id_or_code: str, language: str = "en") -> TrafficRuleResponse:
        """Retrieves a single rule by numeric primary key or unique rule_code."""
        rule = None
        if id_or_code.isdigit():
            rule = self.db.query(TrafficRule).filter(TrafficRule.id == int(id_or_code)).first()

        if not rule:
            rule = self.db.query(TrafficRule).filter(
                func.lower(TrafficRule.rule_code) == id_or_code.lower().strip()
            ).first()

        if not rule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Traffic rule '{id_or_code}' not found in official legal registry.",
            )

        return self._format_rule_response(rule, language=language)

    # -------------------------------------------------------------
    # 2. Strict Search Classification (Verified vs Unverified vs Unavailable)
    # -------------------------------------------------------------
    def search_and_classify(
        self,
        query: Optional[str] = None,
        category: Optional[str] = None,
        jurisdiction: Optional[str] = None,
        language: str = "en",
    ) -> ClassifiedSearchResult:
        """
        Classifies query results into three strictly separated statutory states:
        1. 'VERIFIED': Found official, gazetted statutory law.
        2. 'UNVERIFIED': Found matching draft or unverified community advisory rules.
        3. 'UNAVAILABLE': No official statute exists; prevents hallucinations or invented fines.
        """
        results = self.get_rules(
            search=query,
            category=category,
            jurisdiction=jurisdiction,
            language=language,
            limit=50,
        )

        if not results:
            return ClassifiedSearchResult(
                status="UNAVAILABLE",
                query=query,
                category=category,
                jurisdiction=jurisdiction,
                language=language,
                total_results=0,
                rules=[],
                guidance_message=(
                    "Unavailable Information: No verified statutory traffic rule exists in the official "
                    "Pakistan legal registry for this query or jurisdiction. Statutory fine amounts cannot be fabricated."
                ),
                caution_warning=None,
                statutory_disclaimer="Only officially gazetted traffic laws are codified.",
            )

        has_unverified = any(not r.is_verified for r in results)
        all_verified = all(r.is_verified for r in results)

        if all_verified:
            return ClassifiedSearchResult(
                status="VERIFIED",
                query=query,
                category=category,
                jurisdiction=jurisdiction,
                language=language,
                total_results=len(results),
                rules=results,
                guidance_message="All returned rules are verified statutory enactments under Pakistani law.",
                caution_warning=None,
            )
        else:
            return ClassifiedSearchResult(
                status="UNVERIFIED" if not any(r.is_verified for r in results) else "MIXED",
                query=query,
                category=category,
                jurisdiction=jurisdiction,
                language=language,
                total_results=len(results),
                rules=results,
                guidance_message="Results contain content awaiting statutory legal verification.",
                caution_warning=(
                    "Warning: One or more returned rules are UNVERIFIED and pending official legal gazette confirmation. "
                    "They cannot be used as legal authority."
                ),
            )

    # -------------------------------------------------------------
    # 3. Admin Management Endpoints (Add, Update, Verify, Delete)
    # -------------------------------------------------------------
    def create_rule(
        self,
        data: TrafficRuleCreate,
        current_admin: User,
        ip_address: Optional[str] = None
    ) -> TrafficRuleResponse:
        """
        Admin-only endpoint to add a traffic rule.
        Enforces source, jurisdiction, and legal non-arbitrary validation.
        """
        # 1. Unique rule_code validation
        existing = self.db.query(TrafficRule).filter(
            func.lower(TrafficRule.rule_code) == data.rule_code.lower().strip()
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Traffic rule with code '{data.rule_code}' already exists in registry.",
            )

        # 2. Strict legal validation
        if not data.source or len(data.source.strip()) < 3:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Source legal reference is mandatory (e.g. Motor Vehicles Ordinance 1965).",
            )

        if not data.jurisdiction or len(data.jurisdiction.strip()) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Jurisdiction is mandatory (e.g. Islamabad Capital Territory, National Highways).",
            )

        rule = TrafficRule(
            rule_code=data.rule_code.strip(),
            section=data.section.strip(),
            title=data.title.strip(),
            title_ur=data.title_ur.strip() if data.title_ur else None,
            title_ps=data.title_ps.strip() if data.title_ps else None,
            description=data.description.strip(),
            description_ur=data.description_ur.strip() if data.description_ur else None,
            description_ps=data.description_ps.strip() if data.description_ps else None,
            category=data.category.strip(),
            fine_amount=data.fine_amount,
            penalty_points=data.penalty_points,
            source=data.source.strip(),
            jurisdiction=data.jurisdiction.strip(),
            source_wording=data.source_wording.strip() if data.source_wording else None,
            source_url=str(data.source_url) if data.source_url else None,
            verification_status=data.verification_status.value,
            is_active=data.is_active,
            verified_by_id=current_admin.id if data.verification_status == RuleVerificationStatus.VERIFIED else None,
            verified_at=datetime.now(timezone.utc) if data.verification_status == RuleVerificationStatus.VERIFIED else None,
        )

        self.db.add(rule)
        self.db.commit()
        self.db.refresh(rule)

        # Audit Log
        audit = AuditLog(
            event_type="RULE_CREATED",
            severity="INFO",
            actor_type="ADMIN",
            admin_id=current_admin.id,
            resource_type="traffic_rules",
            resource_id=rule.id,
            action_details=(
                f"Admin {current_admin.full_name} created traffic rule '{rule.rule_code}' "
                f"under '{rule.section}' with fine PKR {rule.fine_amount}."
            ),
            ip_address=ip_address,
            status="SUCCESS",
        )
        self.db.add(audit)
        self.db.commit()

        return self._format_rule_response(rule)

    def update_rule(
        self,
        rule_id: int,
        data: TrafficRuleUpdate,
        current_admin: User,
        ip_address: Optional[str] = None
    ) -> TrafficRuleResponse:
        """Admin-only endpoint to update an existing rule."""
        rule = self.db.query(TrafficRule).filter(TrafficRule.id == rule_id).first()
        if not rule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Traffic rule with ID {rule_id} not found.",
            )

        update_dict = data.model_dump(exclude_unset=True)

        # If rule_code is being modified, ensure uniqueness
        if "rule_code" in update_dict and update_dict["rule_code"]:
            new_code = update_dict["rule_code"].strip()
            conflict = self.db.query(TrafficRule).filter(
                func.lower(TrafficRule.rule_code) == new_code.lower(),
                TrafficRule.id != rule_id,
            ).first()
            if conflict:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Rule code '{new_code}' is already assigned to another rule.",
                )

        for field, value in update_dict.items():
            if field == "verification_status" and value is not None:
                rule.verification_status = value.value if hasattr(value, "value") else str(value)
                if rule.verification_status == RuleVerificationStatus.VERIFIED.value:
                    rule.verified_by_id = current_admin.id
                    rule.verified_at = datetime.now(timezone.utc)
            elif hasattr(rule, field) and value is not None:
                setattr(rule, field, value)

        rule.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(rule)

        # Audit Log
        audit = AuditLog(
            event_type="RULE_UPDATED",
            severity="INFO",
            actor_type="ADMIN",
            admin_id=current_admin.id,
            resource_type="traffic_rules",
            resource_id=rule.id,
            action_details=f"Admin {current_admin.full_name} updated traffic rule '{rule.rule_code}'.",
            ip_address=ip_address,
            status="SUCCESS",
        )
        self.db.add(audit)
        self.db.commit()

        return self._format_rule_response(rule)

    def verify_rule(
        self,
        rule_id: int,
        data: TrafficRuleVerifyRequest,
        current_admin: User,
        ip_address: Optional[str] = None
    ) -> TrafficRuleResponse:
        """Admin-only dedicated endpoint to verify or change verification status of a rule."""
        rule = self.db.query(TrafficRule).filter(TrafficRule.id == rule_id).first()
        if not rule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Traffic rule with ID {rule_id} not found.",
            )

        rule.verification_status = data.verification_status.value
        rule.verification_notes = data.verification_notes or rule.verification_notes

        if data.source_wording:
            rule.source_wording = data.source_wording
        if data.source_url:
            rule.source_url = str(data.source_url)

        if data.verification_status == RuleVerificationStatus.VERIFIED:
            rule.verified_by_id = current_admin.id
            rule.verified_at = datetime.now(timezone.utc)
        else:
            rule.verified_by_id = None
            rule.verified_at = None

        rule.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(rule)

        # Audit Log
        audit = AuditLog(
            event_type="RULE_VERIFIED",
            severity="INFO",
            actor_type="ADMIN",
            admin_id=current_admin.id,
            resource_type="traffic_rules",
            resource_id=rule.id,
            action_details=(
                f"Admin {current_admin.full_name} changed verification status of rule '{rule.rule_code}' "
                f"to '{rule.verification_status}'."
            ),
            ip_address=ip_address,
            status="SUCCESS",
        )
        self.db.add(audit)
        self.db.commit()

        return self._format_rule_response(rule)

    def delete_rule(
        self,
        rule_id: int,
        current_admin: User,
        ip_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Admin-only endpoint to retire or delete a rule.
        If citations reference it, soft-deactivates to preserve database integrity.
        """
        rule = self.db.query(TrafficRule).filter(TrafficRule.id == rule_id).first()
        if not rule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Traffic rule with ID {rule_id} not found.",
            )

        # Check if challans reference this rule
        challan_count = self.db.query(Challan).filter(Challan.rule_id == rule_id).count()

        if challan_count > 0:
            # Soft-deactivate to avoid violating foreign key constraints
            rule.is_active = False
            rule.updated_at = datetime.now(timezone.utc)
            self.db.commit()
            action_msg = f"Deactivated rule '{rule.rule_code}' ({challan_count} citations reference this rule)."
        else:
            self.db.delete(rule)
            self.db.commit()
            action_msg = f"Permanently deleted unreferenced rule '{rule.rule_code}'."

        # Audit Log
        audit = AuditLog(
            event_type="RULE_DELETED" if challan_count == 0 else "RULE_DEACTIVATED",
            severity="WARNING",
            actor_type="ADMIN",
            admin_id=current_admin.id,
            resource_type="traffic_rules",
            resource_id=rule_id,
            action_details=f"Admin {current_admin.full_name}: {action_msg}",
            ip_address=ip_address,
            status="SUCCESS",
        )
        self.db.add(audit)
        self.db.commit()

        return {"status": "success", "message": action_msg, "rule_id": rule_id}

    # -------------------------------------------------------------
    # 4. Reference Lookups & Taxonomies
    # -------------------------------------------------------------
    def get_categories(self) -> List[Dict[str, Any]]:
        """Returns distinct violation categories and rule counts."""
        rows = (
            self.db.query(TrafficRule.category, func.count(TrafficRule.id))
            .filter(TrafficRule.is_active == True)
            .group_by(TrafficRule.category)
            .all()
        )
        return [{"category": row[0], "rule_count": row[1]} for row in rows]

    def get_jurisdictions(self) -> List[str]:
        """Returns distinct jurisdictions."""
        rows = (
            self.db.query(TrafficRule.jurisdiction)
            .filter(TrafficRule.is_active == True)
            .distinct()
            .all()
        )
        return [row[0] for row in rows if row[0]]

    def get_verification_statuses(self) -> List[Dict[str, str]]:
        """Returns verification status definitions."""
        return [
            {
                "status": RuleVerificationStatus.VERIFIED.value,
                "label": "Verified Statutory Law",
                "description": "Codified under official Gazette of Pakistan statutory law (MVO 1965 / NHSO 2000).",
            },
            {
                "status": RuleVerificationStatus.PENDING_VERIFICATION.value,
                "label": "Pending Verification",
                "description": "Submitted rule awaiting legal gazette confirmation by traffic authorities.",
            },
            {
                "status": RuleVerificationStatus.UNVERIFIED.value,
                "label": "Unverified Content",
                "description": "Community advisory or provisional rule without legal enforcement backing.",
            },
            {
                "status": RuleVerificationStatus.DEPRECATED.value,
                "label": "Deprecated / Repealed",
                "description": "Superseded or repealed traffic regulation.",
            },
        ]

    # Legacy compatibility helper
    def get_violations(self, category: Optional[str] = None, search: Optional[str] = None) -> List[Violation]:
        """Backward compatibility for legacy violation calls."""
        query = self.db.query(Violation)
        if category and category.upper() != "ALL":
            query = query.filter(Violation.category.ilike(f"%{category}%"))
        if search:
            term = f"%{search}%"
            query = query.filter(
                or_(
                    Violation.title.ilike(term),
                    Violation.section.ilike(term),
                    Violation.description.ilike(term),
                )
            )
        return query.all()
