# Design QA — K-Skin Gallery

**Final result: passed**

## Comparison setup

- **Source visual:** [User-selected reference image](docs/selected-reference.png), 1487 × 1058 px.
- **Rendered implementation:** local storefront at `http://127.0.0.1:5173/`.
- **Side-by-side comparison:** [comparison view](http://127.0.0.1:5173/comparison.html). Captured in the Codex in-app browser; the browser screenshot showed the reference and current implementation together in the same input.
- **Desktop state:** homepage, empty cart, no active search, no menu open.
- **Implementation CSS viewport:** 1440 × 1024 px, scaled to 0.347222 in the comparison panel. The source was scaled to the same side-by-side display width; source and implementation aspect ratios are nearly identical.
- **Mobile state:** [390 × 844 preview](http://127.0.0.1:5173/mobile-preview.html), both at the top of the homepage and after tapping Boutique to scroll to the product grid.
- **Density:** the comparison uses browser scaling for presentation; the exact device pixel ratio is not exposed by the available browser capture API. No per-pixel claim is made.

The comparison page is a local QA helper, not a new storefront route. A separate mobile preview places the actual app in a 390 × 844 CSS-pixel iframe so its mobile media rules can be inspected in the Codex browser.

## Full-view comparison

The implementation preserves the source's sequence and hierarchy: trust strip, prominent Gallery logo, search and account actions, navigation, editorial hero with one CTA, brand row, five featured products, and a short three-step routine section. It uses the supplied logo, a generated still-life image, and real product cutouts from the workspace catalog. The storefront remains French-first and makes Moroccan delivery and COD visible before shopping.

The prototype uses a quieter editorial headline and a full-width still-life crop. Unlike the reference, the generated hero packaging has no readable brand labels; actual products appear in the catalog row. This is an intentional asset distinction rather than a UI placeholder.

## Focused fidelity surfaces

- **Typography:** an editorial serif is used for the main title/section headings and a sans-serif for controls, product names, and forms. French accents render correctly. The display hierarchy and compact product-card typography remain close to the source.
- **Spacing and layout:** the desktop version keeps the three-level header, single hero action, brand rail, five-column product row, and light section transitions. The hero now runs edge-to-edge so the first iteration's vertical photo seam is gone. On mobile, the header collapses, product cards become two columns, and the five-item bottom navigation stays fixed.
- **Colors and tokens:** the surface is predominantly warm white/ivory, with beige and restrained blush, charcoal text, and rose actions. The background does not flood the interface with pink.
- **Image quality:** the real supplied logo and catalog cutouts are used. A single photo-real still-life was generated for the hero because the selected composition calls for editorial product photography. Product images stay contained and are not drawn with CSS.
- **Copy and content:** the page uses clear French and MAD prices. It avoids review stars and medical claims. COD submission ends at “Commande reçue” and says the order still needs a phone confirmation.
- **Icons:** Phosphor icons are used for search, cart, delivery, account, wishlist, and feedback. No hand-drawn SVG or CSS icon substitutes are used.
- **Accessibility and controls:** controls are semantic buttons/inputs with labels and visible focus styles; reduced motion is respected. Cart quantity changes, favorites, search suggestions, empty results, mobile menu, COD checkout, and receipt state are implemented.

## Interaction evidence

- Added an item; cart count and toast updated.
- Opened the cart, changed/inspected its line item, and continued as a guest.
- Submitted local sample COD details; the app displayed “Commande reçue” and the phone-confirmation explanation. No external order was submitted.
- Searched `serum`; the suggestion and filtered results appeared.
- Opened the 390 × 844 viewport and tapped Boutique; the page moved to the product grid and the bottom navigation remained visible.

## Comparison history

1. **Desktop pass — P2, photo seam:** the first side-by-side render showed a hard vertical edge between the beige copy panel and the hero photograph. The hero image was extended edge-to-edge. The final side-by-side capture shows the composition reading as one continuous product scene, with headline copy still in the open left area.
2. **Mobile pass — P2, trust-label collision:** the first 390px capture placed a second set of trust labels over the product photo and near the CTA. The duplicate hero trust row was hidden on mobile, the photo was moved below the CTA, and the hero height was shortened. The revised 390 × 844 view shows the headline and CTA clearly, then the product still-life, followed by the brand strip; on scrolling, the product grid and fixed bottom nav remain usable.

## Residual scope

- No tablet viewport was captured separately; this preview focuses on the selected desktop composition and a 390px phone layout.
- The workspace remains a frontend prototype: server, database, admin operations, production shipping/pricing rules, and live email/Telegram integrations were not part of the selected image-to-code slice.
- The generated still-life is intentionally generic and does not replace official product imagery in product cards.

## Implementation checklist

- [x] Match the selected hero, brand row, featured products, and routine hierarchy.
- [x] Keep COD and local delivery trust visible.
- [x] Remove the desktop seam and mobile trust-label collision found during QA.
- [x] Verify search, favorites, cart, guest COD form, and order-received state in the local browser.
- [x] Build the production bundle successfully.
- [x] Leave the local preview running for review.
