import { test, expect } from '@playwright/test';

test.describe('Catalog foundation — isolated QA database', () => {
  test.beforeEach(async ({ request }) => {
    const result = await (await request.get('/api/products?q=Produit%20test%20QA')).json();
    test.skip(!result.total, 'Requires backend/app/scripts/prepare_catalog_qa.py in an isolated .qa database.');
  });

  test('brand, stock, search and genuine restock subscription', async ({ page, request }) => {
    const data = await (await request.get('/api/products?availability=out_of_stock')).json();
    const product = data.products.find((p) => p.sku.startsWith('KG-'));
    await page.goto(`/marques/${product.brand_slug}`);
    await expect(page.locator('.product-card').filter({ hasText: product.name }).first()).toBeVisible();
    await page.goto(`/produits/${product.slug}`);
    await expect(page.getByRole('heading', { name: 'Me prévenir du réassort' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ajouter au panier', exact: true })).toHaveCount(0);
    await page.locator('.stock-alert-form input').fill(`qa-${Date.now()}@example.ma`);
    await page.getByRole('button', { name: 'Me prévenir', exact: true }).click();
    await expect(page.locator('.stock-alert-form [role=status]')).toContainText('inscrite');
    await page.getByRole('button', { name: 'Me prévenir', exact: true }).click();
    await expect(page.locator('.stock-alert-form [role=status]')).toContainText('déjà');
    await page.goto(`/recherche?q=${encodeURIComponent(product.name)}`);
    await expect(page.locator('.product-card').filter({ hasText: product.name }).first()).toBeVisible();
    await expect(page.locator('.product-note').first()).toContainText('Rupture');
    const available = await (await request.get('/api/products?availability=in_stock')).json();
    await page.goto(`/produits/${available.products[0].slug}`);
    await expect(page.getByRole('button', { name: 'Ajouter au panier', exact: true }).first()).toBeVisible();
  });

  test('URL filters survive reload and browser back; pagination', async ({ page }) => {
    await page.goto('/boutique');
    await expect(page.locator('.collection-grid .product-card')).toHaveCount(24);
    await page.getByRole('link', { name: 'Suivant', exact: true }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator('.collection-grid .product-card')).toHaveCount(8);
    await page.goto('/boutique');
    await page.locator('.filter-section').filter({ has: page.locator('summary', { hasText: /^Marque$/ }) }).getByRole('button').filter({ hasText: /^Anua/ }).click();
    await expect(page).toHaveURL(/brand=anua/);
    await page.locator('.filter-section').filter({ has: page.locator('summary', { hasText: /^Disponibilité$/ }) }).getByRole('button').filter({ hasText: /Rupture/ }).click();
    await expect(page).toHaveURL(/availability=out_of_stock/);
    await page.reload();
    await expect(page.locator('.collection-grid .product-card')).toHaveCount(2);
    await expect(page.locator('.collection-grid .product-note')).toHaveText(['Rupture', 'Rupture']);
    await page.locator('.selected-filters button').filter({ hasText: /Rupture/ }).click();
    await expect(page).not.toHaveURL(/availability=/);
    await page.goBack();
    await expect(page).toHaveURL(/availability=out_of_stock/);
    await expect(page.locator('.collection-grid .product-card')).toHaveCount(2);
  });

  test('homepage requests small selections; mobile has no horizontal overflow', async ({ page }) => {
    const queries = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.pathname === '/api/products') queries.push(url.searchParams);
    });
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
    await expect.poll(() => queries.length).toBeGreaterThanOrEqual(2);
    expect(queries.every((query) => Number(query.get('page_size')) <= 8 && (query.has('featured') || query.has('new')))).toBeTruthy();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/boutique?availability=out_of_stock');
    await expect(page.locator('.collection-grid .product-card').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.screenshot({ path: 'docs/qa/catalog-foundation-mobile.png', fullPage: true });
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto('/boutique');
    await expect(page.locator('.collection-grid .product-card')).toHaveCount(24);
    await page.screenshot({ path: 'docs/qa/catalog-foundation-desktop.png', fullPage: true });
  });

  test('admin catalog and grouped editor save actual product data', async ({ page, request }) => {
    const login = await page.context().request.post('/api/auth/login', { data: { email: 'catalog-qa@example.ma', password: 'catalog-qa-password-123' } });
    expect(login.ok()).toBeTruthy();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto('/admin/catalogue/produits');
    await expect(page.getByRole('heading', { name: 'Produits', exact: true })).toBeVisible();
    await expect(page.locator('.admin-table tbody tr')).toHaveCount(24);
    await page.getByLabel('Filtrer par stock').selectOption('out_of_stock');
    await expect(page.locator('.admin-table tbody tr')).toHaveCount(6);
    await page.getByRole('link', { name: 'Modifier', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: 'Informations officielles' })).toBeVisible();
    await page.getByLabel('Seuil stock faible', { exact: true }).fill('4');
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Produit enregistré.');
    expect(pageErrors).toEqual([]);
    await page.screenshot({ path: 'docs/qa/catalog-foundation-admin.png', fullPage: true });
  });
});
