import { expect, test } from '@playwright/test';

test.describe('Homepage brand section', () => {
  test('preserves the desktop homepage section order', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('.home-brands')).toBeVisible();
    const sectionOrder = await page.locator('main#top > *').evaluateAll((sections) => sections.map((section) => {
      if (section.matches('.hero-carousel-container')) return 'hero';
      if (section.matches('.home-brands')) return 'brands';
      if (section.matches('.gallery-entry')) return 'discovery';
      if (section.matches('.home-promotions')) return 'promotions';
      if (section.matches('.home-new-arrivals')) return 'new-arrivals';
      if (section.matches('.home-guided')) return 'routines';
      if (section.matches('.bottom-trust')) return 'trust';
      return section.className;
    }));

    const hero = sectionOrder.indexOf('hero');
    expect(hero).toBeGreaterThanOrEqual(0);
    expect(sectionOrder[hero + 1]).toBe('brands');
    expect(sectionOrder[hero + 2]).toBe('discovery');
    expect(sectionOrder[hero + 3]).toBe('promotions');
    const noveltyIndex = sectionOrder.indexOf('new-arrivals');
    if (noveltyIndex !== -1) expect(noveltyIndex).toBe(hero + 4);
    expect(sectionOrder.indexOf('routines')).toBeGreaterThan(sectionOrder.indexOf('promotions'));
    expect(sectionOrder.at(-1)).toBe('trust');
    expect(await page.locator('.brand-strip').count()).toBe(0);
    await expect(page.locator('.home-mobile-featured')).toBeHidden();
  });

  test('normalizes the brand marquee, links, and decorative heading', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const section = page.locator('.home-brands');
    await expect(section).toBeVisible();
    await expect(section.locator('.home-brands__heading')).toContainText('Nos marques coréennes');
    const eyebrow = section.locator('.home-brands__eyebrow');
    await expect(eyebrow).toContainText(/la sélection de la gallery/i);
    expect(await eyebrow.evaluate((element) => getComputedStyle(element).textTransform)).toBe('uppercase');
    await expect(section.locator('.home-section-title__accent')).toBeVisible();
    const seeAll = section.locator('.home-brands__cta');
    await expect(seeAll).toHaveAttribute('href', '/marques');
    await expect(seeAll.locator('.home-section-link__full')).toBeVisible();

    const groups = section.locator('.home-brands__marquee-group');
    await expect(groups).toHaveCount(2);
    await expect(groups.nth(1)).toHaveAttribute('aria-hidden', 'true');
    const duplicates = groups.nth(1).locator('.home-brands__logo-item');
    expect(await duplicates.count()).toBeGreaterThan(5);
    await expect(duplicates.first()).toHaveAttribute('tabindex', '-1');
    const logos = groups.first().locator('.home-brands__logo-item');
    await expect(logos.first()).toHaveAttribute('href', /\/marques\//);
    const brokenImages = await groups.first().locator('.home-brands__logo-img').evaluateAll((images) =>
      images.filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.src));
    expect(brokenImages).toEqual([]);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  });

  test('brand and directory links navigate to their destinations', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.home-brands__logo-item[href="/marques/anua"]').first()).toBeAttached();
    await page.locator('.home-brands__logo-item[href="/marques/anua"]').first().evaluate((link) => link.click());
    await expect(page).toHaveURL(/\/marques\/anua$/);

    await page.goto('/');
    await page.locator('.home-brands__logo-item[href="/marques/cosrx"]').first().evaluate((link) => link.click());
    await expect(page).toHaveURL(/\/marques\/cosrx$/);

    await page.goto('/');
    await page.locator('.home-brands__cta').evaluate((link) => link.click());
    await expect(page).toHaveURL(/\/marques$/);
  });

  test('mobile brands stay directly below hero with a calm marquee and compact CTA', async ({ page }) => {
    for (const width of [375, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/');
      const section = page.locator('.home-brands');
      await expect(section).toBeVisible();
      await expect(section.locator('.home-brands__heading')).toBeVisible();
      const cta = section.locator('.home-brands__cta');
      await expect(cta.locator('.home-section-link__short')).toBeVisible();
      const marquee = section.locator('.home-brands__marquee-track');
      await expect(marquee).toBeVisible();
      const duration = await marquee.evaluate((element) => Number.parseFloat(getComputedStyle(element).animationDuration));
      expect(duration).toBeGreaterThanOrEqual(38);
      expect(duration).toBeLessThanOrEqual(50);

      const relation = await page.evaluate(() => {
        const hero = document.querySelector('.hero-carousel-container').getBoundingClientRect();
        const brands = document.querySelector('.home-brands').getBoundingClientRect();
        return { heroBottom: hero.bottom, brandsTop: brands.top, overflow: document.documentElement.scrollWidth - innerWidth };
      });
      expect(relation.brandsTop).toBeGreaterThanOrEqual(relation.heroBottom - 1);
      expect(relation.overflow).toBeLessThanOrEqual(0);
      await expect(page.locator('.gallery-entry')).toBeAttached();
    }
  });

  test('reduced motion disables the brand animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const track = page.locator('.home-brands__marquee-track');
    await expect(track).toBeVisible();
    expect(await track.evaluate((element) => getComputedStyle(element).animationName)).toBe('none');
  });
});
