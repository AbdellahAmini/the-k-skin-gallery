# Information architecture V2 — The K-Skin Gallery

This is the implementation map for the storefront refactor. The existing ivory, blush, rose, Gallery logo, typography, cart drawer, COD checkout and FastAPI order flow remain the foundation. Product claims and skin compatibility must be assigned from reviewed source data; empty taxonomy associations are preferable to invented recommendations.

## 1. Existing route map

| Area | Existing URLs | Existing behavior |
| --- | --- | --- |
| Storefront | `/`, `/boutique`, `/nouveautes`, `/promotions`, `/recherche` | Home sections and a generic collection template; filters held in component state. |
| Catalog | `/marques`, `/marques/:slug`, `/soins`, `/soins/:slug`, `/type-de-peau`, `/type-de-peau/:slug`, `/routines`, `/routines/:slug`, `/produits/:slug` | Brand and category pages use catalog data. Skin and routine pages show broad products without verified associations. |
| Commerce | `/favoris`, `/panier`, `/checkout`, `/commande/:token/confirmation` | Persisted guest cart, dedicated COD checkout, server price/stock validation and transactional orders. |
| Customer/support | `/connexion`, `/inscription`, `/compte/*`, `/contact`, `/faq`, `/livraison`, `/retours`, `/cgv`, `/confidentialite` | Working account basics and support pages; some account subsections are incomplete. |
| Admin | `/admin/*` | Orders, products, stock, promotion, shipping and settings controls; taxonomy management is missing. |

## 2. Proposed route map

| Purpose | Canonical routes |
| --- | --- |
| Home and catalog | `/`, `/boutique`, `/nouveautes`, `/promotions`, `/recherche?q=`, `/incontournables` |
| Brands | `/marques`, `/marques/:slug` |
| Product types | `/soins`, `/soins/nettoyants`, `/soins/huiles-baumes`, `/soins/exfoliants`, `/soins/toners-essences`, `/soins/serums-ampoules`, `/soins/masques`, `/soins/contour-des-yeux`, `/soins/cremes`, `/soins/protection-solaire` |
| Skin | `/peau`, `/type-de-peau`, `/type-de-peau/:slug`, `/besoins`, `/besoins/:slug` |
| Guided discovery | `/routines`, `/routines/:slug`, `/packs`, `/packs/:slug` |
| Product/commerce | `/produits/:slug`, `/favoris`, `/panier`, `/checkout`, `/commande/:token/confirmation` |
| Customer/support | Existing customer and support routes; `/conseils` and `/conseils/:slug` when verified editorial content exists. |
| Admin | `/admin`, `/admin/commandes`, `/admin/catalogue/*`, `/admin/stock`, `/admin/promotions`, `/admin/livraison`, `/admin/clients`, `/admin/avis`, `/admin/alertes-stock`, `/admin/contenu/*`, `/admin/parametres` |

Legacy `/soins/serums` resolves to the canonical `/soins/serums-ampoules`. Query combinations remain shareable, with canonical metadata pointing to their parent collection.

## 3. Navigation tree

Logo → `/`. Desktop primary navigation: **Nouveautés · Marques · Soins · Peau · Routines & Packs · Promotions**. Account, wishlist and cart stay in the utility row. Blog/conseils, support and policy links live in the footer or account area.

## 4. Mega-menu structure

| Menu | Grouping | Destination |
| --- | --- | --- |
| Marques | Available brands in an alphabetical grid; featured brand only with an owned image and configured copy. | `/marques`, `/marques/:slug` |
| Soins | Nettoyer: Huiles & Baumes, Nettoyants, Exfoliants. Préparer & traiter: Toners & Essences, Sérums & Ampoules, Masques, Contour des yeux. Hydrater & protéger: Crèmes, Protection solaire. | `/soins`, category routes, `/incontournables`, `/nouveautes` |
| Peau | Type de peau and Besoins are separate visible columns. | `/peau`, `/type-de-peau/:slug`, `/besoins/:slug` |
| Routines & Packs | Routines: simple, matin, soir, double nettoyage. Packs: actual available bundles. | `/routines`, `/routines/:slug`, `/packs`, `/packs/:slug` |

## 5. Mobile navigation tree

The drawer starts with Accueil and Nouveautés, then nested Marques, Soins, Peau and Routines & Packs sections, Promotions, then Favoris, Compte and Contact. The persistent bottom navigation remains Accueil, Boutique, Recherche, Favoris, Compte. The cart stays in the header. Nested sections use disclosure controls with real links inside.

## 6. Product taxonomy

`Brand` identifies the maker. Existing `Category` becomes the public product type (`ProductType` at the API boundary). `SkinType` and `Concern` are independent many-to-many entities; an oily skin type is never a concern. `Ingredient` is structured but not a launch facet. `ProductMetadata` holds reviewed usage time (AM, PM, both), routine step, source name/date and search aliases. Existing source catalog rows remain an import feed, not runtime truth. `Routine` and its steps are guided curated collections. `Bundle` contains component SKUs and computes saleable quantity from their stock. `Collection` is a separate merchandising entity.

Only reviewed taxonomy assignments appear as product recommendations. The current imported catalog lacks verified skin, concern and ingredient fields, so associations start empty and admin can add them after review.

## 7. Filter matrix

| Page context | Product type | Brand | Skin type | Concern | Price | Usage | Availability |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `/boutique`, `/recherche`, `/nouveautes`, `/promotions` | Yes, when multiple | Yes | Yes | Yes | Yes | Yes | Yes |
| `/marques/:slug` | Yes, when multiple | No | Yes | Yes | Yes | Yes | Yes |
| `/soins/:slug` | No | Yes | Yes | Yes | Yes | Yes | Yes |
| `/type-de-peau/:slug` | Yes, when multiple | Yes | No | Yes | Yes | Yes | Yes |
| `/besoins/:slug` | Yes, when multiple | Yes | Yes | No | Yes | Yes | Yes |

Facet values/counts come from the current collection after other filters are applied. Zero-count values are hidden unless selected. Filtering and sorting use URL query parameters. Mobile uses an accordion drawer with a sticky result action. `page` is a real pagination parameter, with a target of 24 products per page. No ingredient, SPF, finish or subtype facet is exposed until source data is verified.

## 8. Page-template matrix

| Template | Routes | Content before products |
| --- | --- | --- |
| Directory | `/marques`, `/soins`, `/peau`, `/type-de-peau`, `/besoins`, `/routines`, `/packs` | Breadcrumb, H1, short explanation, linked cards. |
| Collection/PLP | Shop, new, promotion, brand, type, skin, concern, search | Breadcrumb, H1, 1–2 sentences, contextual product-type pills, count/sort/filter toolbar. |
| Guided routine | `/routines/:slug` | Breadcrumb, H1, short intro, named steps with curated product links. |
| Bundle detail | `/packs/:slug` | Breadcrumb, bundle image/title, components, current availability, price, cart action. |
| Product detail | `/produits/:slug` | Gallery, brand/name, price/availability/actions, reviewed attributes, product information and delivery. |
| Checkout | `/checkout` | Contact and address form, server quote, COD summary and phone-confirmation note. |

## 9. Data-model changes

Add `SkinType`, `Concern`, `Ingredient`, product association tables, `ProductMetadata`, `Routine`, `RoutineStep`, `RoutineStepProduct`, `Bundle`, `BundleItem`, `Collection`, `CollectionProduct`, and bundle order/cart snapshot tables as needed. Keep existing product, order, inventory and promotion records. Add a versioned migration for the new tables and any column changes; do not drop the local order history. PostgreSQL is the deployment database through `DATABASE_URL`; local SQLite is for development only.

## 10. Migration mapping

| Old current behavior | New behavior |
| --- | --- |
| Desktop nav includes Accueil and “Type de peau”. | Logo opens home; six primary paths include Peau with type and concern subtrees. |
| Flat mega-menu links. | Grouped mega menus with real destinations and mobile nested sections. |
| Home category tiles are the entry point. | Three numbered Gallery cards introduce Soin, Peau and Marque before products. |
| Skin and routine pages show all products. | Skin/concern pages query reviewed assignments; routine pages render curated steps. |
| Filter values live in React component state. | Server query service, contextual facets/counts and URL state. |
| Promotions are just a client-side post-filter. | The API and PLP query promotion state; the route has its own introduction. |
| `new_arrival` is a permanent imported flag. | Time-limited `new_until` or admin-controlled state governs new arrivals. |
| Pack-looking catalog items are ordinary products. | New first-class Bundle/BundleItem records for future composed packs; existing manufacturer kits remain individual SKUs. |
| Admin taxonomy links are placeholders. | Admin can manage skin types, concerns, routine steps and pack components with reviewed source fields. |

## Verification and release gate

The core path is home → directory → collection → PDP → cart → dedicated checkout → received order. Check deep links and URL filter/back behavior, mobile drawer and filtering, bundle stock math, normal browser console, API validation, and the existing Sites packaging. Real product compatibility, source text and operational PostgreSQL rollout require merchant review before a production launch.
