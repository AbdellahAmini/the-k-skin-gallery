import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const screenshots = join(process.cwd(), 'test-results', 'homepage-mobile-refinement');
const sizes = [
  { width: 375, height: 667, label: '375' },
  { width: 390, height: 844, label: '390' },
  { width: 430, height: 932, label: '430' },
  { width: 768, height: 1024, label: '768' },
  { width: 1024, height: 900, label: '1024' },
  { width: 1440, height: 900, label: '1440' },
];

test.setTimeout(120000);

test('homepage responsive screenshots at the requested widths', async ({ page }) => {
  await mkdir(screenshots, { recursive: true });
  for (const size of sizes) {
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.goto('/');
    await expect(page.locator('.hero-carousel-container')).toBeVisible();
    await expect(page.locator('.home-brands')).toBeVisible();
    await page.waitForTimeout(250);
    await page.screenshot({ path: join(screenshots, `${size.label}-top.png`), animations: 'disabled' });

    await page.evaluate(() => window.scrollTo(0, Math.max(0, (document.documentElement.scrollHeight - innerHeight) / 2)));
    await page.waitForTimeout(850);
    await page.screenshot({ path: join(screenshots, `${size.label}-middle.png`), animations: 'disabled' });

    await page.evaluate(() => { document.documentElement.scrollTop = document.documentElement.scrollHeight; });
    await page.waitForTimeout(850);
    await page.screenshot({ path: join(screenshots, `${size.label}-bottom.png`), animations: 'disabled' });
  }
});

test('mobile homepage sections, rails, products, and footer are usable at 375, 390, and 430px', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

  for (const width of [375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await expect(page.locator('.home-mobile-featured .product-card')).toHaveCount(4, { timeout: 15000 });
    const metrics = await page.evaluate(() => {
      const box = (selector) => document.querySelector(selector)?.getBoundingClientRect();
      const hero = box('.hero-carousel-container');
      const brands = box('.home-brands');
      const marquee = document.querySelector('.home-brands__marquee');
      const track = document.querySelector('.home-brands__marquee-track');
      const entryRail = document.querySelector('.gallery-entry-grid');
      const entryCards = [...document.querySelectorAll('.gallery-entry-card')];
      const routineRail = document.querySelector('.home-guided-grid');
      const routineCards = [...document.querySelectorAll('.home-guided-card')];
      const railBounds = (rail) => { const rect = rail.getBoundingClientRect(); return { left: rect.left, right: rect.right, width: rail.clientWidth, scrollWidth: rail.scrollWidth }; };
      const featured = document.querySelector('.home-mobile-featured');
      const featuredGrid = featured?.querySelector('.product-grid');
      const newArrivals = document.querySelector('.home-new-arrivals');
      const products = [...(featuredGrid?.querySelectorAll('.product-card') || [])];
      const promos = [...document.querySelectorAll('.home-promotions .product-card')];
      const getDisplay = (element) => element ? getComputedStyle(element).display : 'absent';
      const getColumnCount = (element) => element ? getComputedStyle(element).gridTemplateColumns.split(' ').length : 0;
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        heroBottom: hero?.bottom,
        brandsTop: brands?.top,
        logoDuration: track ? Number.parseFloat(getComputedStyle(track).animationDuration) : 0,
        logoWidth: marquee?.clientWidth,
        visibleLogos: [...document.querySelectorAll('.home-brands__logo-item')].filter((logo) => {
          const rect = logo.getBoundingClientRect();
          return rect.right > 0 && rect.left < innerWidth;
        }).length,
        logoImagesReady: [...document.querySelectorAll('.home-brands__logo-img')].every((image) => image.complete && image.naturalWidth > 0),
        entryDisplay: getDisplay(entryRail),
        entryRailBounds: railBounds(entryRail),
        entryRects: entryCards.map((card) => { const rect = card.getBoundingClientRect(); return { left: rect.left, right: rect.right, width: rect.width }; }),
        featuredVisible: !!featured && getComputedStyle(featured).display !== 'none',
        newArrivalsHidden: !newArrivals || getComputedStyle(newArrivals).display === 'none',
        productColumns: getColumnCount(featuredGrid),
        productWidths: products.slice(0, 2).map((card) => card.getBoundingClientRect().width),
        productImageHeights: products.slice(0, 2).map((card) => card.querySelector('.product-image-area')?.getBoundingClientRect().height || 0),
        promotionVisible: promos.filter((card) => getComputedStyle(card).display !== 'none').length,
        promotionHasBadge: promos.some((card) => !!card.querySelector('.product-note--promotion')),
        routineDisplay: getDisplay(routineRail),
        routineRailBounds: railBounds(routineRail),
        routineRects: routineCards.map((card) => { const rect = card.getBoundingClientRect(); return { left: rect.left, right: rect.right, width: rect.width }; }),
        trustItems: document.querySelectorAll('.bottom-trust > div').length,
        footerLogoWidth: document.querySelector('.full-footer .footer-brand')?.getBoundingClientRect().width,
        footerLinkLabels: [...document.querySelectorAll('.full-footer a')].map((link) => link.textContent.trim()),
      };
    });

    expect(metrics.overflow, `body overflow at ${width}px`).toBeLessThanOrEqual(0);
    expect(metrics.brandsTop, `brand rail immediately follows the hero at ${width}px`).toBeGreaterThanOrEqual(metrics.heroBottom - 1);
    expect(metrics.logoDuration, `brand marquee speed at ${width}px`).toBeGreaterThanOrEqual(38);
    expect(metrics.logoDuration, `brand marquee speed at ${width}px`).toBeLessThanOrEqual(50);
    expect(metrics.logoImagesReady, `brand logos load at ${width}px`).toBe(true);
    expect(metrics.visibleLogos, `marquee shows a few logos at ${width}px`).toBeGreaterThanOrEqual(2);
    expect(metrics.visibleLogos, `marquee is not too dense at ${width}px`).toBeLessThanOrEqual(4);
    expect(metrics.entryDisplay).toBe('flex');
    expect(metrics.entryRailBounds.scrollWidth, `discovery rail scrolls at ${width}px`).toBeGreaterThan(metrics.entryRailBounds.width);
    expect(Math.abs(metrics.entryRects[0].left - metrics.entryRailBounds.left), `first discovery card aligns with its heading at ${width}px`).toBeLessThanOrEqual(1);
    expect(metrics.entryRects[0].right, `first discovery card stays fully inside the rail at ${width}px`).toBeLessThanOrEqual(metrics.entryRailBounds.right + 1);
    expect(metrics.entryRects[0].width, `discovery card fills its available rail width at ${width}px`).toBeCloseTo(metrics.entryRailBounds.width, 0);
    expect(Math.max(0, metrics.entryRailBounds.right - metrics.entryRects[1].left), `next discovery card preview at ${width}px`).toBeLessThanOrEqual(12);
    expect(metrics.featuredVisible).toBe(true);
    expect(metrics.newArrivalsHidden).toBe(true);
    expect(metrics.productColumns, `featured product grid columns at ${width}px`).toBe(2);
    expect(metrics.productWidths[0]).toBeCloseTo(metrics.productWidths[1], 0);
    expect(metrics.productImageHeights[0]).toBeCloseTo(metrics.productImageHeights[1], 0);
    expect(metrics.promotionVisible, `compact promotion preview at ${width}px`).toBe(4);
    expect(metrics.promotionHasBadge).toBe(true);
    expect(metrics.routineDisplay).toBe('flex');
    expect(metrics.routineRailBounds.scrollWidth, `routines rail scrolls at ${width}px`).toBeGreaterThan(metrics.routineRailBounds.width);
    expect(Math.abs(metrics.routineRects[0].left - metrics.routineRailBounds.left)).toBeLessThanOrEqual(1);
    expect(metrics.routineRects[0].right).toBeLessThanOrEqual(metrics.routineRailBounds.right + 1);
    expect(metrics.routineRects[0].width).toBeCloseTo(metrics.routineRailBounds.width, 0);
    expect(Math.max(0, metrics.routineRailBounds.right - metrics.routineRects[1].left)).toBeLessThanOrEqual(12);
    expect(metrics.trustItems).toBe(4);
    expect(metrics.footerLogoWidth).toBeGreaterThanOrEqual(145);
    expect(metrics.footerLogoWidth).toBeLessThanOrEqual(165);
    for (const label of ['Boutique', 'Nos marques', 'Livraison', 'FAQ', 'Contact']) {
      expect(metrics.footerLinkLabels, `footer link ${label}`).toContain(label);
    }

    const entryRail = page.locator('.gallery-entry-grid');
    const secondEntry = page.locator('.gallery-entry-card').nth(1);
    await entryRail.evaluate((element) => { element.style.scrollBehavior = 'auto'; element.scrollLeft = element.clientWidth; });
    await expect.poll(() => secondEntry.evaluate((element) => Math.abs(element.getBoundingClientRect().left - document.querySelector('.gallery-entry-grid').getBoundingClientRect().left))).toBeLessThanOrEqual(1);

    const verticalBefore = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => window.scrollBy({ top: 500, behavior: 'smooth' }));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(verticalBefore + 100);

    const featuredGrid = page.locator('.home-mobile-featured .product-grid');
    const fifthColumnCard = await featuredGrid.locator('.product-card').first().evaluate((card) => {
      const clone = card.cloneNode(true);
      card.parentElement.appendChild(clone);
      const result = { width: clone.getBoundingClientRect().width, gridColumnStart: getComputedStyle(clone).gridColumnStart };
      clone.remove();
      return result;
    });
    expect(fifthColumnCard.gridColumnStart).toBe('auto');
    expect(fifthColumnCard.width).toBeLessThan(metrics.productWidths[0] * 1.1);

    const firstAdd = await page.locator('.home-mobile-featured .product-card:nth-child(1) .add-button').boundingBox();
    const secondAdd = await page.locator('.home-mobile-featured .product-card:nth-child(2) .add-button').boundingBox();
    expect(Math.abs(firstAdd.y - secondAdd.y), `first-row product actions align at ${width}px`).toBeLessThanOrEqual(3);
    await expect(page.locator('.home-promotions .product-card--promotion .favorite-button').first()).toBeVisible();

    await page.goto('/');
    await expect(page.locator('.home-guided-card')).toHaveCount(4, { timeout: 15000 });
    await page.locator('.home-guided-grid').evaluate((element) => {
      element.style.scrollBehavior = 'auto';
      element.scrollLeft = element.scrollWidth;
    });
    await expect.poll(() => page.locator('.home-guided-card').last().evaluate((card) => {
      const rail = card.closest('.home-guided-grid').getBoundingClientRect();
      const rect = card.getBoundingClientRect();
      return rail.right - rect.right;
    })).toBeGreaterThanOrEqual(-1);
    await page.locator('.home-guided .home-section-link').click();
    await expect(page).toHaveURL(/\/packs$/);
    await page.goto('/');
    await page.locator('.home-brands .home-section-link').click();
    await expect(page).toHaveURL(/\/marques$/);

    await page.goto('/');
    await expect(page.locator('.home-mobile-featured .product-card')).toHaveCount(4, { timeout: 15000 });
    await expect(page.locator('.home-guided-card')).toHaveCount(4, { timeout: 15000 });
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      document.body.style.scrollBehavior = 'auto';
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await expect.poll(() => page.evaluate(() => window.scrollY + innerHeight >= document.documentElement.scrollHeight - 2)).toBe(true);
    const footerMetrics = await page.evaluate(() => ({
      copyBottom: document.querySelector('.site-footer > .footer-bottom').getBoundingClientRect().bottom,
      navTop: document.querySelector('.mobile-tabbar').getBoundingClientRect().top,
      navBottom: document.querySelector('.mobile-tabbar').getBoundingClientRect().bottom,
      viewportBottom: innerHeight,
    }));
    expect(footerMetrics.copyBottom, `copyright stays above bottom navigation at ${width}px`).toBeLessThan(footerMetrics.navTop);
    expect(footerMetrics.navBottom).toBeLessThanOrEqual(footerMetrics.viewportBottom);
  }
  expect(errors).toEqual([]);
});

test('desktop homepage keeps its grid layouts at 768, 1024, and 1440px', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const width of [768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width === 768 ? 1024 : 900 });
    await page.goto('/');
      await expect(page.locator('.gallery-entry-grid')).toBeVisible();
    const metrics = await page.evaluate(() => {
      const featured = document.querySelector('.home-mobile-featured');
      const newArrivals = document.querySelector('.home-new-arrivals');
      const discovery = document.querySelector('.gallery-entry-grid');
      const productGrid = document.querySelector('.home-new-arrivals .product-grid');
      const routines = document.querySelector('.home-guided-grid');
      const footer = document.querySelector('.site-footer > .footer-main');
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        featuredDisplay: featured ? getComputedStyle(featured).display : 'absent',
        newArrivalsDisplay: newArrivals ? getComputedStyle(newArrivals).display : 'absent',
        discoveryDisplay: discovery ? getComputedStyle(discovery).display : 'absent',
        discoveryColumns: discovery ? getComputedStyle(discovery).gridTemplateColumns.split(' ').length : 0,
        productsColumns: productGrid ? getComputedStyle(productGrid).gridTemplateColumns.split(' ').length : 0,
        routinesDisplay: routines ? getComputedStyle(routines).display : 'absent',
        routinesColumns: routines ? getComputedStyle(routines).gridTemplateColumns.split(' ').length : 0,
        footerColumns: footer ? getComputedStyle(footer).gridTemplateColumns.split(' ').length : 0,
      };
    });
    expect(metrics.overflow, `desktop body overflow at ${width}px`).toBeLessThanOrEqual(0);
    expect(metrics.featuredDisplay, `mobile featured block stays mobile at ${width}px`).not.toBe('block');
    expect(metrics.newArrivalsDisplay, `desktop novelty section remains visible at ${width}px`).not.toBe('none');
    expect(metrics.discoveryDisplay, `desktop discovery remains a grid at ${width}px`).toBe('grid');
    expect(metrics.discoveryColumns).toBe(3);
    if (metrics.productsColumns > 0) expect(metrics.productsColumns, `products retain a desktop grid at ${width}px`).toBeGreaterThanOrEqual(3);
    expect(metrics.routinesDisplay).toBe('grid');
    expect(metrics.routinesColumns, `routines are not converted to a rail at ${width}px`).toBeGreaterThanOrEqual(2);
    expect(metrics.footerColumns).toBe(4);
  }
  expect(errors).toEqual([]);
});
