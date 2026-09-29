# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hero-carousel.spec.mjs >> Hero Carousel Verification Suite >> Mobile: 13-21 Mobile behavior, swipe gestures, no autoplay, compact layout
- Location: tests\e2e\hero-carousel.spec.mjs:109:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/
Call log:
  - navigating to "http://127.0.0.1:4173/", waiting until "load"

```

# Test source

```ts
  18  |     const title = hero.locator('#hero-title');
  19  |     await expect(title).toBeVisible();
  20  |     await expect(title).toContainText('Vos essentiels');
  21  |     await expect(hero.locator('.eyebrow')).toContainText('BEAUTÉ CORÉENNE · SÉLECTION EXCLUSIVE');
  22  | 
  23  |     // 9. Primary CTA always points to /boutique
  24  |     const primaryCta = hero.locator('.hero-cta');
  25  |     await expect(primaryCta).toHaveAttribute('href', '/boutique');
  26  |     await expect(primaryCta).toContainText('Explorer la boutique');
  27  | 
  28  |     // 10. Secondary CTA on Slide 1 -> /nouveautes
  29  |     const secondaryCta = hero.locator('.hero-cta-secondary');
  30  |     await expect(secondaryCta).toHaveAttribute('href', '/nouveautes');
  31  |     await expect(secondaryCta).toContainText('Voir les nouveautés');
  32  | 
  33  |     // 6. Hover pauses autoplay
  34  |     await hero.hover();
  35  |     await page.waitForTimeout(2000);
  36  |     // After hovering, slide should still be slide 1
  37  |     await expect(title).toContainText('Vos essentiels');
  38  | 
  39  |     // Move mouse away to resume
  40  |     await page.mouse.move(0, 0);
  41  | 
  42  |     // 7. Dot click changes slide immediately
  43  |     const dots = hero.locator('.hero-dot-btn');
  44  |     await expect(dots).toHaveCount(3);
  45  |     await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');
  46  | 
  47  |     // Click dot 2 (Slide 2: Routines)
  48  |     await dots.nth(1).click();
  49  |     await expect(title).toContainText('Une routine simple');
  50  |     await expect(hero.locator('.eyebrow')).toContainText('ROUTINES & PACKS');
  51  |     await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');
  52  | 
  53  |     // 11. Secondary CTA on Slide 2 -> /routines
  54  |     await expect(hero.locator('.hero-cta-secondary')).toHaveAttribute('href', '/routines');
  55  |     await expect(hero.locator('.hero-cta-secondary')).toContainText('Découvrir les routines');
  56  |     await expect(hero.locator('.hero-cta')).toHaveAttribute('href', '/boutique');
  57  | 
  58  |     // 8. After dot click, autoplay stops permanently
  59  |     // Wait > 4.5s to ensure autoplay does NOT rotate after manual interaction
  60  |     await page.waitForTimeout(4800);
  61  |     await expect(title).toContainText('Une routine simple');
  62  |     await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');
  63  | 
  64  |     // 4. Slide 3 works via dot click
  65  |     await dots.nth(2).click();
  66  |     await expect(title).toContainText('Les références');
  67  |     await expect(hero.locator('.eyebrow')).toContainText('LES MARQUES DE LA GALLERY');
  68  |     await expect(dots.nth(2)).toHaveAttribute('aria-current', 'true');
  69  | 
  70  |     // 12. Secondary CTA on Slide 3 -> /marques
  71  |     await expect(hero.locator('.hero-cta-secondary')).toHaveAttribute('href', '/marques');
  72  |     await expect(hero.locator('.hero-cta-secondary')).toContainText('Découvrir les marques');
  73  |     await expect(hero.locator('.hero-cta')).toHaveAttribute('href', '/boutique');
  74  | 
  75  |     // Wait for the previous transition to finish (800ms) before clicking again
  76  |     await page.waitForTimeout(850);
  77  | 
  78  |     // 5. Last -> first loops cleanly
  79  |     await dots.nth(0).click();
  80  |     await expect(title).toContainText('Vos essentiels');
  81  |     await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');
  82  | 
  83  |     // Verify indicators accessibility
  84  |     await expect(dots.nth(0)).toHaveAttribute('aria-label', 'Afficher la diapositive 1');
  85  |     await expect(dots.nth(1)).toHaveAttribute('aria-label', 'Afficher la diapositive 2');
  86  |     await expect(dots.nth(2)).toHaveAttribute('aria-label', 'Afficher la diapositive 3');
  87  | 
  88  |     // Verify completely removed old gallery control
  89  |     await expect(page.locator('.gallery-slider-bar')).toHaveCount(0);
  90  |     await expect(page.locator('.hero-trust')).toHaveCount(0);
  91  | 
  92  |     expect(consoleErrors).toEqual([]);
  93  |   });
  94  | 
  95  |   test('Desktop: Autoplay advances automatically without manual interaction', async ({ page }) => {
  96  |     await page.setViewportSize({ width: 1440, height: 900 });
  97  |     await page.goto('/');
  98  | 
  99  |     const hero = page.locator('.hero-carousel-container');
  100 |     const title = hero.locator('#hero-title');
  101 |     await expect(title).toContainText('Vos essentiels');
  102 | 
  103 |     // Wait for autoplay cycle (~4000ms dwell + 800ms transition)
  104 |     await page.waitForTimeout(4800);
  105 |     await expect(title).toContainText('Une routine simple');
  106 |     await expect(hero).toHaveClass(/dir-next/);
  107 |   });
  108 | 
  109 |   test('Mobile: 13-21 Mobile behavior, swipe gestures, no autoplay, compact layout', async ({ page }) => {
  110 |     const consoleErrors = [];
  111 |     page.on('pageerror', (err) => consoleErrors.push(err.message));
  112 |     page.on('console', (msg) => {
  113 |       if (msg.type() === 'error') consoleErrors.push(msg.text());
  114 |     });
  115 | 
  116 |     for (const width of [375, 390, 430]) {
  117 |       await page.setViewportSize({ width, height: 800 });
> 118 |       await page.goto('/');
      |                  ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/
  119 | 
  120 |       const hero = page.locator('.hero-carousel-container');
  121 |       await expect(hero).toBeVisible();
  122 | 
  123 |       // 14. Hero total height clamp (520px - 580px)
  124 |       const heroBox = await hero.boundingBox();
  125 |       expect(heroBox.height).toBeGreaterThanOrEqual(510);
  126 |       expect(heroBox.height).toBeLessThanOrEqual(590);
  127 | 
  128 |       // 18. Text is rendered directly OVER image (inside hero container)
  129 |       const copy = hero.locator('.hero-copy-overlay');
  130 |       await expect(copy).toBeVisible();
  131 |       const copyBox = await copy.boundingBox();
  132 |       expect(copyBox.y + copyBox.height).toBeLessThanOrEqual(heroBox.y + heroBox.height);
  133 | 
  134 |       // 17. Dots remain visible inside hero without scrolling
  135 |       const dots = hero.locator('.hero-indicators');
  136 |       await expect(dots).toBeVisible();
  137 |       const dotsBox = await dots.boundingBox();
  138 |       expect(dotsBox.y + dotsBox.height).toBeLessThanOrEqual(heroBox.y + heroBox.height);
  139 | 
  140 |       // 13. Mobile autoplay must be disabled: wait 7000ms and verify slide does NOT advance
  141 |       if (width === 375) {
  142 |         const title = hero.locator('#hero-title');
  143 |         await expect(title).toContainText('Vos essentiels');
  144 |         await page.waitForTimeout(7000);
  145 |         await expect(title).toContainText('Vos essentiels');
  146 | 
  147 |         // 19. Primary CTA works
  148 |         const primaryCta = hero.locator('.hero-cta');
  149 |         await expect(primaryCta).toHaveAttribute('href', '/boutique');
  150 | 
  151 |         // 20. Secondary CTA is a subtle text link
  152 |         const secondaryCta = hero.locator('.hero-cta-secondary');
  153 |         await expect(secondaryCta).toHaveAttribute('href', '/nouveautes');
  154 | 
  155 |         // 14. Swipe left changes slide (Next: slide 1 -> slide 2)
  156 |         const startX = heroBox.x + heroBox.width * 0.8;
  157 |         const startY = heroBox.y + heroBox.height * 0.5;
  158 |         const endX = heroBox.x + heroBox.width * 0.2;
  159 | 
  160 |         // Simulate touch swipe left
  161 |         await page.evaluate(({ sX, sY, eX }) => {
  162 |           const el = document.querySelector('.hero-carousel-container');
  163 |           const touch1 = new Touch({ identifier: 1, target: el, clientX: sX, clientY: sY });
  164 |           const touch2 = new Touch({ identifier: 1, target: el, clientX: eX, clientY: sY });
  165 |           el.dispatchEvent(new TouchEvent('touchstart', { touches: [touch1], changedTouches: [touch1], bubbles: true }));
  166 |           el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touch2], bubbles: true }));
  167 |         }, { sX: startX, sY: startY, eX: endX });
  168 | 
  169 |         await page.waitForTimeout(900);
  170 |         await expect(title).toContainText('Une routine simple');
  171 | 
  172 |         // 15. Swipe right changes slide (Prev: slide 2 -> slide 1)
  173 |         await page.evaluate(({ sX, sY, eX }) => {
  174 |           const el = document.querySelector('.hero-carousel-container');
  175 |           const touch1 = new Touch({ identifier: 2, target: el, clientX: eX, clientY: sY });
  176 |           const touch2 = new Touch({ identifier: 2, target: el, clientX: sX, clientY: sY });
  177 |           el.dispatchEvent(new TouchEvent('touchstart', { touches: [touch1], changedTouches: [touch1], bubbles: true }));
  178 |           el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touch2], bubbles: true }));
  179 |         }, { sX: startX, sY: startY, eX: endX });
  180 | 
  181 |         await page.waitForTimeout(900);
  182 |         await expect(title).toContainText('Vos essentiels');
  183 | 
  184 |         // 21. Vertical swipe does NOT change slide
  185 |         await page.evaluate(({ sX, sY }) => {
  186 |           const el = document.querySelector('.hero-carousel-container');
  187 |           const touch1 = new Touch({ identifier: 3, target: el, clientX: sX, clientY: sY });
  188 |           const touch2 = new Touch({ identifier: 3, target: el, clientX: sX + 10, clientY: sY - 120 });
  189 |           el.dispatchEvent(new TouchEvent('touchstart', { touches: [touch1], changedTouches: [touch1], bubbles: true }));
  190 |           el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touch2], bubbles: true }));
  191 |         }, { sX: startX, sY: startY });
  192 | 
  193 |         await page.waitForTimeout(400);
  194 |         await expect(title).toContainText('Vos essentiels');
  195 | 
  196 |         // 16. Dots change slide on mobile
  197 |         await hero.locator('.hero-dot-btn').nth(2).click();
  198 |         await expect(title).toContainText('Les références');
  199 |       }
  200 | 
  201 |       // Check horizontal overflow
  202 |       const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  203 |       expect(overflow, `Overflow on mobile width ${width}`).toBeLessThanOrEqual(2);
  204 |     }
  205 | 
  206 |     expect(consoleErrors).toEqual([]);
  207 |   });
  208 | 
  209 |   test('Routes 22-25: /boutique vs /soins distinct information architecture', async ({ page }) => {
  210 |     // 22. /boutique shows all-product catalog
  211 |     await page.goto('/boutique');
  212 |     await expect(page.getByRole('heading', { level: 1 })).toContainText('Toute la boutique');
  213 |     await expect(page.locator('.product-card').first()).toBeVisible();
  214 |     await expect(page.locator('.filter-panel')).toBeAttached();
  215 | 
  216 |     // 23 & 24. /soins does NOT duplicate /boutique, but shows category gateway
  217 |     await page.goto('/soins');
  218 |     const soinsHeading = page.getByRole('heading', { level: 1, name: 'Les soins' });
```