import { expect, test } from '@playwright/test';

test('navigation, search, filters, product and pack pages work without console errors', async ({ page, request }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: 'Marques' }).click();
  await expect(page).toHaveURL(/\/marques$/);
  const brand = (await (await request.get('/api/v1/brands')).json())[0];
  await page.goto(`/marques/${brand.slug}`);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(brand.name);
  await expect(page.locator('.product-card').first()).toBeVisible();

  const category = (await (await request.get('/api/v1/product-types')).json())[0];
  await page.goto(`/soins/${category.slug}`);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(category.name);
  await page.getByRole('search').first().getByRole('textbox').fill('COSRX');
  await expect(page.locator('.search-popover')).toBeVisible();
  await page.getByRole('search').first().getByRole('textbox').press('Enter');
  await expect(page).toHaveURL(/\/recherche\?q=COSRX/);
  await expect(page.locator('.product-card').first()).toBeVisible();

  await page.locator('.product-card').first().getByRole('link', { name: /^Voir / }).click();
  await expect(page).toHaveURL(/\/produits\//);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto('/packs/duo-double-nettoyage');
  await expect(page.getByRole('heading', { name: 'Duo Double Nettoyage' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('mobile menu and filters remain usable at common widths', async ({ page }) => {
  for (const width of [375, 390, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/soins');
    await expect(page.getByRole('heading', { level: 1, name: 'Les soins' })).toBeVisible();
    await page.goto('/boutique');
    await expect(page.locator('.product-card').first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(2);
    if (width <= 760) {
      await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
      await expect(page.getByRole('dialog', { name: 'Menu mobile' })).toBeVisible();
      await page.getByRole('button', { name: 'Fermer le menu' }).click();
      await page.getByRole('button', { name: 'Filtrer' }).click();
      await expect(page.locator('.filter-panel.open')).toBeVisible();
      await page.getByRole('button', { name: 'Fermer les filtres' }).click();
    }
  }
});

test('collection filter stays in the URL through back, forward and reload', async ({ page }) => {
  await page.goto('/boutique');
  const pills = page.locator('.quick-pills');
  await expect(pills).toBeVisible();
  const selected = pills.getByRole('button').nth(1);
  const name = await selected.textContent();
  await selected.click();
  await expect(page).toHaveURL(/\?type=/);
  await expect(pills.getByRole('button', { name })).toHaveClass(/active/);
  await page.goBack();
  await expect(page).toHaveURL(/\/boutique$/);
  await page.goForward();
  await page.reload();
  await expect(pills.getByRole('button', { name })).toHaveClass(/active/);
  await expect(page.locator('.product-card').first()).toBeVisible();
});

test('pack enters the cart, city quote updates, and COD order reaches its receipt', async ({ page }) => {
  await page.goto('/packs/duo-double-nettoyage');
  await page.getByRole('button', { name: 'Ajouter le pack au panier' }).click();
  await page.getByRole('button', { name: /Panier, / }).click();
  await expect(page.getByRole('dialog', { name: 'Mon panier' })).toContainText('Duo Double Nettoyage');
  await page.getByRole('link', { name: 'Continuer ma commande' }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole('heading', { name: 'Finaliser ma commande' })).toBeVisible();
  await page.locator('select[name="city_id"]').selectOption({ label: 'Casablanca' });
  await expect(page.locator('.checkout-summary')).toContainText('Livraison');
  await expect(page.locator('.checkout-summary')).toContainText('Total à régler');
  await page.locator('input[name="first_name"]').fill('Test');
  await page.locator('input[name="last_name"]').fill('Gallery');
  await page.locator('input[name="phone"]').fill('0612345678');
  await page.locator('input[name="address"]').fill('12 rue du Test');
  await page.locator('input[name="district"]').fill('Centre');
  await page.getByRole('button', { name: 'Commander' }).click();
  await expect(page).toHaveURL(/\/commande\/[^/]+\/confirmation$/);
  await expect(page.getByRole('heading', { name: 'Commande reçue' })).toBeVisible();
});
