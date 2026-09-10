import uuid
from datetime import datetime

from sqlalchemy import Column, String, Boolean, DateTime, LargeBinary
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class DressItem(Base):
    __tablename__ = "dress_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    size = Column(String, nullable=True)
    category = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    image = Column(LargeBinary, nullable=False)
    in_stock = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
