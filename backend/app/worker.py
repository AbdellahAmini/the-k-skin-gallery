import os
import time
import httpx
from sqlalchemy import select
from .database import SessionLocal
from .models import NotificationOutbox, Order


def message(order: Order) -> str:
    lines = "\n".join(f"• {i.quantity} × {i.brand} {i.name} — {i.line_total_dh} DH" for i in order.items)
    admin_url = os.getenv("ADMIN_PUBLIC_URL", "http://localhost:5173/admin/commandes")
    return (f"Nouvelle commande #{order.number}\n"
        f"Client: {order.first_name} {order.last_name}\nTéléphone: {order.phone}\nVille: {order.city}\n\n"
        f"{lines}\n\nSous-total: {order.subtotal_dh} DH\nLivraison: {order.shipping_dh} DH\n"
        f"Total: {order.total_dh} DH\nPaiement: À la livraison\nStatut: À confirmer\n"
        f"{admin_url}/{order.id}")


def process_once() -> int:
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        return 0
    sent = 0
    with SessionLocal() as db:
        jobs = db.scalars(select(NotificationOutbox).where(NotificationOutbox.sent_at.is_(None),
            NotificationOutbox.attempts < 10).order_by(NotificationOutbox.id).limit(20)).all()
        for job in jobs:
            order = db.get(Order, job.order_id)
            try:
                response = httpx.post(f"https://api.telegram.org/bot{token}/sendMessage",
                    json={"chat_id": chat_id, "text": message(order)}, timeout=10)
                response.raise_for_status()
                from .models import now
                job.sent_at = now()
                job.last_error = ""
                sent += 1
            except Exception as exc:
                job.attempts += 1
                job.last_error = str(exc)[:500]
            db.commit()
    return sent


if __name__ == "__main__":
    while True:
        process_once()
        time.sleep(15)
