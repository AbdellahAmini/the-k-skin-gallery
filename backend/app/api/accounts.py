import os
import re
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import Bundle, BundleCartItem, CartItem, Order, Product, User, WishlistItem
from ..security import COOKIE, current_user, current_user_optional, hash_password, issue_token, verify_password
from .commerce import order_public


router = APIRouter(prefix="/api")


def user_public(user: User) -> dict:
    return {"id": user.id, "email": user.email, "first_name": user.first_name,
            "last_name": user.last_name, "phone": user.phone, "role": user.role}


class RegisterIn(BaseModel):
    email: str
    password: str = Field(min_length=10, max_length=200)
    first_name: str = Field(min_length=2, max_length=100)
    last_name: str = Field(min_length=2, max_length=100)


class LoginIn(BaseModel):
    email: str
    password: str


def set_session(response: Response, user: User):
    response.set_cookie(COOKIE, issue_token(user), httponly=True, samesite="lax",
        secure=os.getenv("APP_ENV") == "production", max_age=14 * 24 * 3600, path="/")


@router.post("/auth/register", status_code=201)
def register(payload: RegisterIn, response: Response, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise HTTPException(422, "Saisissez une adresse e-mail valide.")
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(409, "Un compte existe déjà avec cet e-mail.")
    user = User(email=email, password_hash=hash_password(payload.password),
        first_name=payload.first_name.strip(), last_name=payload.last_name.strip())
    db.add(user)
    db.commit()
    db.refresh(user)
    set_session(response, user)
    return user_public(user)


@router.post("/auth/login")
def login(payload: LoginIn, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.strip().lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "E-mail ou mot de passe incorrect.")
    set_session(response, user)
    return user_public(user)


@router.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie(COOKIE, path="/")
    return {"ok": True}


@router.get("/auth/me")
def me(user: User | None = Depends(current_user_optional)):
    return user_public(user) if user else None


@router.get("/me/orders")
def my_orders(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Order).where(Order.user_id == user.id).order_by(Order.id.desc())).all()
    return [order_public(o) for o in rows]


@router.get("/me/orders/{order_id}")
def my_order(order_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    row = db.scalar(select(Order).where(Order.id == order_id, Order.user_id == user.id))
    if not row: raise HTTPException(404, "Commande introuvable.")
    return order_public(row)


@router.get("/me/wishlist")
def wishlist(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return [w.product_id for w in db.scalars(select(WishlistItem).where(WishlistItem.user_id == user.id)).all()]


class WishlistIn(BaseModel):
    product_ids: list[int]


@router.put("/me/wishlist")
def save_wishlist(payload: WishlistIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    existing = {w.product_id for w in db.scalars(select(WishlistItem).where(WishlistItem.user_id == user.id))}
    wanted = set(payload.product_ids)
    valid = set(db.scalars(select(Product.id).where(Product.id.in_(wanted), Product.active.is_(True))).all()) if wanted else set()
    for item_id in existing - valid:
        db.execute(delete(WishlistItem).where(WishlistItem.user_id == user.id, WishlistItem.product_id == item_id))
    for item_id in valid - existing:
        db.add(WishlistItem(user_id=user.id, product_id=item_id))
    db.commit()
    return sorted(valid)


@router.get("/me/cart")
def cart(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return [{"product_id": line.product_id, "quantity": line.quantity}
        for line in db.scalars(select(CartItem).where(CartItem.user_id == user.id)).all()] + [
        {"bundle_id": line.bundle_id, "quantity": line.quantity}
        for line in db.scalars(select(BundleCartItem).where(BundleCartItem.user_id == user.id)).all()]


class CartIn(BaseModel):
    items: list[dict]


@router.put("/me/cart")
def save_cart(payload: CartIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.execute(delete(CartItem).where(CartItem.user_id == user.id))
    db.execute(delete(BundleCartItem).where(BundleCartItem.user_id == user.id))
    deduped = {}
    for item in payload.items:
        try:
            quantity = int(item["quantity"])
            kind = "bundle" if item.get("bundle_id") else "product"
            item_id = int(item["bundle_id"] if kind == "bundle" else item["product_id"])
        except (KeyError, ValueError, TypeError):
            raise HTTPException(422, "Panier invalide.")
        if not 1 <= quantity <= 25: raise HTTPException(422, "Quantité invalide.")
        deduped[(kind, item_id)] = quantity
    product_ids = [item_id for kind, item_id in deduped if kind == "product"]
    bundle_ids = [item_id for kind, item_id in deduped if kind == "bundle"]
    valid_products = set(db.scalars(select(Product.id).where(Product.id.in_(product_ids), Product.active.is_(True))).all()) if product_ids else set()
    valid_bundles = set(db.scalars(select(Bundle.id).where(Bundle.id.in_(bundle_ids), Bundle.active.is_(True))).all()) if bundle_ids else set()
    for product_id in valid_products:
        db.add(CartItem(user_id=user.id, product_id=product_id, quantity=deduped[("product", product_id)]))
    for bundle_id in valid_bundles:
        db.add(BundleCartItem(user_id=user.id, bundle_id=bundle_id, quantity=deduped[("bundle", bundle_id)]))
    db.commit()
    return cart(user, db)
