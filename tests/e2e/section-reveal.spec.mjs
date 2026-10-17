import { expect, test } from '@playwright/test';

test.describe('Section reveal motion', () => {
  test('keeps the first screen available and reveals later sections as one group', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');

    const hero = page.locator('main#top > .hero-carousel-container');
    const brands = page.locator('.home-brands');
    const entry = page.locator('.gallery-entry');
    await expect(hero).toBeVisible();
    await expect(brands).toBeVisible();
    await expect(entry).toBeVisible();
    expect(await page.locator('main#top').evaluate((main) => [...main.children]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < innerHeight;
      })
      .every((element) => Number(getComputedStyle(element).opacity) > 0))).toBe(true);

    const section = page.locator('.home-guided');
    await expect(section).toHaveClass(/section-reveal-pending/);
    await expect(page.locator('.product-card.section-reveal-pending, .product-card.section-reveal-visible')).toHaveCount(0);
    const startOffset = await section.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42);
    expect(startOffset).toBeCloseTo(82, 0);
    await section.evaluate((element) => {
      window.__galleryRevealStart = null;
      element.addEventListener('animationstart', (event) => {
        window.__galleryRevealStart = {
          name: event.animationName,
          duration: getComputedStyle(element).animationDuration,
        };
      }, { once: true });
    });
    await section.evaluate((element) => element.scrollIntoView({ behavior: 'instant', block: 'start' }));
    await expect.poll(() => page.evaluate(() => window.__galleryRevealStart?.name)).toBe('gallery-section-reveal');
    expect(await page.evaluate(() => window.__galleryRevealStart.duration)).toBe('0.9s');
    const cardDelays = await page.locator('.home-guided-grid > *').evaluateAll((cards) =>
      cards.map((card) => getComputedStyle(card).animationDelay));
    expect(cardDelays).toEqual(['0s', '0.08s', '0.16s', '0.24s']);
    await expect(section).not.toHaveClass(/section-reveal-pending/);
    expect(await section.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
  });

  test('applies reduced motion immediately and preserves the mobile filter overlay', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await expect.poll(() => page.locator('.section-reveal-pending').count()).toBeGreaterThan(0);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('.section-reveal-pending')).toHaveCount(0);
    expect(await page.locator('main').evaluate((main) =>
      [...main.children].filter((element) => getComputedStyle(element).opacity === '0').length
    )).toBe(0);

    await page.goto('/boutique');
    await expect(page.getByRole('heading', { name: 'Toute la boutique' })).toBeVisible();
    await expect(page.locator('.section-reveal-pending')).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('.filter-toggle').click();

    const filterPanel = page.locator('.filter-panel.open');
    await expect(filterPanel).toBeVisible();
    expect(await filterPanel.evaluate((element) => getComputedStyle(element).position)).toBe('fixed');
    expect(await page.locator('.collection-layout').evaluate((element) => getComputedStyle(element).transform)).toBe('none');
  });

  test('cleans up and reinitializes across lazy route changes and browser history', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Navigation principale' })
      .getByRole('link', { name: 'Marques' }).click();
    await expect(page).toHaveURL(/\/marques$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.locator('main').evaluate((main) => [...main.children].filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < innerHeight && getComputedStyle(element).opacity === '0';
    }).length)).toBe(0);

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('main#top > .hero-carousel-container')).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL(/\/marques$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('does not leave a section hidden during quick, large scroll steps', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);

    for (let y = 400; y < pageHeight; y += 500) {
      await page.evaluate((scrollY) => new Promise((resolve) => {
        window.scrollTo({ top: scrollY, behavior: 'instant' });
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }), y);
      const waitingInViewport = await page.locator('main#top > .section-reveal-pending:not(.section-reveal-visible)').evaluateAll((elements) =>
        elements.filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.bottom > 0 && rect.top < innerHeight;
        }).length
      );
      expect(waitingInViewport, `a section remained hidden at scroll position ${y}`).toBe(0);
    }
  });
});
