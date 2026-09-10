import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DressItem
from app.schemas import ItemOut, StockUpdate
from app.security import require_owner, is_owner_optional

router = APIRouter(prefix="/items", tags=["items"])

ALLOWED_SIZES = {"M", "L", "XL", "XXL", "XXXL", "4XL", "5XL"}
DEFAULT_CATEGORIES = ["Cotton", "Coat Set", "Muslin"]


@router.get("/categories", response_model=list[str])
def list_categories(size: str | None = None, db: Session = Depends(get_db)):
    query = db.query(DressItem.category).filter(DressItem.category != "Lehenga")
    if size:
        query = query.filter(DressItem.size == size)
    used = {row[0] for row in query.distinct().all()}
    extra = sorted(c for c in used if c not in DEFAULT_CATEGORIES)
    return DEFAULT_CATEGORIES + extra


@router.get("", response_model=list[ItemOut])
def list_items(
    size: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
    owner: bool = Depends(is_owner_optional),
):
    query = db.query(DressItem)
    if category:
        query = query.filter(DressItem.category == category)
    if category != "Lehenga":
        if size:
            query = query.filter(DressItem.size == size)
    if not owner:
        query = query.filter(DressItem.in_stock.is_(True))
    return query.order_by(DressItem.created_at.desc()).all()


@router.get("/{item_id}/image")
def get_image(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    owner: bool = Depends(is_owner_optional),
):
    item = db.get(DressItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Photo not found")
    if not item.in_stock and not owner:
        raise HTTPException(status_code=404, detail="Photo not found")
    return Response(content=item.image, media_type=item.content_type)


@router.post("", response_model=ItemOut, status_code=status.HTTP_201_CREATED)
def upload_item(
    category: str = Form(...),
    size: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    owner: bool = Depends(require_owner),
):
    category = category.strip()
    if not category or len(category) > 40:
        raise HTTPException(status_code=400, detail="Invalid category")
    if category != "Lehenga":
        if size not in ALLOWED_SIZES:
            raise HTTPException(status_code=400, detail="Invalid size")
    else:
        size = None
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = file.file.read()
    item = DressItem(
        size=size,
        category=category,
        content_type=file.content_type,
        image=image_bytes,
        in_stock=True,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}", response_model=ItemOut)
def update_stock(
    item_id: uuid.UUID,
    payload: StockUpdate,
    db: Session = Depends(get_db),
    owner: bool = Depends(require_owner),
):
    item = db.get(DressItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Photo not found")
    item.in_stock = payload.in_stock
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    owner: bool = Depends(require_owner),
):
    item = db.get(DressItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Photo not found")
    db.delete(item)
    db.commit()
    return None
