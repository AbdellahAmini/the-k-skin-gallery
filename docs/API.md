# API surface

All routes are under `/api`. Product and quote values are recomputed from database rows; clients must not treat browser prices as authoritative.

## Storefront

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/products` | Paginated search/filter by query, brand, product type, verified skin type/concern, usage, availability, price, new/featured/promotion and sort; returns contextual facet counts |
| GET | `/products/{slug}` | Product detail |
| GET | `/brands` | Active brands with product counts |
| GET | `/categories` | Categories with product counts |
| GET | `/skin-types`, `/concerns` | Distinct taxonomies and verified product counts |
| GET | `/navigation` | Data for six primary navigation groups and their submenus |
| GET | `/search` | Grouped product, brand and product-type suggestions |
| GET | `/routines`, `/routines/{slug}` | Curated steps with deliberate product selections |
| GET | `/bundles`, `/bundles/{slug}` | Sellable packs, component products and calculated stock |
| GET | `/content` | Typed homepage, FAQ, menu and footer content |
| GET | `/articles`, `/articles/{slug}` | Published advice content |
| GET | `/cities` | Active delivery cities and shipping fees |
| GET | `/settings` | Public storefront settings |
| POST | `/quote` | Recalculate product/pack lines, promotion, and city shipping |
| POST | `/orders` | Create an idempotent COD order and reserve/decrement component inventory |
| GET | `/orders/receipt/{token}` | Read the order receipt using its opaque public token |
| POST | `/stock-alerts` | Request an email notification for an out-of-stock item |

The core public endpoints also have `/api/v1` aliases: products, brands and brand detail, product types, skin types, concerns, routines, bundles, search, navigation, active promotions, `POST /cart/validate`, and `POST /checkout`. Existing `/api` routes remain available to the storefront.

## Accounts

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Create a customer account and HTTP-only session |
| POST | `/auth/login` | Sign in |
| POST | `/auth/logout` | Clear the session cookie |
| GET | `/auth/me` | Current customer or `null` |
| GET/PUT | `/me/cart` | Read or replace authenticated cart lines |
| GET/PUT | `/me/wishlist` | Read or replace authenticated favorites |
| GET | `/me/orders` | Authenticated order history |
| GET | `/me/orders/{id}` | Read an owned order |

## Admin

Admin endpoints are protected by the admin role. APIs cover dashboard summary, order list/detail/status transitions, product metadata and verified taxonomy mappings, taxonomy CRUD, curated routines and packs, typed homepage/FAQ/menu/footer content, advice articles, city shipping fees, promotions, site settings, stock alerts, and customers. UI subsections that have no operational API are marked as incomplete in the admin rather than presented as working features.

## Order response

`POST /orders` accepts `items`, `city_id`, optional `promotion_code`, customer and delivery fields, and `client_request_id`. The response includes the generated `number`, opaque `public_token`, current status, persisted customer/delivery data, line snapshots, and server-calculated subtotal, discount, shipping, and total. It never trusts a submitted price.
