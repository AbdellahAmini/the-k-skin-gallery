import re
import secrets
import json
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import InventoryReservation, NotificationOutbox, Order, OrderBundleItem, OrderItem, OrderStatusHistory, Product, StockAlert
from ..security import current_user_optional
from ..models import User
from ..services import bundle_public, calculate_quote, normalize_phone, product_public


router = APIRouter(prefix="/api")


class LineIn(BaseModel):
    product_id: int | None = Field(None, gt=0)
    bundle_id: int | None = Field(None, gt=0)
    quantity: int = Field(ge=1, le=25)


class QuoteIn(BaseModel):
    items: list[LineIn]
    city_id: int | None = None
    promotion_code: str = ""


class OrderIn(QuoteIn):
    first_name: str = Field(min_length=2, max_length=100)
    last_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=10, max_length=30)
    email: str = ""
    address: str = Field(min_length=6, max_length=500)
    district: str = Field(min_length=2, max_length=200)
    complement: str = ""
    delivery_notes: str = ""
    client_request_id: str = Field(min_length=8, max_length=80)


def quote_public(quote: dict) -> dict:
    return {"items": [{"kind": line["kind"],
                "product": product_public(line["product"]) if line["kind"] == "product" else None,
                "bundle": bundle_public(line["bundle"]) if line["kind"] == "bundle" else None,
                "quantity": line["quantity"], "line_total_dh": line["line_total_dh"]}
            for line in quote["lines"]],
        "subtotal_dh": quote["subtotal_dh"], "discount_dh": quote["discount_dh"],
        "shipping_dh": quote["shipping_dh"], "total_dh": quote["total_dh"],
        "city": quote["city"].name if quote["city"] else None,
        "promotion": quote["promotion"].name if quote["promotion"] else None,
        "free_shipping_threshold_dh": quote["free_shipping_threshold_dh"]}


def order_public(order: Order) -> dict:
    return {"id": order.id, "number": order.number, "public_token": order.public_token, "status": order.status,
        "first_name": order.first_name, "last_name": order.last_name, "phone": order.phone,
        "city": order.city, "region": order.region, "address": order.address,
        "subtotal_dh": order.subtotal_dh, "discount_dh": order.discount_dh,
        "shipping_dh": order.shipping_dh, "total_dh": order.total_dh,
        "created_at": order.created_at,
        "items": [{"name": item.name, "brand": item.brand, "image_url": item.image_url,
                   "quantity": item.quantity, "unit_price_dh": item.unit_price_dh,
                   "line_total_dh": item.line_total_dh, "kind": "product"} for item in order.items]
            + [{"name": item.name, "brand": "Pack", "image_url": item.image_url,
                "quantity": item.quantity, "unit_price_dh": item.unit_price_dh,
                "line_total_dh": item.line_total_dh, "kind": "bundle",
                "components": json.loads(item.components_json)} for item in order.bundle_items]}


@router.post("/quote")
@router.post("/v1/cart/validate")
def quote(payload: QuoteIn, db: Session = Depends(get_db)):
    return quote_public(calculate_quote(db, payload.items, payload.city_id, payload.promotion_code))


@router.post("/orders", status_code=201)
@router.post("/v1/checkout", status_code=201)
def create_order(payload: OrderIn, response: Response, db: Session = Depends(get_db), user: User | None = Depends(current_user_optional)):
    if payload.city_id is None:
        raise HTTPException(422, "Choisissez votre ville de livraison.")
    if payload.email and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", payload.email):
        raise HTTPException(422, "Saisissez une adresse e-mail valide.")
    phone = normalize_phone(payload.phone)
    existing = db.scalar(select(Order).where(Order.client_request_id == payload.client_request_id))
    if existing:
        if existing.phone != phone:
            raise HTTPException(409, "Cette demande de commande a déjà été utilisée.")
        response.status_code = 200
        return order_public(existing)
    try:
        calculated = calculate_quote(db, payload.items, payload.city_id, payload.promotion_code, lock=True)
        order = Order(public_token=secrets.token_urlsafe(24), client_request_id=payload.client_request_id,
            number=f"KG-{secrets.token_hex(4).upper()}", user_id=user.id if user else None,
            first_name=payload.first_name.strip(), last_name=payload.last_name.strip(), phone=phone,
            email=payload.email.strip(), city=calculated["city"].name, region=calculated["city"].region,
            address=payload.address.strip(), district=payload.district.strip(), complement=payload.complement.strip(),
            delivery_notes=payload.delivery_notes.strip(), status="a_confirmer",
            subtotal_dh=calculated["subtotal_dh"], discount_dh=calculated["discount_dh"],
            shipping_dh=calculated["shipping_dh"], total_dh=calculated["total_dh"],
            promotion_code=payload.promotion_code.strip().upper())
        db.add(order)
        db.flush()
        for line in calculated["lines"]:
            if line["kind"] == "product":
                product = line["product"]
                db.add(OrderItem(order_id=order.id, product_id=product.id, sku=product.sku,
                    name=product.name, brand=product.brand.name, image_url=product.image_url,
                    quantity=line["quantity"], unit_price_dh=line["unit_price_dh"],
                    line_total_dh=line["line_total_dh"]))
            else:
                bundle = line["bundle"]
                db.add(OrderBundleItem(order_id=order.id, bundle_id=bundle.id,
                    name=bundle.name, image_url=bundle.image_url, quantity=line["quantity"],
                    unit_price_dh=line["unit_price_dh"], line_total_dh=line["line_total_dh"],
                    components_json=json.dumps([{"sku": item.product.sku, "name": item.product.name,
                        "quantity": item.quantity} for item in bundle.items])))
        for product_id, quantity in calculated["needed"].items():
            calculated["products"][product_id].stock -= quantity
            db.add(InventoryReservation(order_id=order.id, product_id=product_id, quantity=quantity))
        db.add(OrderStatusHistory(order_id=order.id, status="a_confirmer", note="Commande déposée"))
        db.add(NotificationOutbox(order_id=order.id))
        db.commit()
        db.refresh(order)
        return order_public(order)
    except Exception:
        db.rollback()
        raise


@router.get("/orders/receipt/{token}")
def receipt(token: str, db: Session = Depends(get_db)):
    order = db.scalar(select(Order).options(joinedload(Order.items)).where(Order.public_token == token))
    if not order:
        raise HTTPException(404, "Cette commande est introuvable.")
    return order_public(order)


class StockAlertIn(BaseModel):
    product_id: int
    email: str


@router.post("/stock-alerts", status_code=201)
def stock_alert(payload: StockAlertIn, db: Session = Depends(get_db)):
    product = db.get(Product, payload.product_id)
    if not product or not product.active: raise HTTPException(404, "Produit introuvable.")
    if product.stock > 0: raise HTTPException(409, "Ce produit est actuellement disponible.")
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", payload.email):
        raise HTTPException(422, "Saisissez une adresse e-mail valide.")
    existing = db.scalar(select(StockAlert).where(StockAlert.product_id == product.id,
        StockAlert.email == payload.email.lower()))
    if not existing:
        db.add(StockAlert(product_id=product.id, email=payload.email.lower()))
        db.commit()
    return {"message": "Alerte enregistrée."}
