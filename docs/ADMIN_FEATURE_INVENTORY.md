# Admin feature inventory — The K-Skin Gallery

> **Historical pre-V2 audit.** This inventory describes the interface before the Admin Experience V2 changes and is retained as a baseline only. For the current capabilities, architecture, limitations, and QA results, use [ADMIN_V2_ARCHITECTURE.md](ADMIN_V2_ARCHITECTURE.md), [ADMIN_DATA_GRID.md](ADMIN_DATA_GRID.md), and [ADMIN_V2_QA.md](ADMIN_V2_QA.md).

**Audit date:** 3 October 2026  
**Scope:** `http://localhost:5173/admin` and the admin API that powers it.  
**Method:** Playwright MCP browser inspection at desktop and mobile sizes, followed by read-only source/API review. The local app was started with `npm run dev:all`; the UI and API were available at ports 5173 and 8000.

## Audit scope and evidence

The browser had an authenticated admin session. The admin route is protected: an unauthenticated or non-admin user sees an access message and a link to sign in at `/connexion?next=...`. Admin endpoints also require an authenticated account with the `admin` role. The session is an HTTP-only `gallery_session` cookie; the backend uses a 14-day JWT session.

I navigated the pages, used read-only filters/search, opened a product and brand editor, and resized the browser. I did not save an admin form, advance/cancel an order, create records, or change inventory. I did observe successful background `PUT /api/me/cart` and `PUT /api/me/wishlist` requests: the shared storefront state provider merges the signed-in account’s saved cart/wishlist with browser local storage and persists the merged state automatically. I cannot tell from this audit whether those requests changed the stored values or merely rewrote the existing values. This is a real write side effect of opening the app while signed in.

Screenshots are stored in `../../docs/qa/admin-audit/`. The full-page screenshots are useful for seeing the long editors; screenshots are evidence from this local database and may include changing live data.

## What is in the admin

The sidebar has **23 admin destinations** in five groups, plus a link back to the shop:

| Group | Pages |
|---|---|
| Commerce | Dashboard, Orders |
| Catalogue | Products, Brands, Product types, Product subtypes, Skin types, Needs, Ingredients, Routines, Packs |
| Management | Stock, Promotions, Delivery, Customers, Reviews, Stock alerts |
| Content | Homepage, FAQ, Advice, Menus, Footer |
| Configuration | Settings |

These are React Router client-side routes. Clicking a sidebar link changes the URL and page content without a full document reload; this is expected for a single-page app. The route’s component then fetches its data from the API.

The visual system is cream/white with blush active states and serif page headings. Desktop uses a 225px left sidebar and a content area. On a 390px mobile viewport the sidebar becomes a horizontally scrollable strip; only a few links fit at once, so reaching later groups requires horizontal swiping. The page forms become single-column. Some form buttons still look like default browser controls rather than the branded rose buttons, so control styling is inconsistent.

## Current local data snapshot

These counts are from the local SQLite database and the rendered pages at audit time:

- **Products:** 323 total — 96 published and 227 drafts; no archived products.
- **Verification:** 250 partial, 69 unverified, 4 verified.
- **Zero-price products:** 227. These correspond to the draft catalog records in this local database.
- **Orders:** 4, all `À confirmer`; their combined order value is **1,550 DH** and delivered revenue is **0 DH**.
- **Brands:** 18. **Product types:** 11. **Product subtypes:** 14.
- **Routines:** 4 active. **Packs:** 1 (`Duo Double Nettoyage`, 2 components, 510 DH, available quantity 8).
- **Promotions, customer accounts, and stock alerts:** 0 each.
- **Notification outbox:** 4 rows in the database, but there is no corresponding screen in the admin sidebar.
- **Shipping cities:** 12 shown, all active in the rendered list.

The dashboard’s “Ruptures stock” and “Stock faible” totals count active, published products with a positive price. Because the zero-price products are drafts, their stock is not included in these two dashboard cards.

## Page-by-page interactions

### Dashboard — `/admin`

- Six clickable count cards: orders to confirm, confirmed, preparing, shipped, out of stock, and low stock. The order cards open Orders; stock cards open Stock.
- Two monetary summaries: total value of submitted orders and delivered revenue. A note states that only delivered orders count as realized revenue.
- The dashboard is read-only; its figures come from `GET /api/admin/overview`.

Evidence: [Dashboard screenshot](../../docs/qa/admin-audit/03-admin-dashboard.png)

### Orders — `/admin/commandes` and `/admin/commandes/:id`

**List interactions:** filter the table by any status; open an order by clicking its number or `Voir`; click the customer’s phone number to call it. The filter options are À confirmer, Appel en cours, Confirmée, Préparation, Expédiée, Livrée, Injoignable, Annulée, Refusée à la livraison, and Retournée.

**Order detail:** customer name, phone, email, address, district, city, region, optional address complement and delivery notes; line items, quantities, line totals, subtotal, discount, shipping and order total; status history and timestamps. The phone is a `tel:` link.

Available status actions depend on the current state:

| Current state | Actions offered |
|---|---|
| À confirmer | Appel en cours, Confirmée, Injoignable, Annulée |
| Appel en cours | Confirmée, Injoignable, Annulée |
| Injoignable | Appel en cours, Confirmée, Annulée |
| Confirmée | Préparation, Annulée |
| Préparation | Expédiée, Annulée |
| Expédiée | Livrée, Refusée à la livraison, Retournée |
| Livrée | Retournée |
| Annulée, Refusée, Retournée | No further transitions |

Changing status sends `POST /api/admin/orders/{id}/status` and adds a history entry. The UI asks for confirmation before cancellation; the backend releases that order’s unreleased inventory reservations. The UI does not offer an order edit/delete action or a field to enter a status note, even though the API accepts a note.

Evidence: [Orders list](../../docs/qa/admin-audit/04-orders-list.png), [filtered empty state](../../docs/qa/admin-audit/05-orders-empty-filter.png), [order detail](../../docs/qa/admin-audit/06-order-detail.png)

### Products and Stock — `/admin/catalogue/produits`, `/admin/catalogue/produits/:id`, `/admin/stock`

The Stock page is the same product management table with a different title; it is not a separate inventory ledger.

**List interactions:** debounced search by product name, official name, SKU, or brand; filters for verification (`Vérifié`, `Partiel`, `À vérifier`, `Non vérifié`), publication (`Publié`, `Brouillon`, `Archivé`), and inventory (`En stock`, `Stock faible`, `Rupture`); 24 results per page with previous/next navigation. Each row shows product/brand/SKU, verification state, stock state/quantity, publication state, a selection checkbox, and `Modifier`.

**Bulk interactions:** select all products on the current page or individual rows, then apply one operation: publication state, featured on/off, low-stock threshold, or product type. The UI clears selection when results are fetched again. Bulk publication is subject to the publication checks described below.

**Product editor:**

- Identity: official product name, French display name, barcode, size text/value/unit, product type and subtype.
- Commercial/internal data: public MAD price, compare-at price, admin-only cost and wholesale price.
- Inventory/publication: stock, low-stock threshold, draft/published/archived state, verification state, featured flag, new-arrival metadata.
- Classification: skin types, needs, ingredients; classification-verified flag; use time (morning/evening/both); routine step; novelty end date; search aliases.
- Product copy: French short description, full description, benefits, French directions and warnings.
- Manufacturer/source data: manufacturer description/benefits, directions, INCI, source language, official source name and URL; a `Vérifier aujourd’hui` checkbox.
- SEO/media: SEO title and description, local image path, and a display of existing product images.
- One `Enregistrer` action saves with `PATCH /api/admin/products/{id}`. There is no product-create form, image-upload control, or delete action in this admin.

The API enforces non-negative prices/stock and positive size values. A published product must have a price greater than zero. For a research-import product, moving from draft to published also requires approved local media, a short description plus a full or manufacturer description, and resolution of a possible-duplicate hold. Marking a product verified requires an official source URL and source name. Remote image URLs are rejected in favor of local media paths.

Evidence: [Products table](../../docs/qa/admin-audit/07-products-list.png), [product editor](../../docs/qa/admin-audit/08-product-editor-zero-draft.png)

### Catalogue dictionaries — `/admin/catalogue/marques`, `/types-de-soin`, `/sous-types-de-soin`, `/types-de-peau`, `/besoins`, `/ingredients`

Each dictionary page shows a table of name, slug/address, active-product count, and `Modifier`, plus an inline form and `Ajouter` button. Forms save through `POST /api/admin/taxonomy/{kind}` or `PATCH /api/admin/taxonomy/{kind}/{id}`. Duplicate names/slugs are rejected. There is no delete action.

- All dictionaries expose name and slug; the slug is constrained to lower-case letters/numbers separated by single hyphens.
- Skin types, needs, and brands also expose a French description and active checkbox.
- Brands additionally expose logo path/URL, official website, homepage order, SEO title/description, and a homepage-featured checkbox.
- Product subtypes expose a required parent product type.
- The product editor uses these records as its classification options.
- The UI does not expose active toggles for product types, subtypes, or ingredients, even though the backend model may carry active state.

The page labels explain that entries organize the catalog and that products are associated from their own verified product records. Brand list evidence: [Brands admin](../../docs/qa/admin-audit/09-brands-admin.png).

### Routines — `/admin/catalogue/routines`

The list shows routine name, number of steps, active/inactive state, and `Modifier`. The inline create/edit form includes name, slug, description and active state. Each ordered step has a name, explanatory text, optional product type, and a multi-select of active products. `Ajouter une étape` and `Retirer l’étape` change the unsaved form; at least one step remains. `Créer une routine` resets the form. Save creates or replaces a routine via POST/PUT. There is no delete action. Four active routines were present.

Evidence: [Routines admin](../../docs/qa/admin-audit/10-routines.png)

### Packs — `/admin/catalogue/packs`

The list shows pack name, number of components, price, computed availability and `Modifier`. The form covers name/slug, price, compare-at price, description, image URL, active state, and product components with quantities. It starts with two components; you can add more, but the UI will not remove below two. Availability is calculated from component stock. The API enforces at least two distinct active products and quantity 1–25. Save creates/updates a pack; there is no delete action. One existing pack was listed.

Evidence: [Packs admin](../../docs/qa/admin-audit/10-packs.png)

### Promotions — `/admin/promotions`

The current list is empty. The create form has name, optional code (blank means automatic), type (percentage, fixed amount, free shipping), amount, minimum cart total, and active checkbox. Percentage values are limited to 100% by the backend’s `amount <= 100` validation; amounts and minimum must be non-negative. Duplicate codes are rejected. The UI/API only create promotions; there is no edit, deactivate, or delete action once created, and no date range or product-specific targeting control.

Evidence: [Promotions admin](../../docs/qa/admin-audit/14-promotions.png)

### Delivery — `/admin/livraison`

The list shows city, region, delivery price, active state, and `Modifier`. Editing a row locally exposes a non-negative shipping price, active checkbox, and `Enregistrer`; save sends `PATCH /api/admin/cities/{id}`. The backend recalculates delivery price from the selected city when a new order is placed. The API supports a delivery-window field, but the UI does not expose it. The admin cannot add/remove cities. The 12 current city fees are Agadir 40 DH; Casablanca 25; El Jadida 35; Fès 35; Kénitra 35; Marrakech 35; Meknès 35; Oujda 45; Rabat 30; Salé 30; Tanger 40; Tétouan 45. All were active in the captured list.

Evidence: [Delivery admin](../../docs/qa/admin-audit/11-shipping.png)

### Customers, Reviews, Stock alerts — `/admin/clients`, `/admin/avis`, `/admin/alertes-stock`

- **Customers:** read-only table with name, email, phone, and order count. No customer accounts existed during this audit. There is no customer edit, detail, or order drill-down action in this screen.
- **Reviews:** intentionally disabled in the UI with the message that public reviews require a delivered order and moderation. No review API route is present in the admin router.
- **Stock alerts:** read-only table of product ID, email, and date; empty at audit time. The API returns these records, but the page has no moderation, delete, or notification action.
- **Notification outbox:** `GET /api/admin/notification-outbox` exists and returns order ID, attempts, sent time and last error, but no sidebar page renders it.

### Content — `/admin/contenu/*`

All content forms are structured editors saved with `PUT /api/admin/content/{key}` and validated against backend schemas. The helper text says link destinations should be valid site pages.

- **Homepage:** hero eyebrow/title/intro/button label/destination; Gallery section title; three entry cards (title, description, action, path); multi-selects for featured products, brands and routines; campaign title/button/path; four trust messages. There is no content preview.
- **FAQ:** edit question/answer pairs, add/remove a pair locally, then save. Three entries existed.
- **Menus:** choose one featured brand or none.
- **Footer:** edit introduction and closing line.
- **Advice:** create/edit an article with title, slug, excerpt, body and published checkbox. The page says published articles appear at `/conseils`. The list was empty. There is no delete action.

Evidence: [Homepage editor](../../docs/qa/admin-audit/13-homepage.png), [FAQ editor](../../docs/qa/admin-audit/13-faq.png), [Advice admin](../../docs/qa/admin-audit/13-advice.png), [Menus editor](../../docs/qa/admin-audit/13-menus.png), [Footer editor](../../docs/qa/admin-audit/13-footer.png)

### Settings — `/admin/parametres`

One save form controls free-shipping threshold, WhatsApp number, support phone, Instagram URL, and TikTok URL. Current free-shipping threshold is 500 DH; the other values rendered blank. The backend accepts these five keys and silently ignores other keys. Inputs are text fields, so the UI does not provide type-specific URL/phone validation.

Evidence: [Settings at mobile width](../../docs/qa/admin-audit/12-mobile-settings.png)

## Backend/API map

All `/api/admin/*` routes are behind the `admin_user` dependency. They are database-backed FastAPI endpoints using SQLAlchemy. The frontend uses same-origin `/api` requests and displays API errors/loading states in the relevant screens.

| Capability | Admin endpoints | Write behavior |
|---|---|---|
| Dashboard | `GET /overview` | None |
| Orders | `GET /orders`, `GET /orders/{id}`, `POST /orders/{id}/status` | Status transition + history; cancellation releases stock reservations |
| Products | `GET /products`, `GET /products/{id}`, `PATCH /products/{id}`, `POST /products/bulk` | Edit existing products or bulk-update selected fields |
| Taxonomy | `GET/POST /taxonomy/{kind}`, `PATCH /taxonomy/{kind}/{id}` | Create/update; no delete endpoint |
| Routines | `GET/POST /routines`, `PUT /routines/{id}` | Create/update; no delete endpoint |
| Packs | `GET/POST /bundles`, `PUT /bundles/{id}` | Create/update; no delete endpoint |
| Shipping | `GET /cities`, `PATCH /cities/{id}` | Update a city’s fee/active state |
| Promotions | `GET/POST /promotions` | Create only |
| Settings | `GET/PUT /settings` | Update supported site-setting keys |
| Content | `GET/PUT /content/{key}` | Replace validated content section |
| Advice | `GET/POST /articles`, `PUT /articles/{id}` | Create/update; no delete endpoint |
| Customer/alert/notification data | `GET /customers`, `GET /stock-alerts`, `GET /notification-outbox` | Read only; outbox has no UI page |

No DELETE route is exposed by the admin API. Admin user creation/role management is not available in this UI. General storefront/account endpoints also exist, but this report is limited to the `/admin` experience.

## Interaction walkthrough and health

1. Opened `/admin`; confirmed the protected admin interface and active admin session.
2. Navigated every sidebar destination and inspected each visible list/form.
3. Applied the order status filter and verified its empty state, then used product search/status filters and opened product/brand editors without saving.
4. Captured representative order, product, taxonomy, routine, pack, delivery, promotion, editorial, and settings views.
5. Resized to 390×844 and inspected the responsive admin shell.
6. Reviewed browser network traffic and local source/API handlers. Captured browser console had **zero errors**; the observed page data requests returned successfully.

**Overall health: functional foundation, partial back office.** Dashboard, order status handling, product maintenance, stock filtering, taxonomy, delivery fees, routines/packs, and structured content are connected to the backend. Important operational gaps are product creation, customer management, review moderation, promotion editing/deactivation, deletes, city maintenance, and a notification-outbox screen. The biggest audit finding is the automatic signed-in cart/wishlist persistence on admin load; it is separate from admin actions and should be understood before using this route for strictly read-only review. Mobile content is usable but the navigation relies on horizontal scrolling, while some buttons do not match the brand styling.

