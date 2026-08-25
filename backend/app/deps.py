from datetime import datetime

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session as DBSession

from app import models
from app.database import SessionLocal
from app.security import decode_access_token

# tokenUrl is only used to populate OpenAPI docs; login itself takes a JSON body, not a form.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

_credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_session(
    token: str = Depends(oauth2_scheme),
    db: DBSession = Depends(get_db),
) -> models.AuthSession:
    """Validates the JWT's signature/expiry AND that it hasn't been logged out."""
    if not token:
        raise _credentials_exception

    try:
        payload = decode_access_token(token)
        jti = payload.get("jti")
        if jti is None:
            raise _credentials_exception
    except jwt.PyJWTError:
        raise _credentials_exception

    session = db.query(models.AuthSession).filter(models.AuthSession.jti == jti).first()
    if session is None:
        raise _credentials_exception

    if session.expires_at < datetime.utcnow():
        db.delete(session)
        db.commit()
        raise _credentials_exception

    return session


def get_current_user(
    session: models.AuthSession = Depends(get_current_session),
    db: DBSession = Depends(get_db),
) -> models.User:
    user = db.query(models.User).filter(models.User.id == session.user_id).first()
    if user is None:
        raise _credentials_exception
    return user
