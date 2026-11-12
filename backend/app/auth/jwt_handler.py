import uuid
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import bcrypt
from jose import JWTError, jwt
from app.config import settings

def hash_password(password: str) -> str:
    """
    Hashes a password using standard bcrypt with automatic salt generation.
    Never stores or logs plain text passwords.
    """
    salt = bcrypt.gensalt(rounds=12)
    hashed_bytes = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed_bytes.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain text password against a stored hash.
    Supports standard bcrypt hashes ($2b$) and provides fallback for legacy test hashes.
    """
    if not plain_password or not hashed_password:
        return False

    try:
        if hashed_password.startswith(("$2b$", "$2a$", "$2y$")):
            return bcrypt.checkpw(
                plain_password.encode("utf-8"),
                hashed_password.encode("utf-8")
            )
        
        # Legacy salted SHA-256 fallback compatibility
        salt = settings.SECRET_KEY[:8]
        legacy_hash = hashlib.sha256(f"{salt}{plain_password}".encode("utf-8")).hexdigest()
        return legacy_hash == hashed_password
    except Exception:
        return False

def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Generates a cryptographically signed JWT access token.
    Embeds:
    - 'sub': Subject / User ID
    - 'role': RBAC role identifier
    - 'jti': Unique JWT ID (UUID4) enabling explicit revocation/logout
    - 'iat': Issued at UTC timestamp
    - 'exp': Expiration UTC timestamp
    """
    to_encode = data.copy()
    now_utc = datetime.now(timezone.utc)
    
    if expires_delta:
        expire = now_utc + expires_delta
    else:
        expire = now_utc + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    jti = to_encode.get("jti") or str(uuid.uuid4())

    to_encode.update({
        "exp": expire,
        "iat": now_utc,
        "jti": jti
    })

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Validates cryptographic signature and expiration of JWT token.
    Returns decoded dictionary payload or None if invalid/tampered/expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None
