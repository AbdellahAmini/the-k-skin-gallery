# K-Skin Gallery — design research

**Research date:** 27 September 2026  
**Question:** How can a Moroccan multi-brand K-beauty shop feel curated while keeping local shopping, product discovery, and cash-on-delivery obvious?

## Method

Design galleries were treated as indexes for finding patterns across products, rather than as templates to reproduce. Mobbin is suited to locating shipped app and web screens by flow (including search, add-to-cart, and checkout); Land-book makes it possible to narrow website examples by industry, style, type, and typography; SiteInspire provides individual website references; Godly and Awwwards were considered for occasional expressive or interaction details. The selected direction combines those pattern areas with current public storefront pages and the Gallery's supplied brand assets.

This was a first-pass, source-grounded review of public gallery listings and public storefront pages. Mobbin's public overview describes its screen/flow library, but its authenticated screens were not opened for a frame-by-frame checkout audit in this pass. Consequently, this document does not claim a specific Mobbin checkout pattern was verified. The prototype's COD flow follows the explicit local requirement that an order is received first and then confirmed by phone.

## Gallery index findings

| Gallery | What it helps locate | How it informed the work | Boundary |
|---|---|---|---|
| Mobbin | Real app/web screens and journeys, searchable by screens, UI elements, and flows such as Searching and Adding to Cart | Use as the next source for detailed mobile search, cart, checkout, and account state comparisons | A library index is not itself evidence for one particular screen; inspect the actual flow before adopting it |
| Land-book | Ecommerce and Beauty sites, with filters for pastel/light colors, serif/sans typography, and physical products | Used to frame the visual search around ecommerce + beauty + restrained light palette + serif display typography | A filtered gallery is for visual range, not proof that the underlying shop experience works |
| SiteInspire | Individual sites tagged for areas such as cosmetics/skincare and ecommerce | Useful to inspect restrained product framing and whitespace, including the Kit listing | Use layout principles only; do not lift its page composition |
| Godly | A cross-category gallery that includes Beauty and E-commerce | Keep it as a source for one small expressive interaction or transition if useful later | Not the primary model for catalog, search, COD, or checkout |
| Awwwards | Site entries and individual elements; the CREMERI entry exposes desktop/mobile, product-listing, and product-detail references | Useful for occasional motion or product-listing detail after usability is settled | Award-oriented treatments can increase motion and interaction cost; keep any borrowed detail secondary |

## Storefront comparison matrix

| Reference | Area reviewed | Useful idea | Application here | What not to copy |
|---|---|---|---|---|
| [EmaBeauty Morocco](https://emabeauty.ma/) | Local homepage, catalog, and empty cart | Put 24–48h delivery, authenticity, and COD within the shopper's first scan; offer help from the cart | Trust strip and hero promises; COD is named before checkout | Its exact colors, wording, theme, or layout |
| [Soko Glam](https://sokoglam.com/collections/all) | Multi-brand catalog and collection filters | Structure discovery around product type, concern, skin type, price, and brand | Keep the same useful dimensions but trim the number of exposed controls for a ~100-item launch catalog | Its long filter inventory and 10-step routine emphasis |
| [MiiN Cosmetics](https://direct.miin-cosmetics.com/) | Homepage, skin-type discovery, and three-step routine content | A short routine can explain the order of use without making a long regimen mandatory | A concise three-step routine strip below the main product selection | Its full recommender and broad content footprint |
| [Aesop](https://www.aesop.com/skin-care.html) | Skin-care category hierarchy and product context | Category names plus short context can help shoppers understand where to start | Plain-language categories and compact product notes | The luxury tone, expansive range, or dense ingredient refinements |
| [Typology](https://typologyskincare.com/collections/all) | Product collection and compact brand presentation | Keep collection browsing calm and let product descriptions carry the detail | Product cards stay short; longer information belongs on a detail view | Its single-brand minimalism as the whole multi-brand store identity |
| [Glossier](https://www.glossier.com/collections/all/) | Product listing and quick add/variant controls | Keep choice and add-to-bag close to product identity and price | Direct add-to-cart action on the featured products | Color, brand voice, or promotional treatment |
| [Rhode](https://www.rhodeskin.com/) | Campaign-first brand homepage and product edits | Strong product photography and a focused hero can carry a short first screen | One editorial hero and one primary action | A single-brand campaign structure as multi-brand information architecture |
| [Space NK — Korean skincare](https://www.spacenk.com/uk/korean-beauty/korean-skincare?page=1) | Multi-brand Korean skincare collection | Grouping the Korean edit by brand and product type aids shoppers who already know what they want | A compact brand rail and simple product categories | Its international assumptions, prices, or global catalog scale |
| [Olive Young Global](https://global.oliveyoung.com/) | Large retailer category and concern vocabulary | Concern labels can help discovery when they use familiar language | Keep concerns as secondary catalog filters, after product type and skin type | Its marketplace breadth and deep taxonomy |

## Flow and page patterns

### Search and discovery

- The Mobbin index explicitly groups screens and flows for search and ecommerce journeys. A later detailed pass should compare query entry, result grouping, and empty-state behavior across real apps before expanding this prototype's search.
- The storefront review shows distinct ways to expose product type, skin type, concerns, and brand. For this catalog, the first visible choices stay small: product categories and brands; concerns remain a secondary refinement.
- French search normalizes case and accents in the prototype so a shopper can enter `serum` and match `Sérums`.

### Catalog and filter patterns

- Soko Glam and MiiN expose several useful dimensions, while EmaBeauty's current local catalog centers category/brand, availability, and price.
- The target catalog is small enough to avoid a permanent desktop wall of controls. The prototype begins with one featured selection, category links, and search; a full catalog can add a mobile filter drawer when catalog size and metadata justify it.
- Sort labels such as “Plus populaires” should be hidden until ranking data exists.

### Product-detail approaches

1. **Curator-led set page:** Soko Glam's routine sets emphasize the collection and how the set fits together. Useful for optional routines, but too complex as the default purchase path.
2. **Category-led product education:** Aesop places product families and context near category browsing. Useful as a model for simple product-type discovery.
3. **Fast product selection:** Glossier keeps product naming, variant choices, and add-to-bag actions close to the item. Useful for quick additions; a full Gallery PDP should additionally show size, availability, routine position, and delivery/returns.

The current prototype is intentionally a homepage slice: the user can search, save a favorite, add an item, review the cart, and submit a local COD order. It does not present an invented review score or claim an ingredient fact. The featured prices and product names are read from the workspace catalog.

### Mobile commerce and operational UX

The image reference is a desktop homepage, so mobile behavior is an adaptation rather than a literal shrink: compact header, searchable entry, swipeable horizontal category/brand area, two-column product cards, persistent five-item navigation, and a full-height cart drawer. Checkout is a separate responsive `/checkout` route. It asks for delivery contact/location essentials and ends with “Commande reçue”; it explicitly says phone confirmation is next.

Admin dashboard patterns were not part of this visual slice. The existing workspace is a PDF catalogue generator, not an ecommerce admin, so there was no local dashboard to audit. Admin order operations should be researched as a separate flow before implementing an operations console.

## Direction selected

The selected visual target is the user-attached last concept. It uses a large, quiet product still-life, clear Moroccan trust cues, a small brand rail, a featured product row, and an uncomplicated three-step routine story. The implementation uses the repository's actual Gallery logo and existing product cutouts, plus one generated still-life asset. It carries over the structure and hierarchy, not a reference site's exact layout.

## Sources

- [Mobbin overview](https://mobbin.com/) — searchable screen, element, and flow library.
- [Land-book ecommerce gallery and filters](https://land-book.com/design/website/ecommerce) — industry/style/type/typography filtering.
- [SiteInspire Kit listing](https://www.siteinspire.com/website/11066-kit) — cosmetics/skincare, ecommerce reference listing.
- [Godly](https://godly.website/?hl=en-IN) — gallery categories include Beauty and E-commerce.
- [Awwwards CREMERI product category element](https://www.awwwards.com/inspiration/product-category-cremeri-skin-care-products) — product listing/detail and desktop/mobile element references.
- [Awwwards Vaara](https://www.awwwards.com/sites/vaara) — example of product-listing filters and add-to-bag interaction as a detail source outside the beauty category.
- [EmaBeauty cart](https://emabeauty.ma/cart), [Soko Glam catalog](https://sokoglam.com/collections/all), [MiiN homepage](https://direct.miin-cosmetics.com/), [Aesop skincare](https://www.aesop.com/skin-care.html), [Typology products](https://typologyskincare.com/collections/all), [Glossier products](https://www.glossier.com/collections/all/), [Rhode homepage](https://www.rhodeskin.com/), [Space NK Korean skincare](https://www.spacenk.com/uk/korean-beauty/korean-skincare?page=1), [Olive Young Global](https://global.oliveyoung.com/).
