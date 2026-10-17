import { expect, test } from '@playwright/test';

const productPath = '/produits/anua-heartleaf-pore-control-cleansing-oil-mild-200ml-0006';
const storefrontPaths = [
  '/',
  '/boutique',
  '/recherche?q=Anua',
  '/marques',
  '/soins',
  '/peau',
  '/routines',
  '/packs',
  '/promotions',
  productPath,
  '/panier',
  '/checkout',
  '/compte',
];

test.setTimeout(120000);

async function openRenderedPage(page, path) {
  await page.goto(path);
  await expect(page.locator('main:not([aria-label="Chargement de la page"])')).toBeVisible();
}

test('storefront routes fit mobile and desktop without overflow or native buttons', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
    for (const path of storefrontPaths) {
      await openRenderedPage(page, path);
      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        unstyledButtons: [...document.querySelectorAll('main button:not(.ui-button)')].length,
        brokenImages: [...document.querySelectorAll('img')].filter((image) => image.complete && image.naturalWidth === 0).length,
        mobileHeader: (() => {
          const header = document.querySelector('.header-main')?.getBoundingClientRect();
          const search = document.querySelector('.mobile-search-toggle')?.getBoundingClientRect();
          const cart = document.querySelector('.header-actions > .header-action:last-child')?.getBoundingClientRect();
          return header && search && cart ? { headerBottom: header.bottom, searchTop: search.top, cartTop: cart.top, cartBottom: cart.bottom } : null;
        })(),
      }));
      expect(metrics.overflow, `${path} overflow at ${width}px`).toBeLessThanOrEqual(2);
      expect(metrics.unstyledButtons, `${path} native buttons at ${width}px`).toBe(0);
      expect(metrics.brokenImages, `${path} broken loaded images at ${width}px`).toBe(0);
      if (path === '/' && width <= 760) {
        expect(Math.abs(metrics.mobileHeader.searchTop - metrics.mobileHeader.cartTop), `header actions alignment at ${width}px`).toBeLessThanOrEqual(1);
        expect(metrics.mobileHeader.cartBottom, `cart stays in the mobile header at ${width}px`).toBeLessThanOrEqual(metrics.mobileHeader.headerBottom + 1);
      }
      if (['/boutique', '/recherche?q=Anua', '/promotions'].includes(path)) {
        await expect(page.locator('.product-card').first()).toBeVisible();
      }
      if (path === productPath) await expect(page.locator('.product-details')).toBeVisible();
      if (path === '/packs') await expect(page.locator('.pack-tile').first()).toBeVisible();
    }
  }

  for (const width of [375, 430, 768, 1024]) {
    await page.setViewportSize({ width, height: width <= 430 ? 844 : 900 });
    for (const path of ['/', '/boutique', '/recherche?q=Anua', '/promotions']) {
      await openRenderedPage(page, path);
      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        hero: document.querySelector('.hero-carousel-container')?.getBoundingClientRect().height ?? null,
        header: (() => {
          const main = document.querySelector('.header-main')?.getBoundingClientRect();
          const search = document.querySelector('.mobile-search-toggle')?.getBoundingClientRect();
          const cart = document.querySelector('.header-actions > .header-action:last-child')?.getBoundingClientRect();
          return main && search && cart ? { bottom: main.bottom, searchTop: search.top, cartTop: cart.top, cartBottom: cart.bottom } : null;
        })(),
      }));
      expect(metrics.overflow, `${path} overflow at ${width}px`).toBeLessThanOrEqual(2);
      if (path === '/' && width <= 760) {
        expect(metrics.hero, `mobile hero height at ${width}px`).toBeGreaterThanOrEqual(500);
        expect(metrics.hero, `mobile hero height at ${width}px`).toBeLessThanOrEqual(550);
        expect(Math.abs(metrics.header.searchTop - metrics.header.cartTop), `header actions alignment at ${width}px`).toBeLessThanOrEqual(1);
        expect(metrics.header.cartBottom, `cart stays in the mobile header at ${width}px`).toBeLessThanOrEqual(metrics.header.bottom + 1);
      }
    }
  }

  expect(errors).toEqual([]);
});

test('mobile search and filter controls share the Gallery button system', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openRenderedPage(page, '/recherche?q=Anua');
  await expect(page.locator('.search-page-form')).toBeVisible();
  const submit = page.locator('.search-page-form').getByRole('button', { name: 'Rechercher' });
  await expect(submit).toHaveClass(/ui-button--primary/);
  expect(await submit.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  await expect(page.locator('.quick-pills')).toBeVisible();
  await expect(page.locator('.collection-toolbar-controls .filter-toggle')).toBeVisible();
  await expect(page.locator('.collection-sort-control select')).toBeVisible();
  const chips = await page.locator('.quick-pills').evaluate((element) => ({
    overflowX: getComputedStyle(element).overflowX,
    hasScrollableContent: element.scrollWidth > element.clientWidth,
  }));
  expect(chips.overflowX).toBe('auto');
  expect(chips.hasScrollableContent).toBe(true);

  await page.goto('/boutique');
  await expect(page.locator('.product-card').first()).toBeVisible();
  await page.getByRole('button', { name: /Filtrer/ }).click();
  const filterPanel = page.locator('.filter-panel');
  await expect(filterPanel).toHaveClass(/open/);
  const promotion = filterPanel.locator('.promotion-filter-card');
  await expect(promotion).toHaveAttribute('aria-pressed', 'false');
  await promotion.click();
  await expect(page).toHaveURL(/promotion=true/);
  await expect(filterPanel).not.toHaveClass(/open/);

  await page.getByRole('button', { name: /Filtrer/ }).click();
  await expect(filterPanel).toHaveClass(/open/);
  await expect(filterPanel.locator('.promotion-filter-card')).toHaveAttribute('aria-pressed', 'true');
  await filterPanel.locator('.promotion-filter-card').click();
  await expect(filterPanel).toHaveClass(/open/);
  await expect(filterPanel.locator('.promotion-filter-card')).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: /Afficher \d+ produits/ }).click();
  await expect(page).not.toHaveURL(/promotion=true/);
});
