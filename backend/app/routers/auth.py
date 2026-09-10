from fastapi import APIRouter, HTTPException, status

from app.schemas import LoginRequest, LoginResponse
from app.security import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    if not verify_password(payload.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password")
    return LoginResponse(token=create_access_token(payload.remember_me))
