# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hero-carousel.spec.mjs >> Hero Carousel Verification Suite >> Desktop: 1-12 hero carousel rendering, autoplay, pause, dot navigation and CTA mapping
- Location: tests\e2e\hero-carousel.spec.mjs:4:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/
Call log:
  - navigating to "http://127.0.0.1:4173/", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Hero Carousel Verification Suite', () => {
  4   |   test('Desktop: 1-12 hero carousel rendering, autoplay, pause, dot navigation and CTA mapping', async ({ page }) => {
  5   |     const consoleErrors = [];
  6   |     page.on('pageerror', (err) => consoleErrors.push(err.message));
  7   |     page.on('console', (msg) => {
  8   |       if (msg.type() === 'error') consoleErrors.push(msg.text());
  9   |     });
  10  | 
  11  |     await page.setViewportSize({ width: 1440, height: 900 });
> 12  |     await page.goto('/');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/
  13  | 
  14  |     const hero = page.locator('.hero-carousel-container');
  15  |     await expect(hero).toBeVisible();
  16  | 
  17  |     // 1. First slide renders
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
```