# Admin Experience V2 — Architecture

**Implementation date:** 2026-10-03  
**Application:** React Router 7 frontend + FastAPI/SQLAlchemy backend

## Runtime boundary

`/admin` is handled by a separate entry branch in `src/App.jsx`. The admin module is lazy-loaded and does not mount the storefront `StoreProvider`. That prevents admin page visits from hydrating or persisting the storefront cart and wishlist. The existing storefront still mounts its provider for storefront routes.

`AdminEntry` checks the signed-in user with `GET /api/auth/me`. Admin API routes are protected by the backend admin dependency. The shell owns navigation, viewport sizing, responsive navigation, and page title; individual route components own their data and forms. The shared React Query client is scoped to the admin entry.

## UI and state layers

| Layer | Implementation |
|---|---|
| Application routing | Existing React Router; direct URLs and browser navigation remain available |
| Admin shell | `src/admin/AdminShell.jsx`; fixed-height desktop shell, collapsible sidebar, Ctrl/Cmd+B shortcut, tooltips, mobile Radix Dialog sheet |
| Shared list surfaces | `src/admin/AdminDataViews.jsx`; TanStack Query v5 and TanStack Table v8 for Products, Stock, and Orders |
| Product creation | `src/admin/AdminCreateProduct.jsx`; server-created unpublished draft, price defaults to 0 |
| Existing admin modules | `src/pages/Admin.jsx`; order/customer detail, taxonomy, routines/packs, delivery, promotions, content, settings, alerts and outbox |
| Styling | `src/admin/admin-v2.css` with existing Gallery fonts and colors; no Tailwind/shadcn runtime |
| API client | Existing `src/lib/api.js`, same-origin `/api` requests and existing session cookie |

The user-supplied `p.distribution` component directory was inspected as a design/architecture reference. It is not imported at runtime; its Next.js routes, store assumptions, and server action behavior do not match this application.

## Data and API boundary

The admin uses the existing FastAPI services and SQLAlchemy models. Product and order data are read in server-filtered cursor batches. The server determines totals, filters, cursor position, and bulk matching. Product image uploads pass through a server-side size/type check and the existing configured local/S3 media store. Catalog/publication blockers remain enforced by the backend.

No Admin V2-specific database migration was needed. The existing local database was kept in place; the pre-V2 preservation baseline and post-implementation read-only counts are in [ADMIN_V2_QA.md](ADMIN_V2_QA.md). Existing COD order creation, reservation, and checkout services were not changed for this task.

## Request and write ownership

| Feature | Read API | Write API |
|---|---|---|
| Dashboard | `GET /api/admin/overview` | — |
| Products / stock | `GET /api/admin/products` | `POST /api/admin/products`, `PATCH /api/admin/products/{id}`, `POST /api/admin/products/bulk`, `POST /api/admin/products/{id}/images` |
| Orders | `GET /api/admin/orders`, `GET /api/admin/orders/{id}` | `POST /api/admin/orders/{id}/status` with required note |
| Taxonomy | `GET /api/admin/taxonomy/{kind}` | `POST` / `PATCH` on taxonomy; no hard-delete route |
| Routines / packs | `GET /api/admin/routines`, `/bundles` | `POST` and `PUT` for their existing records |
| City delivery | `GET /api/admin/cities` | `POST` and `PATCH /api/admin/cities` |
| Promotions | `GET /api/admin/promotions` | `POST` / `PATCH` for model-supported fields |
| Customers / alerts / outbox | `GET /api/admin/customers`, `/stock-alerts`, `/notification-outbox` | Customer and alert pages are read-only; no unsupported retry control |
| Content / settings | `GET` / `PUT /api/admin/content/{key}`, `/settings` | Validated section replacement or supported setting updates |

## Capabilities and boundaries

- Order status transitions keep the existing COD flow and write a note to the status history. The UI has no bulk order confirmation.
- Product bulk selection and operations are defined in [ADMIN_SELECTION_MODEL.md](ADMIN_SELECTION_MODEL.md).
- Stock is current available quantity. The model does not expose a stock movement ledger or reserved-quantity projection to this workspace.
- Promotions expose only fields in the current model: name, code, kind, amount, minimum cart amount, and active state. There are no scheduled dates or product targeting fields.
- Customers show order snapshots. There is no saved default-address entity on the customer account.
- Reviews remain explicitly disabled until an authorized moderation model and API exist. The outbox is view-only because retry semantics are not exposed.
- Active-state editing is shown for brands, skin types, concerns, and subtypes where the model supports it. Product types and ingredients have no active field today; their entries are retained and cannot be deactivated or deleted from this UI.

