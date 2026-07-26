import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

# Find SQLite file dynamically
DB_DIR = os.path.dirname(os.path.abspath(__file__))
test_db_path = None
curr = DB_DIR
for _ in range(5):
    candidate = os.path.join(curr, "test_ksp.db")
    if os.path.exists(candidate):
        test_db_path = os.path.abspath(candidate)
        break
    curr = os.path.dirname(curr)

if not test_db_path:
    test_db_path = os.path.join(os.path.abspath(os.getcwd()), "test_ksp.db")

DATABASE_URL = os.getenv("DATABASE_URL", "")

# Fallback to SQLite if DATABASE_URL points to container host 'db' when outside docker
if "postgresql" in DATABASE_URL:
    if ("@db:" in DATABASE_URL or "@db/" in DATABASE_URL) and not os.path.exists("/.dockerenv"):
        DATABASE_URL = f"sqlite:///{test_db_path}"
    else:
        try:
            import socket
            host_part = DATABASE_URL.split("@")[1].split("/")[0] if "@" in DATABASE_URL else "localhost:5432"
            host = host_part.split(":")[0]
            port = int(host_part.split(":")[1]) if ":" in host_part else 5432
            s = socket.create_connection((host, port), timeout=0.5)
            s.close()
        except Exception:
            DATABASE_URL = f"sqlite:///{test_db_path}"
elif not DATABASE_URL:
    DATABASE_URL = f"sqlite:///{test_db_path}"

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

