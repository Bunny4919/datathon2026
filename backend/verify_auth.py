import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User
from auth import get_password_hash, create_access_token, verify_password, SECRET_KEY, ALGORITHM
from jose import jwt

# Use SQLite for testing
DATABASE_URL = "sqlite:///test_auth.db"
engine = create_engine(DATABASE_URL)
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(bind=engine)
session = SessionLocal()

def test_auth():
    print("Testing Auth Logic...")

    # Create a test user
    username = "testuser"
    password = "testpassword"
    hashed_password = get_password_hash(password)

    user = User(username=username, hashed_password=hashed_password, role="Analyst")
    session.add(user)
    session.commit()

    # Test password hashing
    assert verify_password(password, hashed_password), "Password verification failed"
    print("Password hashing works.")

    # Test token creation
    token = create_access_token(data={"username": username, "role": "Analyst"})
    assert token is not None, "Token creation failed"
    print("Token creation works.")

    # Test token decoding
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["username"] == username, "Username in token mismatch"
    assert payload["role"] == "Analyst", "Role in token mismatch"
    print("Token decoding works.")

    print("Auth logic verified!")

if __name__ == "__main__":
    test_auth()
