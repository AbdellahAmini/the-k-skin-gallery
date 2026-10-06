# Admin V2 — Data grid contract

## Product and stock grid

Route: `/admin/catalogue/produits` and `/admin/stock`.

The grid is backed by `useInfiniteQuery` and TanStack Table. Each request asks for at most 30 rows. The scroll container is the `IntersectionObserver` root; the observer loads the next cursor within 160px of the bottom. There is no client-side full-catalogue download or page-number assumption.

`GET /api/admin/products` supports:

- `limit` (1–30; defaults to a capped 30 for cursor use), `cursor`, and `sort` (`id`, `name`, `price`, `stock`, `updated`)
- Search `q` across the server's supported product identity/brand fields
- `publication_status`, `verification_status`, `inventory_status`, `brand_slug`, `product_type_slug`, `skin_type_slug`, `concern_slug`, and `readiness`
- A compatible page/page_size response for older clients
- `ids` for focused editor lookups, capped by the API

Cursor responses include `products`, `total`, `has_more`, and `next_cursor`. Cursor ordering is deterministic and includes an ID tie-breaker. Search/filter scope is encoded in the URL and sent to the API. Changing search or filters resets selection and scroll to the top; returning to a previously visited same query can restore its own scroll position. Sort does not change the selection scope.

The Products table offers column visibility preferences saved in local storage. Stock exposes the current on-hand count and a quick adjustment. It does not claim to show reserved stock or movement history. Product create/edit actions are separate routes.

## Orders grid

Route: `/admin/commandes`.

`GET /api/admin/orders` supports `limit` (maximum 30), `cursor`, sort (`id`, `amount`, `customer`), `q`, `status`, `city`, `created_after`, and `created_before`. Cursor responses include `orders`, `total`, `has_more`, and `next_cursor`. The table links to `/admin/commandes/{id}` and never offers bulk order-state changes.

## Query and error behavior

- Query keys include the entity, complete filter scope, and sort. Each filter is therefore a separate server result set.
- The grid exposes the result count, number loaded, empty state, API error state, current loading state, and end-of-results state.
- Search/filter values are URL-backed and can be linked or reloaded.
- Row navigation retains browser history. The table's internal scroll does not move the whole fixed-height admin shell.
- All write results are server responses; client totals are never treated as authoritative for global operations.

## Other record views

Taxonomy, routine, pack, delivery, promotion, customer, alert, and notification records use existing domain-specific views and endpoints. Taxonomy editing uses an accessible Radix dialog. Routine and pack product selectors make remote `q`/ID lookups instead of loading the entire catalogue. These smaller/domain-specific lists are not yet all converted to the shared infinite TanStack table surface.

