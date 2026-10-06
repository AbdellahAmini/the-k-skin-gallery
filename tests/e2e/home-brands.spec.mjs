import { expect, test } from '@playwright/test';

test.describe('Homepage Brands Marquee Section', () => {
  test('verifies correct homepage section order: Hero -> Brands -> Gallery Entry -> Incontournables', async ({ page }) => {
    await page.goto('/');

    const sectionTags = await page.evaluate(() => {
      const main = document.querySelector('main#top');
      if (!main) return [];
      return Array.from(main.children).map((el) => {
        return {
          tagName: el.tagName.toLowerCase(),
          className: el.className,
          id: el.id,
          headingText: el.querySelector('h1, h2')?.textContent?.trim() || '',
        };
      });
    });

    // 1. HeroCarousel (.hero-carousel)
    // 2. HomeBrandsSection (.home-brands)
    // 3. GalleryEntry (.gallery-entry)
    // 4. Incontournables (.selection-section)
    const heroIndex = sectionTags.findIndex((s) => s.className.includes('hero-carousel'));
    const brandsIndex = sectionTags.findIndex((s) => s.className.includes('home-brands'));
    const entryIndex = sectionTags.findIndex((s) => s.className.includes('gallery-entry'));
    const bestSellersIndex = sectionTags.findIndex(
      (s) => s.className.includes('selection-section') && s.headingText.includes('Nos incontournables')
    );

    expect(heroIndex).toBeGreaterThanOrEqual(0);
    expect(brandsIndex).toBe(heroIndex + 1);
    expect(entryIndex).toBe(brandsIndex + 1);
    expect(bestSellersIndex).toBe(entryIndex + 1);

    // Old brand-strip must NOT exist anywhere
    const oldBrandStrip = await page.locator('.brand-strip').count();
    expect(oldBrandStrip).toBe(0);
  });

  test('verifies desktop brand marquee appearance, logos, links and seamless animation', async ({ page }) => {
    for (const width of [1024, 1280, 1440, 1600]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');

      const brandsSection = page.locator('.home-brands');
      await expect(brandsSection).toBeVisible();

      // Heading and eyebrow
      const heading = brandsSection.locator('.home-brands__heading');
      await expect(heading).toContainText('Nos marques coréennes');
      const eyebrow = brandsSection.locator('.home-brands__eyebrow');
      await expect(eyebrow).toContainText('LA SÉLECTION DE LA GALLERY');

      // Decorative rose vertical line
      const accent = brandsSection.locator('.home-brands__heading-accent');
      await expect(accent).toBeVisible();

      // CTA link
      const cta = brandsSection.locator('.home-brands__cta');
      await expect(cta).toBeVisible();
      await expect(cta).toHaveAttribute('href', '/marques');

      // Marquee tracks
      const marqueeTrack = brandsSection.locator('.home-brands__marquee-track');
      await expect(marqueeTrack).toBeVisible();

      const groups = brandsSection.locator('.home-brands__marquee-group');
      await expect(groups).toHaveCount(2);

      // Accessibility: second group is aria-hidden
      await expect(groups.nth(1)).toHaveAttribute('aria-hidden', 'true');

      // Links in second group must have tabIndex = -1
      const duplicateLinks = groups.nth(1).locator('.home-brands__logo-item');
      const count = await duplicateLinks.count();
      expect(count).toBeGreaterThan(5);
      for (let i = 0; i < Math.min(count, 4); i++) {
        await expect(duplicateLinks.nth(i)).toHaveAttribute('tabindex', '-1');
      }

      // First track links are interactive
      const trackALinks = groups.nth(0).locator('.home-brands__logo-item');
      await expect(trackALinks.first()).toBeVisible();

      // Ensure logos render without broken image
      const images = groups.nth(0).locator('.home-brands__logo-img');
      const imgCount = await images.count();
      expect(imgCount).toBeGreaterThan(0);

      // Verify no naturalWidth === 0
      const brokenImages = await images.evaluateAll((imgs) =>
        imgs.filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.src)
      );
      expect(brokenImages).toEqual([]);

      // Check overflow
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `Overflow at ${width}px`).toBeLessThanOrEqual(2);
    }
  });

  test('verifies brand navigation clicks (ANUA, COSRX, Voir toutes les marques)', async ({ page }) => {
    await page.goto('/');

    // 1. Click ANUA
    const anuaLink = page.locator('.home-brands__marquee-group').first().locator('a[href="/marques/anua"]');
    await expect(anuaLink).toBeVisible();
    await anuaLink.click({ force: true });
    await expect(page).toHaveURL(/\/marques\/anua/);

    // 2. Back and click COSRX
    await page.goto('/');
    const cosrxLink = page.locator('.home-brands__marquee-group').first().locator('a[href="/marques/cosrx"]');
    await expect(cosrxLink).toBeVisible();
    await cosrxLink.click({ force: true });
    await expect(page).toHaveURL(/\/marques\/cosrx/);

    // 3. Back and click "Voir toutes les marques"
    await page.goto('/');
    const seeAllLink = page.locator('.home-brands__cta');
    await expect(seeAllLink).toBeVisible();
    await seeAllLink.click();
    await expect(page).toHaveURL(/\/marques$/);
  });

  test('verifies mobile viewports (375, 390, 430px)', async ({ page }) => {
    for (const width of [375, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/');

      const brandsSection = page.locator('.home-brands');
      await expect(brandsSection).toBeVisible();

      const heading = brandsSection.locator('.home-brands__heading');
      await expect(heading).toBeVisible();
      await expect(heading).toContainText('Nos marques coréennes');

      const cta = brandsSection.locator('.home-brands__cta');
      await expect(cta).toBeVisible();
      // On mobile, short label "Voir tout" is visible
      const shortText = cta.locator('.home-brands__cta-text-short');
      await expect(shortText).toBeVisible();

      // Marquee track exists and is running
      const track = brandsSection.locator('.home-brands__marquee-track');
      await expect(track).toBeVisible();

      // Check no horizontal scroll on body
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `Mobile overflow at ${width}px`).toBeLessThanOrEqual(2);

      // Check next section starts cleanly
      const entrySection = page.locator('.gallery-entry');
      await expect(entrySection).toBeVisible();
    }
  });

  test('verifies reduced motion fallback disables animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const track = page.locator('.home-brands__marquee-track');
    await expect(track).toBeVisible();

    const animationName = await track.evaluate((el) => window.getComputedStyle(el).animationName);
    expect(animationName).toBe('none');
  });
});
