import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User
from auth import get_password_hash, create_access_token, SECRET_KEY, ALGORITHM
from jose import jwt
import pytest
from fastapi.testclient import TestClient
from main import app

# Use SQLite for testing
DATABASE_URL = "sqlite:///test_rbac.db"
os.environ["DATABASE_URL"] = DATABASE_URL
engine = create_engine(DATABASE_URL)
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(bind=engine)

# Create a dummy DB session for FastAPI
from database import get_db
app.dependency_overrides[get_db] = lambda: SessionLocal()

client = TestClient(app)

def test_rbac():
    print("Testing RBAC Logic...")

    # Setup users
    session = SessionLocal()
    users = [
        User(username="investigator", hashed_password=get_password_hash("pass"), role="Investigator"),
        User(username="analyst", hashed_password=get_password_hash("pass"), role="Analyst"),
        User(username="supervisor", hashed_password=get_password_hash("pass"), role="Supervisor"),
        User(username="policymaker", hashed_password=get_password_hash("pass"), role="Policymaker"),
    ]
    session.add_all(users)
    session.commit()

    def get_token(role):
        return create_access_token(data={"username": role, "role": role})

    # Test Case 1: Investigator accessing Analyst data (Allowed)
    # Wait, in my main.py: RoleChecker(["Analyst", "Supervisor", "Policymaker"])
    # Investigator is NOT in this list. So it should be Forbidden.
    token_inv = get_token("Investigator")
    resp = client.get("/analyst-data", headers={"Authorization": f"Bearer {token_inv}"})
    assert resp.status_code == 403, f"Investigator should be forbidden from /analyst-data, got {resp.status_code}"
    print("Investigator correctly forbidden from analyst data.")

    # Test Case 2: Analyst accessing Analyst data (Allowed)
    token_ana = get_token("Analyst")
    resp = client.get("/analyst-data", headers={"Authorization": f"Bearer {token_ana}"})
    assert resp.status_code == 200, f"Analyst should be allowed to /analyst-data, got {resp.status_code}"
    print("Analyst correctly allowed to analyst data.")

    # Test Case 3: Analyst accessing Supervisor data (Forbidden)
    resp = client.get("/supervisor-admin", headers={"Authorization": f"Bearer {token_ana}"})
    assert resp.status_code == 403, f"Analyst should be forbidden from /supervisor-admin, got {resp.status_code}"
    print("Analyst correctly forbidden from supervisor data.")

    # Test Case 4: Supervisor accessing Supervisor data (Allowed)
    token_sup = get_token("Supervisor")
    resp = client.get("/supervisor-admin", headers={"Authorization": f"Bearer {token_sup}"})
    assert resp.status_code == 200, f"Supervisor should be allowed to /supervisor-admin, got {resp.status_code}"
    print("Supervisor correctly allowed to supervisor data.")

    # Test Case 5: Policymaker accessing everything (Allowed)
    token_pol = get_token("Policymaker")
    resp = client.get("/policymaker-dashboard", headers={"Authorization": f"Bearer {token_pol}"})
    assert resp.status_code == 200, f"Policymaker should be allowed to /policymaker-dashboard, got {resp.status_code}"
    print("Policymaker correctly allowed to dashboard.")

    print("RBAC logic verified!")

if __name__ == "__main__":
    test_rbac()
