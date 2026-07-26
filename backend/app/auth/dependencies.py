from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from .security import decode_access_token
from ..schemas.auth import TokenData
from ..core.config import device_registry

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return TokenData(username=payload.get("sub"), role=payload.get("role"))

class RoleChecker:
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(self, request: Request, user: TokenData = Depends(get_current_user)):
        # Zero Trust Header Validation
        mdm_token = request.headers.get("X-KSP-MDM-Token")
        if not mdm_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Managed device token (X-KSP-MDM-Token) is missing."
            )

        if not device_registry.is_device_authorized(user.username, mdm_token):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Device token is invalid or unauthorized."
            )

        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have enough permissions to access this resource"
            )
        return user
