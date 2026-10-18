# Homepage launch refactor

## Current sections

1. Shared header and trust ticker.
2. Three-slide campaign hero. Desktop copy sits on the photograph; mobile copy uses a translucent placard over a crop of the same desktop images.
3. Korean brand marquee.
4. Three Gallery entry choices.
5. “Nos incontournables,” shown only on mobile and capped at four products.
6. “Promotions,” showing up to ten products on desktop and four on mobile, with an empty card if none exist.
7. “Nouveautés dans la Gallery,” shown only on desktop and capped at five products.
8. Routines and Packs guidance rail.
9. Service assurances and shared footer.

The homepage reads products from the shared `StoreContext` array. On hydration the provider requests three product lists (`featured=true&page_size=8`, `new=true&page_size=8`, and `promotion=true&page_size=10`) as well as shared navigation, routines, packs, settings, content, and account data. The static prerender currently collects the entire published catalog for route generation, then embeds a small promotion/new-arrival selection in the homepage HTML. The homepage itself does not need the full catalog in the browser.

## Keep

- Gallery logo, French copy, ivory/blush palette, serif titles, COD checkout, header, trust ticker, footer, and five-item mobile bottom navigation.
- Three real campaign routes and four-second carousel dwell with swipe, horizontal transitions, and reduced-motion handling.
- Real brand logos and the seamless brand marquee.
- Exactly the three existing Gallery entry paths: `/soins`, `/peau`, `/marques`.
- Existing `ProductCard`, routine data, pack data, service messages, and commerce interactions.
- Existing `featured` product flag and `featured_product_ids` homepage content for merchandising; no catalog migration is required.

## Restructure

- Give each hero image a composition with a safe left copy area and visible products on the right, using separate desktop and mobile assets where needed. Remove the mobile placard and heavy readability treatment.
- Show one curated “Les favoris de la Gallery” selection on both desktop (up to six) and mobile (four), with a boutique CTA.
- Rename the promotional preview to “Offres de lancement,” show only genuine offers (up to six desktop/four mobile), omit the section when empty, and avoid repeating favorite products when possible.
- Align section headings and content to one shared container and spacing rhythm. Keep the Gallery cards editorial and stacked on mobile. Keep the routine rail horizontal on mobile.
- Limit product requests to the small lists the homepage uses. Update the prerendered homepage selection and first-image preload to match the actual campaign assets.
- Normalize the brand rail presentation and make its motion slow, seamless, and independent of ordinary hover.

## Remove

- The large homepage “Nouveautés dans la Gallery” section. The `/nouveautes` route and its product capability remain available.
- The mobile-only/desktop-only split for the curated product section.
- The empty promotions placeholder and any obsolete CSS for the former homepage sections or hero experiments.
- Unnecessary new-arrival request during shared homepage hydration and eager preloading of every hero slide.

## New order

1. Header and trust ticker.
2. Hero campaign slider.
3. Nos marques coréennes.
4. Entrez dans la Gallery.
5. Les favoris de la Gallery.
6. Offres de lancement, only when active offers exist.
7. Routines & Packs, only when there is real content.
8. Service assurances.
9. Footer.
