from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import get_database_url

def get_engine():
    return create_engine(get_database_url())

def get_db():
    engine = get_engine()
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
