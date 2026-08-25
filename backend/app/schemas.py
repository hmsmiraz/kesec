from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

# bcrypt only hashes the first 72 bytes of a password. Capping input at 72
# characters keeps validation errors clean instead of a hashing crash later.
MAX_PASSWORD_LENGTH = 72


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=MAX_PASSWORD_LENGTH)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=MAX_PASSWORD_LENGTH)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SecretCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    username: Optional[str] = Field(default=None, max_length=255)
    password: str = Field(min_length=1)
    url: Optional[str] = Field(default=None, max_length=500)
    notes: Optional[str] = None


class SecretUpdate(BaseModel):
    """All fields optional: only the fields the client sends get changed."""

    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    username: Optional[str] = Field(default=None, max_length=255)
    password: Optional[str] = Field(default=None, min_length=1)
    url: Optional[str] = Field(default=None, max_length=500)
    notes: Optional[str] = None


class SecretOut(BaseModel):
    id: int
    title: str
    username: Optional[str]
    password: str
    url: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
