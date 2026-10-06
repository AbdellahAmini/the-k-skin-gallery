# Admin Experience V2 — QA record

**Run date:** 2026-10-03  
**Local URLs:** `http://localhost:5173/admin`, API on port 8000  
**Browser:** Playwright MCP, authenticated admin session

## Automated checks

- `npm run build` — passed with Vite 6.4.2.
- `backend/.venv/Scripts/python.exe -m pytest -q` — **18 passed**. One upstream Starlette/httpx deprecation warning.
- Browser runtime checks included desktop and 390×844 mobile viewports.

## Browser scenarios observed

| Area | Result |
|---|---|
| Admin entry | Dashboard and admin routes render; page title is scoped to Administration |
| Store isolation | Admin route network did not need storefront cart/wishlist endpoints; V2 does not mount `StoreProvider` |
| Products search | Searching `Anua` updates the input, URL, and server result set (38 matches, first request capped at 30) |
| Products filters | Publication filter returns 96 published records; skin-type filtering composes with `Anua` and returns 5 matching rows |
| Infinite load | Initial and subsequent product requests use 30-item cursor batches; observer is rooted in the internal grid scroller |
| Global selection | Selecting all matching reports the server result count (323 in the unfiltered baseline); changing a filter clears selection |
| Product creation | New product route starts in draft mode with public price defaulted to 0; no create request was submitted |
| Orders | Four baseline rows load; a no-match search produces an empty state and URL-backed query. Attempting a status update without a note shows validation and sends no status POST |
| Sidebar | Ctrl+B collapses to 60px and expands to 252px |
| Mobile navigation | At 390px the mobile trigger opens a Radix `dialog`; body/document width remains 390px |
| Taxonomy editor | Brand create editor opens as a modal bottom sheet on mobile and can be closed without saving |
| Homepage editor | Preview updates from existing content; an invalid external `//...` destination is rejected before any PUT |
| Console | No current route runtime errors after a clean reload; one transient HMR error occurred while replacing the query hook during development and is excluded from final clean-reload results |

The browser pass did not submit any product, taxonomy, content, delivery, promotion, customer, or order changes. No bulk operation was submitted. COD state was not modified.

## Local database preservation check

Pre-V2 baseline recorded in the implementation plan and read again after QA:

| Records | Before | After |
|---|---:|---:|
| Products | 323 | 323 |
| Published products | 96 | 96 |
| Draft products | 227 | 227 |
| Brands | 18 | 18 |
| Orders | 4 | 4 |
| Customer accounts | 0 | 0 |
| Stock alerts | 0 | 0 |
| Promotions | 0 | 0 |
| Cities | 12 | 12 |

There is one admin user in the database; the customer-account count is zero. The tests use isolated test databases.

## Screenshots

- [Desktop admin dashboard](qa/admin-v2/admin-desktop-dashboard.png)
- [Mobile product list](qa/admin-v2/admin-products-mobile.png)
- [Mobile taxonomy editor](qa/admin-v2/admin-taxonomy-editor-mobile.png)

## Known limitations

- Reserved quantity and stock movement history are not available from the current model/API.
- Product types and ingredients do not have an `active` field, so these dictionaries cannot be deactivated without additive schema/API work.
- Promotions have no start/end date or product targeting fields. Their editor only changes fields represented by the current model.
- Customer accounts do not store a default delivery address; order details display immutable order-address snapshots.
- Reviews remain disabled. Notification outbox rows are view-only because the API does not expose retry semantics.
- Several small taxonomy/routine/content tables still use domain-specific table markup rather than the shared infinite grid; products, stock, and orders use the new cursor grid.

