from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from ..database.session import SessionLocal
from ..models.user import User
from ..auth.security import decode_access_token
from datetime import datetime
import hashlib

class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # We only audit authenticated requests
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            payload = decode_access_token(token)

            if payload:
                username = payload.get("sub")

                db = SessionLocal()
                try:
                    user = db.query(User).filter(User.username == username).first()
                    if user:
                        from sqlalchemy import text

                        # Implement Cryptographic Audit Chaining
                        # 1. Get the most recent chain hash
                        last_log = db.execute(text("SELECT chain_hash FROM audit_logs ORDER BY id DESC LIMIT 1")).fetchone()
                        prev_hash = last_log[0] if last_log else "GENESIS_BLOCK"

                        # 2. Define current log data
                        timestamp = datetime.utcnow()
                        log_data = f"{user.id}|{request.url.path}|{request.method}|{timestamp}|{request.client.host}"

                        # 3. Calculate current chain hash: sha256(prev_hash + current_data)
                        combined_data = f"{prev_hash}|{log_data}"
                        current_hash = hashlib.sha256(combined_data.encode()).hexdigest()

                        # 4. Log the request with the chain hash
                        db.execute(
                            text("INSERT INTO audit_logs (user_id, endpoint, action, timestamp, ip_address, chain_hash) VALUES (:u, :e, :a, :t, :ip, :h)"),
                            {"u": user.id, "e": request.url.path, "a": request.method, "t": timestamp, "ip": request.client.host, "h": current_hash}
                        )
                        db.commit()
                except Exception as e:
                    print(f"Audit logging error: {e}")
                finally:
                    db.close()

        return response
