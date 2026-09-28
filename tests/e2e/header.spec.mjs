import { expect, test } from '@playwright/test';

test('sticky header and dropdown panels fit desktop widths', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const width of [1024, 1280, 1440, 1600]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Navigation principale' });
    await expect(nav.getByRole('link')).toHaveCount(6);
    await expect(nav.getByRole('button')).toHaveCount(4);
    for (const label of ['Marques', 'Soins', 'Peau', 'Routines & Packs']) {
      await nav.getByRole('link', { name: label }).hover();
      const panel = page.getByRole('region', { name: `Explorer ${label}` });
      await expect(panel).toBeVisible();
      const bounds = await panel.boundingBox();
      expect(bounds.x, `${label} left edge at ${width}`).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width, `${label} right edge at ${width}`).toBeLessThanOrEqual(width);
      expect(bounds.y + bounds.height, `${label} height at ${width}`).toBeLessThan(900);
    }
    await page.evaluate(() => scrollTo(0, 450));
    await expect.poll(() => page.locator('.site-header').evaluate((el) => Math.round(el.getBoundingClientRect().top))).toBe(0);
    await expect(page.locator('.trust-marquee')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(2);
  }
  expect(errors).toEqual([]);
});

test('desktop menus have distinct layouts and accessible interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Navigation principale' });
  const brands = nav.getByRole('link', { name: 'Marques' });
  await brands.hover();
  await page.waitForTimeout(170);
  const brandMenu = page.getByRole('region', { name: 'Explorer Marques' });
  await expect(brandMenu).toBeVisible();
  await expect(brandMenu.locator('.gallery-mega-heading > span')).toHaveText('Marques');
  await expect(brandMenu.getByRole('heading', { name: 'Marques populaires' })).toHaveCount(0);
  await expect(brandMenu.locator('.gallery-mega-heading').getByRole('link', { name: 'Toutes les marques' })).toHaveAttribute('href', '/marques');
  await expect(brandMenu.getByRole('heading', { name: 'Toutes les marques' })).toHaveCount(0);
  await brandMenu.getByRole('link', { name: 'Anua' }).first().hover();
  await expect(brandMenu).toBeVisible();
  for (const [label, headings] of [
    ['Soins', ['Nettoyer', 'Préparer & traiter', 'Hydrater & protéger']],
    ['Peau', ['Type de peau', 'Besoins']],
    ['Routines & Packs', ['Routines', 'Packs']],
  ]) {
    await nav.getByRole('link', { name: label }).hover();
    const panel = page.getByRole('region', { name: `Explorer ${label}` });
    await expect(panel).toBeVisible();
    for (const heading of headings) await expect(panel.getByRole('heading', { name: heading })).toBeVisible();
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('.gallery-mega')).toBeHidden();
  const trigger = nav.getByRole('button', { name: 'Afficher le menu Marques' });
  await trigger.focus();
  await trigger.press('Enter');
  await expect(brandMenu).toBeVisible();
  await page.mouse.click(1400, 700);
  await expect(page.locator('.gallery-mega')).toBeHidden();
  await brands.click();
  await expect(page).toHaveURL(/\/marques$/);
});

test('mobile drawer distinguishes destinations from expandable menus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
  const drawer = page.getByRole('dialog', { name: 'Menu mobile' });
  await expect(drawer.locator('.gallery-mobile-link')).toHaveCount(3);
  await expect(drawer.locator('.gallery-mobile-trigger')).toHaveCount(4);
  await drawer.getByRole('button', { name: 'Marques', exact: true }).click();
  const brandPanel = drawer.locator('#mobile-brands');
  await expect(brandPanel.getByRole('link', { name: 'Toutes les marques' })).toBeVisible();
  expect(await brandPanel.getByRole('link').count()).toBeGreaterThan(5);
  await brandPanel.getByRole('link', { name: 'Toutes les marques' }).click();
  await expect(page).toHaveURL(/\/marques$/);
  await expect(drawer).toHaveCount(0);
  await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
  await drawer.getByRole('button', { name: 'Soins', exact: true }).click();
  await expect(drawer.getByRole('link', { name: 'Sérums & Ampoules' })).toBeVisible();
  await drawer.getByRole('link', { name: 'Sérums & Ampoules' }).click();
  await expect(page).toHaveURL(/\/soins\/serums-ampoules$/);
});
