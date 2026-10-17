import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const screenshots = join(process.cwd(), 'test-results', 'homepage-mobile-rails');
const viewports = [
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 538, height: 900 },
];

test.setTimeout(180000);

async function scrollToCard(rail, index) {
  const card = rail.locator(':scope > *').nth(index);
  await rail.evaluate((element, targetIndex) => {
    element.style.scrollBehavior = 'auto';
    const target = element.children[targetIndex];
    const railRect = element.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    element.scrollLeft += targetRect.left - railRect.left;
  }, index);
  await expect.poll(() => card.evaluate((element) => {
    const railRect = element.parentElement.getBoundingClientRect();
    return Math.abs(element.getBoundingClientRect().left - railRect.left);
  })).toBeLessThanOrEqual(2);
  return card;
}

async function waitForCardReveal(card) {
  await card.evaluate(async (element) => {
    const animations = element.getAnimations();
    await Promise.all(animations.map((animation) => animation.finished.catch(() => {})));
  });
}

async function expectCardComplete(rail, card, { contentSelectors, isLast }) {
  const geometry = await card.evaluate((element, selectors) => {
    const rail = element.parentElement;
    const railRect = rail.getBoundingClientRect();
    const cardRect = element.getBoundingClientRect();
    const descendants = selectors.map((selector) => {
      const node = element.querySelector(selector);
      const rect = node.getBoundingClientRect();
      return { selector, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
    });
    const ancestors = [];
    for (let node = rail.parentElement; node && node !== document.body; node = node.parentElement) {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      ancestors.push({
        tag: node.tagName.toLowerCase(),
        className: typeof node.className === 'string' ? node.className : '',
        overflowX: style.overflowX,
        overflowY: style.overflowY,
        clipPath: style.clipPath,
        contain: style.contain,
        width: rect.width,
      });
    }
    return {
      rail: { left: railRect.left, right: railRect.right, width: rail.clientWidth, scrollWidth: rail.scrollWidth,
        snap: getComputedStyle(rail).scrollSnapType, overscroll: getComputedStyle(rail).overscrollBehaviorX,
        touchAction: getComputedStyle(rail).touchAction },
      card: { left: cardRect.left, right: cardRect.right, top: cardRect.top, bottom: cardRect.bottom, width: cardRect.width,
        scrollWidth: element.scrollWidth, clientWidth: element.clientWidth,
        boxSizing: getComputedStyle(element).boxSizing,
        snapAlign: getComputedStyle(element).scrollSnapAlign,
        snapStop: getComputedStyle(element).scrollSnapStop },
      descendants,
      ancestors,
      pageWidth: document.documentElement.clientWidth,
      pageScrollWidth: document.documentElement.scrollWidth,
      rightGutter: innerWidth - railRect.right,
    };
  }, contentSelectors);

  expect(geometry.pageScrollWidth, `document must not overflow: ${JSON.stringify(geometry.ancestors)}`).toBe(geometry.pageWidth);
  expect(geometry.rail.scrollWidth).toBeGreaterThan(geometry.rail.width);
  expect(geometry.rail.snap).toContain('mandatory');
  expect(geometry.rail.overscroll).toBe('contain');
  expect(geometry.rail.touchAction).toBe('pan-x pan-y');
  expect(geometry.card.boxSizing).toBe('border-box');
  expect(geometry.card.snapAlign).toContain('start');
  expect(geometry.card.snapStop).toBe('always');
  expect(geometry.card.left).toBeCloseTo(geometry.rail.left, 0);
  expect(geometry.card.right).toBeLessThanOrEqual(geometry.rail.right + 1);
  expect(geometry.card.width).toBeCloseTo(geometry.rail.width, 0);
  expect(geometry.card.scrollWidth).toBeLessThanOrEqual(geometry.card.clientWidth + 1);
  expect(geometry.rightGutter).toBeCloseTo(18, 0);
  if (isLast) expect(geometry.card.right).toBeCloseTo(geometry.rail.right, 0);
  for (const node of geometry.descendants) {
    expect(node.left, `${node.selector} should fit inside card`).toBeGreaterThanOrEqual(geometry.card.left - 1);
    expect(node.right, `${node.selector} should fit inside card`).toBeLessThanOrEqual(geometry.card.right + 1);
    expect(node.top, `${node.selector} should fit inside card`).toBeGreaterThanOrEqual(geometry.card.top - 1);
    expect(node.bottom, `${node.selector} should fit inside card`).toBeLessThanOrEqual(geometry.card.bottom + 1);
  }
  return geometry;
}

test('mobile homepage rails snap each complete card into the viewport', async ({ page }) => {
  await mkdir(screenshots, { recursive: true });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('.gallery-entry-card')).toHaveCount(3, { timeout: 15000 });
    await expect(page.locator('.home-guided-card')).toHaveCount(4, { timeout: 15000 });

    const rails = [
      { section: '.gallery-entry', rail: '.gallery-entry-grid', cardCount: 3, content: ['.entry-number', 'h3', 'p', '.entry-action'], name: 'gallery' },
      { section: '.home-guided', rail: '.home-guided-grid', cardCount: 4, content: ['svg', 'h3', 'p', 'span'], name: 'routine' },
    ];

    for (const railInfo of rails) {
      const rail = page.locator(railInfo.rail);
      await expect(rail.locator(':scope > *')).toHaveCount(railInfo.cardCount);
      const initialCard = rail.locator(':scope > *').first();
      const initial = await expectCardComplete(rail, initialCard, { contentSelectors: railInfo.content, isLast: false });
      const section = page.locator(railInfo.section);
      await section.evaluate((element) => {
        const documentTop = window.scrollY + element.getBoundingClientRect().top;
        window.scrollTo({ top: Math.max(0, documentTop - 140), behavior: 'instant' });
      });
      await expect(section).not.toHaveClass(/section-reveal-pending/);
      await waitForCardReveal(initialCard);
      if (viewport.width !== 375) {
        await section.screenshot({ path: join(screenshots, `${viewport.width}-${railInfo.name}-card-1.png`) });
      }

      for (let index = 1; index < railInfo.cardCount; index++) {
        const card = await scrollToCard(rail, index);
        const geometry = await expectCardComplete(rail, card, { contentSelectors: railInfo.content, isLast: index === railInfo.cardCount - 1 });
        await waitForCardReveal(card);
        if (viewport.width !== 375) {
          await section.screenshot({ path: join(screenshots, `${viewport.width}-${railInfo.name}-card-${index + 1}.png`) });
        }
        if (index === 1) expect(geometry.card.left).toBeCloseTo(geometry.rail.left, 0);
      }

      const lastCard = rail.locator(':scope > *').last();
      await scrollToCard(rail, railInfo.cardCount - 1);
      await expectCardComplete(rail, lastCard, { contentSelectors: railInfo.content, isLast: true });
      expect(initial.card.left).toBeCloseTo(initial.rail.left, 0);
    }

    const railGeometry = await page.locator('.gallery-entry-grid').evaluate((rail) => ({
      parentLeft: rail.parentElement.getBoundingClientRect().left,
      railLeft: rail.getBoundingClientRect().left,
      parentRight: rail.parentElement.getBoundingClientRect().right,
      railRight: rail.getBoundingClientRect().right,
    }));
    expect(railGeometry.railLeft).toBeCloseTo(railGeometry.parentLeft + 18, 0);
    expect(railGeometry.parentRight - railGeometry.railRight).toBeCloseTo(18, 0);

    const verticalBefore = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => window.scrollBy({ top: 280, behavior: 'instant' }));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(verticalBefore + 100);
  }

  expect(errors).toEqual([]);
});

test('the rails remain horizontal rails on mobile widths and desktop keeps its grids', async ({ page }) => {
  for (const viewport of [{ width: 375, height: 667 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 538, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('.gallery-entry-card')).toHaveCount(3, { timeout: 15000 });
    const metrics = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      galleryDisplay: getComputedStyle(document.querySelector('.gallery-entry-grid')).display,
      routinesDisplay: getComputedStyle(document.querySelector('.home-guided-grid')).display,
      galleryColumns: getComputedStyle(document.querySelector('.gallery-entry-grid')).gridTemplateColumns,
      routineColumns: getComputedStyle(document.querySelector('.home-guided-grid')).gridTemplateColumns,
    }));
    expect(metrics.scrollWidth).toBe(metrics.width);
    expect(metrics.galleryDisplay).toBe('flex');
    expect(metrics.routinesDisplay).toBe('flex');
  }

  for (const viewport of [{ width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('.gallery-entry-card')).toHaveCount(3, { timeout: 15000 });
    const metrics = await page.evaluate(() => ({
      galleryDisplay: getComputedStyle(document.querySelector('.gallery-entry-grid')).display,
      galleryColumns: getComputedStyle(document.querySelector('.gallery-entry-grid')).gridTemplateColumns.split(' ').length,
      routinesDisplay: getComputedStyle(document.querySelector('.home-guided-grid')).display,
      routinesColumns: getComputedStyle(document.querySelector('.home-guided-grid')).gridTemplateColumns.split(' ').length,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    expect(metrics.overflow).toBeLessThanOrEqual(0);
    expect(metrics.galleryDisplay).toBe('grid');
    expect(metrics.galleryColumns).toBe(3);
    expect(metrics.routinesDisplay).toBe('grid');
    expect(metrics.routinesColumns).toBeGreaterThanOrEqual(2);
  }
});
