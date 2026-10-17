import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const screenshots = join(process.cwd(), 'test-results', 'homepage-mobile-rails');
const viewports = [
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 393, height: 852 },
  { width: 430, height: 932 },
];

test.setTimeout(120000);

test('mobile homepage uses stacked Gallery links and a discoverable routine rail', async ({ page }) => {
  await mkdir(screenshots, { recursive: true });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('.gallery-entry-card')).toHaveCount(3, { timeout: 15000 });
    await expect(page.locator('.home-guided-card')).toHaveCount(4, { timeout: 15000 });
    await expect(page.locator('.home-guided-card')).toHaveCount(4, { timeout: 15000 });

    const metrics = await page.evaluate(() => {
      const rect = (selector) => document.querySelector(selector).getBoundingClientRect();
      const gallery = document.querySelector('.gallery-entry-grid');
      const cards = [...gallery.querySelectorAll('.gallery-entry-card')];
      const routineRail = document.querySelector('.home-guided-grid');
      const routineCards = [...routineRail.querySelectorAll('.home-guided-card')];
      const galleryBox = gallery.getBoundingClientRect();
      const routineBox = routineRail.getBoundingClientRect();
      const firstRoutine = routineCards[0].getBoundingClientRect();
      const secondRoutine = routineCards[1].getBoundingClientRect();
      return {
        width: innerWidth,
        viewportMetaCount: document.querySelectorAll('meta[name="viewport"]').length,
        viewportMeta: document.querySelector('meta[name="viewport"]')?.content,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        heroHeight: rect('.hero-carousel-container').height,
        heroBottom: rect('.hero-carousel-container').bottom,
        brandHeadingBottom: rect('.home-brands__heading').bottom,
        galleryDisplay: getComputedStyle(gallery).display,
        galleryColumns: getComputedStyle(gallery).gridTemplateColumns.split(' ').length,
        galleryScrollWidth: gallery.scrollWidth,
        galleryWidth: gallery.clientWidth,
        galleryHeight: rect('.gallery-entry').height,
        galleryCards: cards.map((card) => {
          const bounds = card.getBoundingClientRect();
          const titleStyle = getComputedStyle(card.querySelector('h3'));
          return {
            left: bounds.left,
            right: bounds.right,
            top: bounds.top,
            width: bounds.width,
            height: bounds.height,
            text: card.querySelector('h3').textContent.trim(),
            wordBreak: titleStyle.wordBreak,
            overflowWrap: titleStyle.overflowWrap,
          };
        }),
        routineDisplay: getComputedStyle(routineRail).display,
        routineScrollWidth: routineRail.scrollWidth,
        routineWidth: routineRail.clientWidth,
        routineCardWidth: firstRoutine.width,
        routineCardHeight: firstRoutine.height,
        routineCardRight: firstRoutine.right,
        routineNextPreview: Math.max(0, routineBox.right - secondRoutine.left),
        routineHint: document.querySelector('.home-guided-hint').innerText.replace(/\s+/g, ' ').trim(),
        routineIndicatorCount: document.querySelectorAll('.home-guided-indicator').length,
        heroIndicatorInset: rect('.hero-carousel-container').bottom - rect('.hero-indicators').bottom,
      };
    });

    expect(metrics.width).toBe(viewport.width);
    expect(metrics.viewportMetaCount).toBe(1);
    expect(metrics.viewportMeta).toBe('width=device-width, initial-scale=1');
    expect(metrics.overflow, `page overflow at ${viewport.width}px`).toBeLessThanOrEqual(0);
    expect(metrics.heroHeight, `compact hero at ${viewport.width}px`).toBeGreaterThanOrEqual(460);
    expect(metrics.heroHeight).toBeLessThanOrEqual(550);
    expect(metrics.brandHeadingBottom, `brands peek below hero at ${viewport.width}px`).toBeLessThan(viewport.height);
    expect(metrics.galleryDisplay).toBe('grid');
    expect(metrics.galleryColumns).toBe(1);
    expect(metrics.galleryScrollWidth).toBe(metrics.galleryWidth);
    expect(metrics.galleryHeight).toBeLessThanOrEqual(420);
    expect(metrics.galleryCards).toHaveLength(3);
    expect(metrics.galleryCards.every((card) => card.width > 300 && card.left >= 17 && card.right <= viewport.width - 17)).toBe(true);
    expect(metrics.galleryCards[0].top).toBeLessThan(metrics.galleryCards[1].top);
    expect(metrics.galleryCards[1].top).toBeLessThan(metrics.galleryCards[2].top);
    expect(metrics.galleryCards.every(({ wordBreak, overflowWrap }) => wordBreak === 'normal' && overflowWrap === 'normal')).toBe(true);
    expect(metrics.routineDisplay).toBe('flex');
    expect(metrics.routineScrollWidth).toBeGreaterThan(metrics.routineWidth);
    expect(metrics.routineCardRight).toBeLessThanOrEqual(metrics.routineWidth + 19);
    expect(metrics.routineNextPreview).toBeGreaterThanOrEqual(8);
    expect(metrics.routineNextPreview).toBeLessThanOrEqual(12);
    expect(metrics.routineCardHeight).toBeLessThanOrEqual(190);
    expect(metrics.routineHint).toMatch(/^4 choix · Faites glisser/);
    expect(metrics.routineIndicatorCount).toBe(4);
    expect(metrics.heroIndicatorInset).toBeGreaterThanOrEqual(12);
    expect(metrics.heroIndicatorInset).toBeLessThanOrEqual(17);

    await expect(page.locator('.gallery-entry .home-section-link')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Je cherche un soin/ })).toHaveAttribute('href', '/soins');
    await expect(page.getByRole('link', { name: /Je pars de ma peau/ })).toHaveAttribute('href', '/peau');
    await expect(page.getByRole('link', { name: /Je connais ma marque/ })).toHaveAttribute('href', '/marques');

    if (viewport.width === 390 || viewport.width === 430) {
      if (viewport.width === 390) {
        for (let slideIndex = 0; slideIndex < 3; slideIndex++) {
          const slideButton = page.getByRole('button', { name: `Afficher la diapositive ${slideIndex + 1}` });
          await slideButton.click();
          await expect(slideButton).toHaveAttribute('aria-current', 'true');
          await page.screenshot({ path: join(screenshots, `390-hero-slide-${slideIndex + 1}.png`), animations: 'disabled' });
        }
        await page.getByRole('button', { name: 'Afficher la diapositive 1' }).click();
      }
      await page.screenshot({ path: join(screenshots, `${viewport.width}-first-screen.png`), animations: 'disabled' });
      const revealAndCapture = async (selector, file) => {
        const section = page.locator(selector);
        await section.scrollIntoViewIfNeeded();
        await expect.poll(() => section.evaluate((element) => !element.classList.contains('section-reveal-pending'))).toBe(true);
        await section.evaluate(async (element) => {
          await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})));
        });
        await section.screenshot({ path: join(screenshots, file), animations: 'disabled' });
      };
      await revealAndCapture('.gallery-entry', `${viewport.width}-gallery.png`);
      await revealAndCapture('.home-guided', `${viewport.width}-routines.png`);
      await page.locator('.home-guided-grid').evaluate((rail) => { rail.scrollLeft = 0; });
      await page.locator('.home-guided-indicator').first().click();
      await expect(page.locator('.home-guided-indicator').first()).toHaveAttribute('aria-current', 'true');
    }

    const indicator = page.locator('.home-guided-indicator');
    await indicator.nth(1).click();
    await expect(indicator.nth(1)).toHaveAttribute('aria-current', 'true');
    await page.locator('.home-guided-grid').evaluate((rail) => {
      rail.style.scrollBehavior = 'auto';
      rail.scrollLeft = rail.scrollWidth;
    });
    await expect(indicator.last()).toHaveAttribute('aria-current', 'true');

    const firstCard = page.locator('.home-guided-card').first();
    await firstCard.dispatchEvent('pointerdown', { clientX: 300, clientY: 200, pointerId: 1, pointerType: 'touch' });
    await page.locator('.home-guided-grid').dispatchEvent('pointermove', { clientX: 270, clientY: 200, pointerId: 1, pointerType: 'touch' });
    await page.locator('.home-guided-grid').dispatchEvent('pointerup', { clientX: 270, clientY: 200, pointerId: 1, pointerType: 'touch' });
    const clickAllowed = await firstCard.evaluate((element) => element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
    expect(clickAllowed, 'swiping the routine rail does not activate its card').toBe(false);
    expect(page.url()).toContain('/');

  }

  expect(errors).toEqual([]);
});

test('desktop homepage keeps the existing hero and three-column section layouts', async ({ page }) => {
  for (const viewport of [{ width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('.gallery-entry-card')).toHaveCount(3, { timeout: 15000 });
    await expect(page.locator('.home-guided-card')).toHaveCount(4, { timeout: 15000 });
    const metrics = await page.evaluate(() => ({
      width: innerWidth,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      galleryDisplay: getComputedStyle(document.querySelector('.gallery-entry-grid')).display,
      galleryColumns: getComputedStyle(document.querySelector('.gallery-entry-grid')).gridTemplateColumns.split(' ').length,
      routineDisplay: getComputedStyle(document.querySelector('.home-guided-grid')).display,
      routineColumns: getComputedStyle(document.querySelector('.home-guided-grid')).gridTemplateColumns.split(' ').length,
      routineHintDisplay: getComputedStyle(document.querySelector('.home-guided-hint')).display,
      routineIndicatorsDisplay: getComputedStyle(document.querySelector('.home-guided-indicators')).display,
      heroHeight: document.querySelector('.hero-carousel-container').getBoundingClientRect().height,
    }));
    expect(metrics.width).toBe(viewport.width);
    expect(metrics.overflow).toBeLessThanOrEqual(0);
    expect(metrics.galleryDisplay).toBe('grid');
    expect(metrics.galleryColumns).toBe(3);
    expect(metrics.routineDisplay).toBe('grid');
    expect(metrics.routineColumns).toBeGreaterThanOrEqual(2);
    expect(metrics.routineHintDisplay).toBe('none');
    expect(metrics.routineIndicatorsDisplay).toBe('none');
  }
});
