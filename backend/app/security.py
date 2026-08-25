import time
import uuid
from datetime import datetime
from typing import Tuple

import bcrypt
import jwt

from app.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except ValueError:
        # Malformed hash or oversized input - treat as "does not match" rather than crash.
        return False


def create_access_token(user_id: int) -> Tuple[str, str, datetime]:
    """Create a signed JWT for user_id.

    Returns (token, jti, expires_at). jti/expires_at are also persisted as an
    AuthSession row so the token can be revoked server-side on logout.
    """
    jti = str(uuid.uuid4())
    now_ts = int(time.time())
    exp_ts = now_ts + settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    payload = {"sub": str(user_id), "jti": jti, "iat": now_ts, "exp": exp_ts}
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    expires_at = datetime.utcfromtimestamp(exp_ts)
    return token, jti, expires_at


def decode_access_token(token: str) -> dict:
    """Raises jwt.PyJWTError (or a subclass) if the token is invalid/expired."""
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
