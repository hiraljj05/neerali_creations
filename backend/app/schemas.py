from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ItemOut(BaseModel):
    id: UUID
    size: str | None
    category: str
    in_stock: bool
    created_at: datetime

    class Config:
        from_attributes = True


class StockUpdate(BaseModel):
    in_stock: bool


class LoginRequest(BaseModel):
    password: str
    remember_me: bool = False


class LoginResponse(BaseModel):
    token: str
