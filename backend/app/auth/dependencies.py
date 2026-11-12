from typing import List, Callable, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.jwt_handler import decode_access_token
from app.models.user import User, UserRole
from app.models.revoked_token import RevokedToken
from app.models.admin import AdminUser

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Core authentication dependency.
    Validates token signature, expiration, active user status, and revocation list.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    # 1. Check if token JTI has been revoked via explicit logout
    jti = payload.get("jti")
    if jti:
        is_revoked = db.query(RevokedToken).filter(RevokedToken.token_jti == jti).first()
        if is_revoked:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    try:
        uid_int = int(user_id)
    except (ValueError, TypeError):
        raise credentials_exception

    user = db.query(User).filter(User.id == uid_int).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or suspended"
        )

    # Attach raw token and jti to user object for downstream logout handler
    user._current_token = token
    user._current_jti = jti
    user._token_exp = payload.get("exp")
    return user

def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Optional authentication dependency: returns User if valid Bearer token provided, else None."""
    if not token:
        return None
    try:
        return get_current_user(token=token, db=db)
    except HTTPException:
        return None

def get_current_citizen(current_user: User = Depends(get_current_user)) -> User:
    """Restricts access exclusively to verified citizen accounts."""
    if current_user.role != UserRole.CITIZEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Citizen account privileges required"
        )
    return current_user

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Restricts access to administrative and enforcement personnel."""
    allowed_roles = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TRAFFIC_OFFICER]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required"
        )
    return current_user

def get_current_super_admin(current_user: User = Depends(get_current_user)) -> User:
    """Restricts access to Command & Control Super Administrators."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Administrator authorization required"
        )
    return current_user

def require_permission(perm: str) -> Callable:
    """
    Fine-grained RBAC dependency factory.
    Validates whether the authenticated administrator possesses the requested permission.
    """
    def permission_checker(
        current_user: User = Depends(get_current_admin),
        db: Session = Depends(get_db)
    ) -> User:
        # Super Admin has universal capability
        if current_user.role == UserRole.SUPER_ADMIN:
            return current_user

        admin_record = db.query(AdminUser).filter_by(email=current_user.email).first()
        if not admin_record or not admin_record.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{perm}' required"
            )

        if not admin_record.role.has_permission(perm):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{perm}' denied for your administrative role"
            )

        return current_user

    return permission_checker
