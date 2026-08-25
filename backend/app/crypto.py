from cryptography.fernet import Fernet, InvalidToken

from app.config import settings

try:
    _fernet = Fernet(settings.ENCRYPTION_KEY.encode("utf-8"))
except (ValueError, TypeError) as exc:
    raise RuntimeError(
        "ENCRYPTION_KEY is not a valid Fernet key. Generate one with:\n"
        '  python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"'
    ) from exc


def encrypt_value(plaintext: str) -> str:
    """Encrypt a secret's password before it touches the database."""
    return _fernet.encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt_value(ciphertext: str) -> str:
    """Decrypt a secret's password. Only ever called for the owning user."""
    try:
        return _fernet.decrypt(ciphertext.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise ValueError("Could not decrypt value - data is corrupt or ENCRYPTION_KEY changed") from exc
