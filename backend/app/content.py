"""Typed editorial sections; layout remains fixed in the storefront."""

from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session
from .models import ContentSection


class EntryCard(BaseModel):
    title: str = Field(min_length=2, max_length=90)
    description: str = Field(max_length=160)
    action: str = Field(min_length=2, max_length=70)
    path: str

    @field_validator("path")
    @classmethod
    def local_path(cls, value: str):
        if not value.startswith("/") or value.startswith("//"):
            raise ValueError("Le lien doit être une adresse interne.")
        return value


class HomeSection(BaseModel):
    hero_eyebrow: str = Field(max_length=120)
    hero_title: str = Field(min_length=5, max_length=140)
    hero_intro: str = Field(max_length=250)
    hero_cta_label: str = Field(min_length=2, max_length=80)
    hero_cta_path: str
    entry_title: str = Field(min_length=2, max_length=100)
    entry_cards: list[EntryCard] = Field(min_length=3, max_length=3)
    featured_product_ids: list[int] = []
    featured_brand_slugs: list[str] = []
    featured_routine_slugs: list[str] = []
    promotion_title: str = Field(max_length=140)
    promotion_cta_label: str = Field(max_length=80)
    promotion_cta_path: str
    trust_messages: list[str] = Field(min_length=3, max_length=4)

    @field_validator("hero_cta_path", "promotion_cta_path")
    @classmethod
    def local_path(cls, value: str):
        if not value.startswith("/") or value.startswith("//"):
            raise ValueError("Le lien doit être une adresse interne.")
        return value


class FAQItem(BaseModel):
    question: str = Field(min_length=5, max_length=180)
    answer: str = Field(min_length=5, max_length=900)


class FAQSection(BaseModel):
    items: list[FAQItem]


class MenuSection(BaseModel):
    featured_brand_slug: str = ""


class FooterSection(BaseModel):
    introduction: str = Field(max_length=180)
    closing_line: str = Field(max_length=180)


SCHEMAS = {"homepage": HomeSection, "faq": FAQSection, "menus": MenuSection, "footer": FooterSection}
CONTENT_DEFAULTS = {
    "homepage": HomeSection(hero_eyebrow="Beauté coréenne · sélectionnée pour le Maroc",
        hero_title="Vos essentiels\nK-Beauty, réunis\nau Maroc.",
        hero_intro="Des marques coréennes authentiques pour une peau éclatante, au quotidien.",
        hero_cta_label="Explorer la sélection", hero_cta_path="/boutique",
        entry_title="Entrez dans la Gallery", entry_cards=[
            EntryCard(title="Je cherche un soin", description="Nettoyants, sérums, crèmes, SPF…", action="Explorer les soins", path="/soins"),
            EntryCard(title="Je pars de ma peau", description="Type de peau et besoins", action="Trouver mes soins", path="/peau"),
            EntryCard(title="Je connais ma marque", description="ANUA, COSRX, SKIN1004…", action="Voir les marques", path="/marques"),
        ], featured_product_ids=[6, 10, 13, 53, 71],
        featured_brand_slugs=["anua", "cosrx", "beauty-of-joseon", "skin1004", "medicube"],
        featured_routine_slugs=["simple", "matin", "soir"],
        promotion_title="",
        promotion_cta_label="Voir les promotions", promotion_cta_path="/promotions",
        trust_messages=["Produits authentiques", "Livraison partout au Maroc", "Paiement à la livraison", "Assistance 7j/7"]),
    "faq": FAQSection(items=[
        FAQItem(question="Comment payer ?", answer="Le règlement se fait à la livraison. Aucune carte bancaire n’est demandée sur le site."),
        FAQItem(question="Comment connaître les frais de livraison ?", answer="Choisissez votre ville sur la page de commande pour voir le tarif exact avant de commander."),
        FAQItem(question="Quand la commande est-elle confirmée ?", answer="Après l’enregistrement, notre équipe vous appelle pour confirmer les informations avant préparation."),
    ]),
    "menus": MenuSection(),
    "footer": FooterSection(introduction="Une sélection coréenne, tout près de vous.",
        closing_line="Paiement à la livraison · Livraison au Maroc · Produits authentiques"),
}


def content_public(db: Session) -> dict:
    rows = {row.key: row for row in db.scalars(select(ContentSection)).all()}
    return {
        key: SCHEMAS[key].model_validate_json(rows[key].payload_json).model_dump()
        if key in rows else default.model_dump()
        for key, default in CONTENT_DEFAULTS.items()
    }


def seed_content(db: Session):
    for key, value in CONTENT_DEFAULTS.items():
        if not db.get(ContentSection, key):
            db.add(ContentSection(key=key, payload_json=value.model_dump_json()))
