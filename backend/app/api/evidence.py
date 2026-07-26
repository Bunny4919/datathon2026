from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..auth.dependencies import RoleChecker, get_current_user
from ..schemas.auth import TokenData
from ..core.config import secret_manager
from jose import jwt
import hashlib
import os
from datetime import datetime

router = APIRouter(prefix="/evidence", tags=["Evidence Management"])

# In a real system, this would be a secure S3 bucket or WORM storage
UPLOAD_DIR = "uploads/evidence"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def calculate_sha256(file_content):
    sha256_hash = hashlib.sha256()
    sha256_hash.update(file_content)
    return sha256_hash.hexdigest()

@router.post("/upload")
async def upload_evidence(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: TokenData = Depends(RoleChecker(["Investigator", "Supervisor"]))
):
    content = await file.read()
    file_hash = calculate_sha256(content)

    # Save file with hash in name to prevent collisions and for integrity
    file_extension = os.path.splitext(file.filename)[1]
    file_name = f"{file_hash}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, file_name)

    with open(file_path, "wb") as f:
        f.write(content)

    # Digital Signature for Non-Repudiation
    # Sign the file hash using the investigator's (system) private key
    private_key = secret_manager.get_secret("PRIVATE_KEY")
    signature = jwt.encode({"hash": file_hash}, private_key, algorithm="RS256")

    # Need to find user_id for the evidence table
    from ..models.user import User
    db_user = db.query(User).filter(User.username == user.username).first()

    # We assume fir_id is provided in a query param or header for now,
    # as it's not in the upload form.
    # In a full implementation, we'd have a proper schema.
    from sqlalchemy import text
    db.execute(
        text("INSERT INTO evidence (fir_id, file_path, sha256_hash, signature, uploaded_at, uploaded_by) VALUES (:f, :p, :h, :s, :t, :u)"),
        {"f": 1, "p": file_path, "h": file_hash, "s": signature, "t": datetime.utcnow(), "u": db_user.id}
    )
    db.commit()

    return {
        "message": "Evidence uploaded successfully",
        "file_hash": file_hash,
        "signature": signature,
        "file_path": file_path
    }
