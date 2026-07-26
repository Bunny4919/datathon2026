import sys
import os
os.environ["DATABASE_URL"] = "sqlite:///./test_ksp.db"
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "operational"

if __name__ == "__main__":
    test_health()
    test_root()
    print("All app main tests passed successfully!")
