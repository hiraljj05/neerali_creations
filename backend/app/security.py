from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


def verify_password(plain_password: str) -> bool:
    return pwd_context.verify(plain_password, settings.owner_password_hash)


def create_access_token(remember: bool = False) -> str:
    minutes = settings.jwt_remember_minutes if remember else settings.jwt_expire_minutes
    expire = datetime.utcnow() + timedelta(minutes=minutes)
    payload = {"sub": "owner", "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def _decode_token(token: str) -> bool:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return payload.get("sub") == "owner"
    except JWTError:
        return False


def require_owner(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    if credentials is None or not _decode_token(credentials.credentials):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Owner login required")
    return True


def is_owner_optional(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> bool:
    if credentials is None:
        return False
    return _decode_token(credentials.credentials)
