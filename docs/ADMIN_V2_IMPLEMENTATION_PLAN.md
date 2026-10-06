# Admin Experience V2 — Implementation Plan

**Prepared:** 2026-10-03  
**Implementation target:** `the-k-skin-gallery` (React Router + FastAPI). The folder at `C:\Users\Lenov\Downloads\fix-merge\p.distribution\frontend\src\components` is interaction/architecture reference material only; its Next.js routes, stores, document rules and file-processing flows will not be imported.

## Baseline record counts (before any V2 schema migration)

Read directly from `backend/gallery.db` before changes:

| Record set | Count |
|---|---:|
| Products | 323 |
| Published products | 96 |
| Draft products | 227 |
| Brands | 18 |
| Orders | 4 |
| Customer accounts | 0 |
| Stock alerts | 0 |
| Promotions | 0 |
| Shipping cities | 12 |

These values are a preservation baseline. Do not reset, reseed, or bulk-transform the database. Any schema work must use additive Alembic migrations and keep order snapshots immutable.

## KEEP

- The current React Router and FastAPI architecture, same-origin `/api` client, and the COD checkout/order workflow.
- The Gallery identity: warm ivory/neutral surfaces, restrained blush active state, muted rose accent, editorial serif headings; shadcn primitives are the interaction layer, not a visual reskin.
- Existing admin business rules, product verification/publication guards, inventory reservation logic, and historical order snapshots.
- Public storefront routes and their SEO-oriented pagination behavior.
- Domain-safe retention: archive or deactivate records where appropriate; never delete orders or products with order history.
- Brand-specific storefront composition (hero, marquee, cards, editorial sections, mega menus).
- Interaction patterns from the supplied reference folder: fixed app shell, independent scrolling, accessible controls, table column visibility, and explicit/all-matching selection. Do not copy reference business logic or imports.

## REFACTOR

- Split the app entry so `/admin/*` mounts an admin auth/query/UI provider stack only; it must not mount `StoreProvider` or trigger cart/wishlist reads/writes. Storefront routes retain their existing provider behavior.
- Replace the document-scrolling admin layout and horizontal mobile navigation with a fixed-height shell, fixed/collapsible desktop sidebar, independently scrollable nav/page regions, sticky topbar, and mobile Sheet navigation.
- Consolidate admin lists into a small shared data-view architecture: toolbar, active filter chips, sort, column visibility, fixed table surface, loading/error/empty states, row actions, and bulk action bar.
- Move admin lists from page-number requests to opaque cursor batches of at most 30, retaining old API pagination for compatibility and leaving storefront pagination intact.
- Rework Products, Stock, Orders, taxonomy, customers, alerts, promotions and notifications onto the shared list architecture. Preserve domain-specific columns and actions rather than forcing one generic grid.
- Reorganize the product editor into task-sized sections with a sticky save/return bar, visible dirty state, and precise publication-validation messages.
- Migrate shared form, table, navigation, dialog, sheet, status, and toast controls to a Gallery-themed shadcn foundation. Keep specialized visual components custom.
- Update the homepage/FAQ/advice/menu/footer/settings editors to the shared form controls and clearer section structure.
- Preserve query/filter/sort in the URL where practical and restore list scroll/query when returning from product/order details.

## REMOVE

- Admin-only page number / previous / next controls and page-sized selection semantics.
- The mobile horizontally scrolling admin nav strip.
- Permanently visible inline taxonomy forms; use an accessible dialog or Sheet editor.
- Product/routine/pack forms that download the full 323-product catalog for a native select.
- Product bulk selection implemented as IDs from only the loaded page.
- Any admin-wide mounting of storefront state that synchronizes cart/wishlist data.
- Duplicate controls/styles only after their replacements are integrated and verified.
- Hard-delete paths for orders, referenced taxonomies, products with history, promotions, routines, packs, articles, and delivery cities.

## ADD

- Cursor-paginated admin list endpoints with deterministic ordering, query/filter-aware totals, and a maximum batch size of 30.
- Server-reapplied all-matching selection (query + filters + excluded IDs), explicit-ID selection for small manual selections, query-scope reset behavior, row-level bulk result details, and safe operation validation.
- Fixed internal data surfaces, sticky headers, root-bound near-end loading sentinel, initial and next-batch skeletons, and `loaded / total` status.
- Product search across display/official name, brand, SKU and barcode; useful brand/type/skin/need and readiness filters; sort/column visibility; archive; create route; compliant local media upload and multi-image management.
- A real Stock view with quick adjustment and available/reserved values only if the current model supports them (no invented history).
- Order search/status/city/date/sort and status notes; never bulk-confirm COD orders.
- Consistent active/deactivate controls for taxonomy and other domain entities, with usage counts and reference-safe handling.
- Remote product search for routine/pack component selection.
- Promotion edit/activate/deactivate, effective dates, supported value types and targeted scopes, without unsafe delete.
- Delivery windows and safe city creation only if the model and validation support them.
- Customer detail based on existing account/order data; explicit review feature-flag state; searchable stock alert view; notification outbox view and only a safe retry operation if backend state semantics support it.
- Homepage content preview and type-specific settings validation.
- The five implementation documents and a Playwright QA record required by the brief.

## Current admin route map

| Existing route | Current purpose | V2 disposition |
|---|---|---|
| `/admin` | Dashboard metrics | Keep metrics; restyle and add compact operational queues |
| `/admin/commandes` | Orders list | Shared fixed/infinite data view; search, status/city/date filters, sort |
| `/admin/commandes/:id` | Order detail/status actions | Keep details; sticky actions and status note; preserve COD transition safety |
| `/admin/catalogue/produits` | Product table | Primary shared data view, filters/sort/columns/global selection/infinite load |
| `/admin/catalogue/produits/:id` | Product editor | Sectioned editor, sticky save bar and return-state restoration |
| `/admin/catalogue/produits/nouveau` | Not implemented | Add create flow using the same product schema/guards |
| `/admin/catalogue/marques` | Brand dictionary | Shared data view and Sheet editor; safe deactivate; logo media |
| `/admin/catalogue/types-de-soin` | Product type dictionary | Shared data view and reference-safe editor |
| `/admin/catalogue/sous-types-de-soin` | Product subtype dictionary | Shared data view and parent-type editor |
| `/admin/catalogue/types-de-peau` | Skin type dictionary | Shared data view and safe active state |
| `/admin/catalogue/besoins` | Concern dictionary | Shared data view and safe active state |
| `/admin/catalogue/ingredients` | Ingredient dictionary | Shared data view and safe active state |
| `/admin/catalogue/routines` | Routine list/editor | Shared data view; lazy searchable step-product selection |
| `/admin/catalogue/packs` | Pack list/editor | Shared data view; lazy component-product search |
| `/admin/stock` | Product table alias | Dedicated stock workspace and safe quick adjustment |
| `/admin/promotions` | Promotion creation | Full lifecycle management with effective dates and supported targeting |
| `/admin/livraison` | City fee editor | Searchable data view with delivery window and safe city lifecycle |
| `/admin/clients` | Read-only customer list | Customer data view and focused detail |
| `/admin/avis` | Reviews disabled message | Keep disabled state explicit; no public reviews enabled |
| `/admin/alertes-stock` | Read-only alert list | Search/filter and stock/notification state where available |
| `/admin/notifications` | Not implemented; outbox API exists | Add notification outbox view and safe retry only if supported |
| `/admin/contenu/homepage` | Homepage content form | Shared controls, hierarchy and preview |
| `/admin/contenu/faq` | FAQ editor | Shared controls and clearer list/editor states |
| `/admin/contenu/conseils` | Advice article list/editor | Shared data view and draft/published/unpublish lifecycle |
| `/admin/contenu/menus` | Featured brand setting | Shared settings control |
| `/admin/contenu/footer` | Footer text editor | Shared controls |
| `/admin/parametres` | Store contact/free-shipping settings | Typed validation and clear errors |

## Implementation sequence

1. Keep this baseline and plan; inspect backend entities and migration setup; fix provider isolation first.
2. Add the themed shared UI primitives and admin shell; verify desktop scrolling, collapse persistence/shortcut, and mobile Sheet.
3. Add cursor query support and safe global selection at the API layer; retain old page parameters for compatibility.
4. Build the reusable data-view foundation, then migrate Products and Orders first; add the purpose-built Stock view.
5. Migrate taxonomy, routines/packs, customers/alerts/notifications, promotions/delivery, content/settings, and dashboard.
6. Migrate the existing storefront interaction primitives without changing its visual composition or COD flow.
7. Run the brief’s Playwright and network scenarios, check data counts again, and document verified work and gaps without masking untested areas.

## Known constraints to verify before implementation

- Cursor and bulk-all operations must be computed against current server-side predicates; never trust client counts or downloaded ID lists.
- Current API fields must be checked before adding dates, stock reservation detail, promotion targeting, user/customer address projections, media routes, or notification retries. Add migrations only where the domain model supports a safe change.
- No destructive production operation or order/customer data rewrite is authorized by this brief.

## Completion record — 2026-10-03

The plan is implemented against the current FastAPI/React Router project. The final state and remaining scope are recorded in:

- [Admin V2 architecture](ADMIN_V2_ARCHITECTURE.md)
- [Grid API and interaction contract](ADMIN_DATA_GRID.md)
- [Global selection model](ADMIN_SELECTION_MODEL.md)
- [shadcn/Radix migration notes](SHADCN_MIGRATION.md)
- [QA evidence and known limitations](ADMIN_V2_QA.md)

Build and backend QA passed; browser checks covered provider isolation, cursor loading, filters, all-matching selection, mobile navigation, taxonomy dialogs, and homepage validation. No database reset or COD order transition was performed. A few lower-volume reference lists still use their existing domain-specific tables, and unsupported schema features remain explicitly unavailable.
