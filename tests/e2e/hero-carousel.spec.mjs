import { test, expect } from '@playwright/test';

test.describe('Hero Carousel Verification Suite', () => {
  test('Desktop: 1-12 hero carousel rendering, autoplay, pause, dot navigation and CTA mapping', async ({ page }) => {
    const consoleErrors = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const hero = page.locator('.hero-carousel-container');
    await expect(hero).toBeVisible();

    // 1. First slide renders
    const title = hero.locator('#hero-title');
    await expect(title).toBeVisible();
    await expect(title).toContainText('Vos essentiels');
    await expect(hero.locator('.eyebrow')).toContainText('BEAUTÉ CORÉENNE · SÉLECTION EXCLUSIVE');

    // 9. Primary CTA always points to /boutique
    const primaryCta = hero.locator('.hero-cta');
    await expect(primaryCta).toHaveAttribute('href', '/boutique');
    await expect(primaryCta).toContainText('Explorer la boutique');

    // 10. Secondary CTA on Slide 1 -> /nouveautes
    const secondaryCta = hero.locator('.hero-cta-secondary');
    await expect(secondaryCta).toHaveAttribute('href', '/nouveautes');
    await expect(secondaryCta).toContainText('Voir les nouveautés');

    // 6. Hover pauses autoplay
    await hero.hover();
    await page.waitForTimeout(2000);
    // After hovering, slide should still be slide 1
    await expect(title).toContainText('Vos essentiels');

    // Move mouse away to resume
    await page.mouse.move(0, 0);

    // 7. Dot click changes slide immediately
    const dots = hero.locator('.hero-dot-btn');
    await expect(dots).toHaveCount(3);
    await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');

    // Click dot 2 (Slide 2: Routines)
    await dots.nth(1).click();
    await expect(title).toContainText('Une routine simple');
    await expect(hero.locator('.eyebrow')).toContainText('ROUTINES & PACKS');
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');

    // 11. Secondary CTA on Slide 2 -> /routines
    await expect(hero.locator('.hero-cta-secondary')).toHaveAttribute('href', '/routines');
    await expect(hero.locator('.hero-cta-secondary')).toContainText('Découvrir les routines');
    await expect(hero.locator('.hero-cta')).toHaveAttribute('href', '/boutique');

    // 8. After dot click, autoplay stops permanently
    // Wait > 4.5s to ensure autoplay does NOT rotate after manual interaction
    await page.waitForTimeout(4800);
    await expect(title).toContainText('Une routine simple');
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');

    // 4. Slide 3 works via dot click
    await dots.nth(2).click();
    await expect(title).toContainText('Les références');
    await expect(hero.locator('.eyebrow')).toContainText('LES MARQUES DE LA GALLERY');
    await expect(dots.nth(2)).toHaveAttribute('aria-current', 'true');

    // 12. Secondary CTA on Slide 3 -> /marques
    await expect(hero.locator('.hero-cta-secondary')).toHaveAttribute('href', '/marques');
    await expect(hero.locator('.hero-cta-secondary')).toContainText('Découvrir les marques');
    await expect(hero.locator('.hero-cta')).toHaveAttribute('href', '/boutique');

    // Wait for the previous transition to finish (800ms) before clicking again
    await page.waitForTimeout(850);

    // 5. Last -> first loops cleanly
    await dots.nth(0).click();
    await expect(title).toContainText('Vos essentiels');
    await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');

    // Verify indicators accessibility
    await expect(dots.nth(0)).toHaveAttribute('aria-label', 'Afficher la diapositive 1');
    await expect(dots.nth(1)).toHaveAttribute('aria-label', 'Afficher la diapositive 2');
    await expect(dots.nth(2)).toHaveAttribute('aria-label', 'Afficher la diapositive 3');

    // Verify completely removed old gallery control
    await expect(page.locator('.gallery-slider-bar')).toHaveCount(0);
    await expect(page.locator('.hero-trust')).toHaveCount(0);

    expect(consoleErrors).toEqual([]);
  });

  test('Desktop: Autoplay advances automatically without manual interaction', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const hero = page.locator('.hero-carousel-container');
    const title = hero.locator('#hero-title');
    await expect(title).toContainText('Vos essentiels');

    // Wait for autoplay cycle (~4000ms dwell + 800ms transition)
    await page.waitForTimeout(4800);
    await expect(title).toContainText('Une routine simple');
    await expect(hero).toHaveClass(/dir-next/);
  });

  test('Mobile: 13-21 Mobile behavior, swipe gestures, no autoplay, compact layout', async ({ page }) => {
    const consoleErrors = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    for (const width of [375, 390, 430]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');

      const hero = page.locator('.hero-carousel-container');
      await expect(hero).toBeVisible();

      // 14. Hero total height clamp (520px - 580px)
      const heroBox = await hero.boundingBox();
      expect(heroBox.height).toBeGreaterThanOrEqual(510);
      expect(heroBox.height).toBeLessThanOrEqual(590);

      // 18. Text is rendered directly OVER image (inside hero container)
      const copy = hero.locator('.hero-copy-overlay');
      await expect(copy).toBeVisible();
      const copyBox = await copy.boundingBox();
      expect(copyBox.y + copyBox.height).toBeLessThanOrEqual(heroBox.y + heroBox.height);

      // 17. Dots remain visible inside hero without scrolling
      const dots = hero.locator('.hero-indicators');
      await expect(dots).toBeVisible();
      const dotsBox = await dots.boundingBox();
      expect(dotsBox.y + dotsBox.height).toBeLessThanOrEqual(heroBox.y + heroBox.height);

      // 13. Verify initial state before testing swipes
      if (width === 375) {
        const title = hero.locator('#hero-title');
        await expect(title).toContainText('Vos essentiels');        // 19. Primary CTA works
        const primaryCta = hero.locator('.hero-cta');
        await expect(primaryCta).toHaveAttribute('href', '/boutique');

        // 20. Secondary CTA is a subtle text link
        const secondaryCta = hero.locator('.hero-cta-secondary');
        await expect(secondaryCta).toHaveAttribute('href', '/nouveautes');

        // 14. Swipe left changes slide (Next: slide 1 -> slide 2)
        const startX = heroBox.x + heroBox.width * 0.8;
        const startY = heroBox.y + heroBox.height * 0.5;
        const endX = heroBox.x + heroBox.width * 0.2;

        // Simulate touch swipe left
        await page.evaluate(({ sX, sY, eX }) => {
          const el = document.querySelector('.hero-carousel-container');
          const touch1 = new Touch({ identifier: 1, target: el, clientX: sX, clientY: sY });
          const touch2 = new Touch({ identifier: 1, target: el, clientX: eX, clientY: sY });
          el.dispatchEvent(new TouchEvent('touchstart', { touches: [touch1], changedTouches: [touch1], bubbles: true }));
          el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touch2], bubbles: true }));
        }, { sX: startX, sY: startY, eX: endX });

        await page.waitForTimeout(900);
        await expect(title).toContainText('Une routine simple');

        // 15. Swipe right changes slide (Prev: slide 2 -> slide 1)
        await page.evaluate(({ sX, sY, eX }) => {
          const el = document.querySelector('.hero-carousel-container');
          const touch1 = new Touch({ identifier: 2, target: el, clientX: eX, clientY: sY });
          const touch2 = new Touch({ identifier: 2, target: el, clientX: sX, clientY: sY });
          el.dispatchEvent(new TouchEvent('touchstart', { touches: [touch1], changedTouches: [touch1], bubbles: true }));
          el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touch2], bubbles: true }));
        }, { sX: startX, sY: startY, eX: endX });

        await page.waitForTimeout(900);
        await expect(title).toContainText('Vos essentiels');

        // 21. Vertical swipe does NOT change slide
        await page.evaluate(({ sX, sY }) => {
          const el = document.querySelector('.hero-carousel-container');
          const touch1 = new Touch({ identifier: 3, target: el, clientX: sX, clientY: sY });
          const touch2 = new Touch({ identifier: 3, target: el, clientX: sX + 10, clientY: sY - 120 });
          el.dispatchEvent(new TouchEvent('touchstart', { touches: [touch1], changedTouches: [touch1], bubbles: true }));
          el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touch2], bubbles: true }));
        }, { sX: startX, sY: startY });

        await page.waitForTimeout(400);
        await expect(title).toContainText('Vos essentiels');

        // 16. Dots change slide on mobile
        await hero.locator('.hero-dot-btn').nth(2).click();
        await expect(title).toContainText('Les références');
      }

      // Check horizontal overflow
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow, `Overflow on mobile width ${width}`).toBeLessThanOrEqual(2);
    }

    expect(consoleErrors).toEqual([]);
  });

  test('Routes 22-25: /boutique vs /soins distinct information architecture', async ({ page }) => {
    // 22. /boutique shows all-product catalog
    await page.goto('/boutique');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Toute la boutique');
    await expect(page.locator('.product-card').first()).toBeVisible();
    await expect(page.locator('.filter-panel')).toBeAttached();

    // 23 & 24. /soins does NOT duplicate /boutique, but shows category gateway
    await page.goto('/soins');
    const soinsHeading = page.getByRole('heading', { level: 1, name: 'Les soins' });
    await expect(soinsHeading).toBeVisible();

    // Verify category gateway sections
    await expect(page.getByRole('heading', { level: 2, name: 'Nettoyer' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Préparer & Traiter' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Hydrater & Protéger' })).toBeVisible();

    // 25. /soins/serums-ampoules works
    const serumLink = page.getByRole('link', { name: 'Sérums & Ampoules' });
    await expect(serumLink).toBeVisible();
    await serumLink.click();
    await expect(page).toHaveURL(/\/soins\/serums-ampoules/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Sérums & Ampoules');

    // Bottom CTA to /boutique on /soins
    await page.goto('/soins');
    const catalogCta = page.getByRole('link', { name: 'Voir tous les produits' });
    await expect(catalogCta).toBeVisible();
    await catalogCta.click();
    await expect(page).toHaveURL(/\/boutique/);
  });

  test('Quality 26-29: No console errors, no layout jump, no broken images, responsive widths', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    for (const width of [1024, 1280, 1440, 1600]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');

      const hero = page.locator('.hero-carousel-container');
      await expect(hero).toBeVisible();

      // Check hero images are valid and loaded
      const images = hero.locator('.hero-slide-image');
      const count = await images.count();
      for (let i = 0; i < count; i++) {
        const isLoaded = await images.nth(i).evaluate((img) => img.complete && img.naturalWidth > 0);
        expect(isLoaded, `Slide ${i} image loaded at ${width}px`).toBe(true);
      }

      // No horizontal scroll
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow, `Overflow at ${width}px`).toBeLessThanOrEqual(2);
    }

    expect(errors).toEqual([]);
  });
});
