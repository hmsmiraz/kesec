from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app import models, schemas
from app.crypto import decrypt_value, encrypt_value
from app.deps import get_current_user, get_db

router = APIRouter(prefix="/api/secrets", tags=["secrets"])


def _get_owned_secret(db: DBSession, secret_id: int, user_id: int) -> models.Secret:
    secret = (
        db.query(models.Secret)
        .filter(models.Secret.id == secret_id, models.Secret.user_id == user_id)
        .first()
    )
    if secret is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Secret not found")
    return secret


def _to_secret_out(secret: models.Secret) -> schemas.SecretOut:
    return schemas.SecretOut(
        id=secret.id,
        title=secret.title,
        username=secret.username,
        password=decrypt_value(secret.encrypted_password),
        url=secret.url,
        notes=secret.notes,
        created_at=secret.created_at,
        updated_at=secret.updated_at,
    )


@router.get("", response_model=List[schemas.SecretOut])
def view_secrets(
    current_user: models.User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    secrets = (
        db.query(models.Secret)
        .filter(models.Secret.user_id == current_user.id)
        .order_by(models.Secret.created_at.desc())
        .all()
    )
    return [_to_secret_out(secret) for secret in secrets]


@router.get("/{secret_id}", response_model=schemas.SecretOut)
def get_secret(
    secret_id: int,
    current_user: models.User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    secret = _get_owned_secret(db, secret_id, current_user.id)
    return _to_secret_out(secret)


@router.post("", response_model=schemas.SecretOut, status_code=status.HTTP_201_CREATED)
def add_secret(
    payload: schemas.SecretCreate,
    current_user: models.User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    secret = models.Secret(
        user_id=current_user.id,
        title=payload.title,
        username=payload.username,
        encrypted_password=encrypt_value(payload.password),
        url=payload.url,
        notes=payload.notes,
    )
    db.add(secret)
    db.commit()
    db.refresh(secret)
    return _to_secret_out(secret)


@router.put("/{secret_id}", response_model=schemas.SecretOut)
def edit_secret(
    secret_id: int,
    payload: schemas.SecretUpdate,
    current_user: models.User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    secret = _get_owned_secret(db, secret_id, current_user.id)

    if payload.title is not None:
        secret.title = payload.title
    if payload.username is not None:
        secret.username = payload.username
    if payload.password is not None:
        secret.encrypted_password = encrypt_value(payload.password)
    if payload.url is not None:
        secret.url = payload.url
    if payload.notes is not None:
        secret.notes = payload.notes

    db.commit()
    db.refresh(secret)
    return _to_secret_out(secret)


@router.delete("/{secret_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_secret(
    secret_id: int,
    current_user: models.User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    secret = _get_owned_secret(db, secret_id, current_user.id)
    db.delete(secret)
    db.commit()
    return None
