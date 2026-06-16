"""
Unit tests for password hashing and JWT utilities.
"""
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token


def test_password_hashing_roundtrip():
    password = "SuperSecret123"
    hashed = hash_password(password)

    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_access_token_roundtrip():
    token = create_access_token(subject="user-123", role="student")
    payload = decode_access_token(token)

    assert payload is not None
    assert payload["sub"] == "user-123"
    assert payload["role"] == "student"


def test_invalid_token_returns_none():
    assert decode_access_token("not-a-real-token") is None
