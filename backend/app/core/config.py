from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from slowapi import Limiter
from slowapi.util import get_remote_address
from typing import Any

class SecretManager:
    """
    Simulates an authenticated API call to a secure HashiCorp Vault
    or AWS Secrets Manager.
    """
    def __init__(self):
        # In a real environment, this would involve an IAM role or AppRole authentication
        self._vault_simulation = {
            "SECRET_KEY": os.getenv("SECRET_KEY", "fallback-secret-key"),
            "PRIVATE_KEY": self._load_key("private_key.pem"),
            "PUBLIC_KEY": self._load_key("public_key.pem"),
        }

    def _load_key(self, filename: str) -> str:
        candidate_paths = [
            filename,
            os.path.join("..", filename),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", filename)),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", filename)),
        ]
        for p in candidate_paths:
            if os.path.exists(p):
                try:
                    with open(p, "r") as f:
                        return f.read()
                except Exception:
                    pass
        return ""

    def get_secret(self, key: str) -> Any:
        # Simulate network latency and authentication check
        # print(f"[VAULT] Authenticating request for secret: {key}")
        return self._vault_simulation.get(key)

class Settings(BaseSettings):
    SECRET_KEY: str = "local-secret-key-for-demo-purposes"
    ALGORITHM: str = "RS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    DATABASE_URL: str = "sqlite:///./test_ksp.db"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173,https://ksp-platform.gov.in"
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "gemma4:31b"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
secret_manager = SecretManager()
limiter = Limiter(key_func=get_remote_address)

class DeviceRegistry:
    """
    Simulates a Mobile Device Management (MDM) registry that tracks
    authorized hardware devices tied to users.
    """
    def __init__(self):
        # In a real system, this would be a database of registered device IDs
        # with their associated public keys.
        self._registry = {
            # "user_id_1": {"device_id": "dev_123", "public_key": "..."}
        }

    def is_device_authorized(self, user_id: str, device_token: str) -> bool:
        # Simulate verification of a signed device token
        # For this simulation, we accept tokens that start with 'KSP-MDM-AUTH-'
        return device_token.startswith("KSP-MDM-AUTH-")

device_registry = DeviceRegistry()
