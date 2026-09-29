# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hero-carousel.spec.mjs >> Hero Carousel Verification Suite >> Routes 22-25: /boutique vs /soins distinct information architecture
- Location: tests\e2e\hero-carousel.spec.mjs:209:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/boutique
Call log:
  - navigating to "http://127.0.0.1:4173/boutique", waiting until "load"

```

# Test source

```ts
  111 |     page.on('pageerror', (err) => consoleErrors.push(err.message));
  112 |     page.on('console', (msg) => {
  113 |       if (msg.type() === 'error') consoleErrors.push(msg.text());
  114 |     });
  115 | 
  116 |     for (const width of [375, 390, 430]) {
  117 |       await page.setViewportSize({ width, height: 800 });
  118 |       await page.goto('/');
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
> 211 |     await page.goto('/boutique');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/boutique
  212 |     await expect(page.getByRole('heading', { level: 1 })).toContainText('Toute la boutique');
  213 |     await expect(page.locator('.product-card').first()).toBeVisible();
  214 |     await expect(page.locator('.filter-panel')).toBeAttached();
  215 | 
  216 |     // 23 & 24. /soins does NOT duplicate /boutique, but shows category gateway
  217 |     await page.goto('/soins');
  218 |     const soinsHeading = page.getByRole('heading', { level: 1, name: 'Les soins' });
  219 |     await expect(soinsHeading).toBeVisible();
  220 | 
  221 |     // Verify category gateway sections
  222 |     await expect(page.getByRole('heading', { level: 2, name: 'Nettoyer' })).toBeVisible();
  223 |     await expect(page.getByRole('heading', { level: 2, name: 'Préparer & Traiter' })).toBeVisible();
  224 |     await expect(page.getByRole('heading', { level: 2, name: 'Hydrater & Protéger' })).toBeVisible();
  225 | 
  226 |     // 25. /soins/serums-ampoules works
  227 |     const serumLink = page.getByRole('link', { name: 'Sérums & Ampoules' });
  228 |     await expect(serumLink).toBeVisible();
  229 |     await serumLink.click();
  230 |     await expect(page).toHaveURL(/\/soins\/serums-ampoules/);
  231 |     await expect(page.getByRole('heading', { level: 1 })).toContainText('Sérums & Ampoules');
  232 | 
  233 |     // Bottom CTA to /boutique on /soins
  234 |     await page.goto('/soins');
  235 |     const catalogCta = page.getByRole('link', { name: 'Voir tous les produits' });
  236 |     await expect(catalogCta).toBeVisible();
  237 |     await catalogCta.click();
  238 |     await expect(page).toHaveURL(/\/boutique/);
  239 |   });
  240 | 
  241 |   test('Quality 26-29: No console errors, no layout jump, no broken images, responsive widths', async ({ page }) => {
  242 |     const errors = [];
  243 |     page.on('pageerror', (err) => errors.push(err.message));
  244 |     page.on('console', (msg) => {
  245 |       if (msg.type() === 'error') errors.push(msg.text());
  246 |     });
  247 | 
  248 |     for (const width of [1024, 1280, 1440, 1600]) {
  249 |       await page.setViewportSize({ width, height: 900 });
  250 |       await page.goto('/');
  251 | 
  252 |       const hero = page.locator('.hero-carousel-container');
  253 |       await expect(hero).toBeVisible();
  254 | 
  255 |       // Check hero images are valid and loaded
  256 |       const images = hero.locator('.hero-slide-image');
  257 |       const count = await images.count();
  258 |       for (let i = 0; i < count; i++) {
  259 |         const isLoaded = await images.nth(i).evaluate((img) => img.complete && img.naturalWidth > 0);
  260 |         expect(isLoaded, `Slide ${i} image loaded at ${width}px`).toBe(true);
  261 |       }
  262 | 
  263 |       // No horizontal scroll
  264 |       const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  265 |       expect(overflow, `Overflow at ${width}px`).toBeLessThanOrEqual(2);
  266 |     }
  267 | 
  268 |     expect(errors).toEqual([]);
  269 |   });
  270 | });
  271 | 
```