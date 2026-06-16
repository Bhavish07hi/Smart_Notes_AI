"""
Integration tests for document upload, listing, and status endpoints.
"""
import io


def _get_token(client, email="frank@example.com"):
    response = client.post(
        "/api/v1/auth/register",
        json={"name": "Frank", "email": email, "password": "password123"},
    )
    return response.json()["access_token"]


def test_upload_txt_document(client, tmp_path, monkeypatch):
    token = _get_token(client)

    # Redirect upload storage to a temp directory for this test
    from app.core.config import settings

    monkeypatch.setattr(settings, "UPLOAD_DIR", str(tmp_path))

    file_content = b"This is a sample study document about photosynthesis."
    response = client.post(
        "/api/v1/documents/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"files": ("notes.txt", io.BytesIO(file_content), "text/plain")},
    )

    assert response.status_code == 201
    data = response.json()
    assert len(data) == 1
    assert data[0]["original_filename"] == "notes.txt"
    assert data[0]["file_type"] == "txt"


def test_upload_rejects_unsupported_extension(client, tmp_path, monkeypatch):
    token = _get_token(client, email="grace@example.com")

    from app.core.config import settings

    monkeypatch.setattr(settings, "UPLOAD_DIR", str(tmp_path))

    response = client.post(
        "/api/v1/documents/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"files": ("malware.exe", io.BytesIO(b"binary"), "application/octet-stream")},
    )

    assert response.status_code == 400


def test_list_documents_requires_auth(client):
    response = client.get("/api/v1/documents")
    assert response.status_code == 401


def test_list_documents_empty_for_new_user(client):
    token = _get_token(client, email="heidi@example.com")

    response = client.get("/api/v1/documents", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []
