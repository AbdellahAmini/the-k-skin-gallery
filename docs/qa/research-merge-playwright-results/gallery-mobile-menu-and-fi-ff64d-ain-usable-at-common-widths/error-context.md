# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gallery.spec.mjs >> mobile menu and filters remain usable at common widths
- Location: tests\e2e\gallery.spec.mjs:34:1

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator:  getByRole('heading', { name: 'Les soins', level: 1 })
Expected: visible
Received: undefined

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Les soins', level: 1 }) with timeout 10000ms
  - waiting for getByRole('heading', { name: 'Les soins', level: 1 })
  - Protocol error (Runtime.callFunctionOn): Internal server error, session closed.

```

# Page snapshot

```yaml
- generic [ref=f12e3]:
  - banner [ref=f12e4]:
    - generic [ref=f12e5]:
      - link "K-Skin Gallery, accueil" [ref=f12e6] [cursor=pointer]:
        - /url: /
        - img "K-Skin Gallery — Korean Skincare" [ref=f12e7]
      - search [ref=f12e8]:
        - textbox "Rechercher un produit, une marque ou un soin" [ref=f12e11]:
          - /placeholder: Rechercher un produit, une marque, un soin…
      - generic [ref=f12e12]:
        - link "Compte" [ref=f12e13] [cursor=pointer]:
          - /url: /connexion
        - link "Favoris" [ref=f12e17] [cursor=pointer]:
          - /url: /favoris
        - button "Panier, 0 article" [ref=f12e21] [cursor=pointer]:
          - generic [ref=f12e22]: "0"
          - generic [ref=f12e26]: Panier
    - navigation "Navigation principale" [ref=f12e28]:
      - link "Nouveautés" [ref=f12e30] [cursor=pointer]:
        - /url: /nouveautes
      - generic [ref=f12e31]:
        - link "Marques" [ref=f12e32] [cursor=pointer]:
          - /url: /marques
        - button "Afficher le menu Marques" [ref=f12e33] [cursor=pointer]
      - generic [ref=f12e36]:
        - link "Soins" [ref=f12e37] [cursor=pointer]:
          - /url: /soins
        - button "Afficher le menu Soins" [ref=f12e38] [cursor=pointer]
      - generic [ref=f12e41]:
        - link "Peau" [ref=f12e42] [cursor=pointer]:
          - /url: /peau
        - button "Afficher le menu Peau" [ref=f12e43] [cursor=pointer]
      - generic [ref=f12e46]:
        - link "Routines & Packs" [ref=f12e47] [cursor=pointer]:
          - /url: /routines
        - button "Afficher le menu Routines & Packs" [ref=f12e48] [cursor=pointer]
      - link "Promotions" [ref=f12e52] [cursor=pointer]:
        - /url: /promotions
    - generic "Nos engagements" [ref=f12e53]:
      - generic [ref=f12e54]:
        - generic [ref=f12e55]:
          - generic [ref=f12e56]: Livraison 24–48h partout au Maroc
          - generic [aria-hidden] [ref=f12e60]: ✦
          - generic [ref=f12e61]: Paiement à la livraison
          - generic [aria-hidden] [ref=f12e65]: ✦
          - generic [ref=f12e66]: Produits authentiques
          - generic [aria-hidden] [ref=f12e70]: ✦
          - generic [ref=f12e71]: Assistance 7j/7
          - generic [aria-hidden] [ref=f12e75]: ✦
        - generic [aria-hidden] [ref=f12e76]:
          - generic [ref=f12e77]: Livraison 24–48h partout au Maroc
          - generic [aria-hidden] [ref=f12e81]: ✦
          - generic [ref=f12e82]: Paiement à la livraison
          - generic [aria-hidden] [ref=f12e86]: ✦
          - generic [ref=f12e87]: Produits authentiques
          - generic [aria-hidden] [ref=f12e91]: ✦
          - generic [ref=f12e92]: Assistance 7j/7
          - generic [aria-hidden] [ref=f12e96]: ✦
  - main "Chargement de la page" [ref=f12e97]
  - contentinfo [ref=f12e105]:
    - generic [ref=f12e106]:
      - generic [ref=f12e107]:
        - link [ref=f12e108] [cursor=pointer]:
          - /url: /
          - img "K-Skin Gallery" [ref=f12e109]
        - paragraph [ref=f12e110]: Une sélection coréenne, tout près de vous.
      - generic [ref=f12e111]:
        - heading "La Gallery" [level=2] [ref=f12e112]
        - link "Boutique" [ref=f12e113] [cursor=pointer]:
          - /url: /boutique
        - link "Nouveautés" [ref=f12e114] [cursor=pointer]:
          - /url: /nouveautes
        - link "Promotions" [ref=f12e115] [cursor=pointer]:
          - /url: /promotions
        - link "Marques" [ref=f12e116] [cursor=pointer]:
          - /url: /marques
        - link "Routines" [ref=f12e117] [cursor=pointer]:
          - /url: /routines
        - link "Packs" [ref=f12e118] [cursor=pointer]:
          - /url: /packs
        - link "Conseils" [ref=f12e119] [cursor=pointer]:
          - /url: /conseils
      - generic [ref=f12e120]:
        - heading "Aide" [level=2] [ref=f12e121]
        - link "FAQ" [ref=f12e122] [cursor=pointer]:
          - /url: /faq
        - link "Livraison" [ref=f12e123] [cursor=pointer]:
          - /url: /livraison
        - link "Retours" [ref=f12e124] [cursor=pointer]:
          - /url: /retours
        - link "Contact" [ref=f12e125] [cursor=pointer]:
          - /url: /contact
      - generic [ref=f12e126]:
        - heading "Informations" [level=2] [ref=f12e127]
        - link "Conditions de vente" [ref=f12e128] [cursor=pointer]:
          - /url: /cgv
        - link "Confidentialité" [ref=f12e129] [cursor=pointer]:
          - /url: /confidentialite
    - generic [ref=f12e130]:
      - generic [ref=f12e131]: © 2026 K-Skin Gallery
      - generic [ref=f12e132]: Paiement à la livraison · Livraison au Maroc · Produits authentiques
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | test('navigation, search, filters, product and pack pages work without console errors', async ({ page, request }) => {
  4  |   const errors = [];
  5  |   page.on('pageerror', (error) => errors.push(error.message));
  6  |   page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  7  | 
  8  |   await page.goto('/');
  9  |   await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  10 |   await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: 'Marques' }).click();
  11 |   await expect(page).toHaveURL(/\/marques$/);
  12 |   const brand = (await (await request.get('/api/v1/brands')).json())[0];
  13 |   await page.goto(`/marques/${brand.slug}`);
  14 |   await expect(page.getByRole('heading', { level: 1 })).toContainText(brand.name);
  15 |   await expect(page.locator('.product-card').first()).toBeVisible();
  16 | 
  17 |   const category = (await (await request.get('/api/v1/product-types')).json())[0];
  18 |   await page.goto(`/soins/${category.slug}`);
  19 |   await expect(page.getByRole('heading', { level: 1 })).toContainText(category.name);
  20 |   await page.getByRole('search').first().getByRole('textbox').fill('COSRX');
  21 |   await expect(page.locator('.search-popover')).toBeVisible();
  22 |   await page.getByRole('search').first().getByRole('textbox').press('Enter');
  23 |   await expect(page).toHaveURL(/\/recherche\?q=COSRX/);
  24 |   await expect(page.locator('.product-card').first()).toBeVisible();
  25 | 
  26 |   await page.locator('.product-card').first().getByRole('link', { name: /^Voir / }).click();
  27 |   await expect(page).toHaveURL(/\/produits\//);
  28 |   await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  29 |   await page.goto('/packs/duo-double-nettoyage');
  30 |   await expect(page.getByRole('heading', { name: 'Duo Double Nettoyage' })).toBeVisible();
  31 |   expect(errors).toEqual([]);
  32 | });
  33 | 
  34 | test('mobile menu and filters remain usable at common widths', async ({ page }) => {
  35 |   for (const width of [375, 390, 430, 768, 1024, 1280, 1440]) {
  36 |     await page.setViewportSize({ width, height: 900 });
  37 |     await page.goto('/soins');
> 38 |     await expect(page.getByRole('heading', { level: 1, name: 'Les soins' })).toBeVisible();
     |                                                                              ^ Error: expect(locator).toBeVisible() failed
  39 |     await page.goto('/boutique');
  40 |     await expect(page.locator('.product-card').first()).toBeVisible();
  41 |     const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  42 |     expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(2);
  43 |     if (width <= 760) {
  44 |       await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
  45 |       await expect(page.getByRole('dialog', { name: 'Menu mobile' })).toBeVisible();
  46 |       await page.getByRole('button', { name: 'Fermer le menu' }).click();
  47 |       await page.getByRole('button', { name: 'Filtrer' }).click();
  48 |       await expect(page.locator('.filter-panel.open')).toBeVisible();
  49 |       await page.getByRole('button', { name: 'Fermer les filtres' }).click();
  50 |     }
  51 |   }
  52 | });
  53 | 
  54 | test('collection filter stays in the URL through back, forward and reload', async ({ page }) => {
  55 |   await page.goto('/boutique');
  56 |   const pills = page.locator('.quick-pills');
  57 |   await expect(pills).toBeVisible();
  58 |   const selected = pills.getByRole('button').nth(1);
  59 |   const name = await selected.textContent();
  60 |   await selected.click();
  61 |   await expect(page).toHaveURL(/\?type=/);
  62 |   await expect(pills.getByRole('button', { name })).toHaveClass(/active/);
  63 |   await page.goBack();
  64 |   await expect(page).toHaveURL(/\/boutique$/);
  65 |   await page.goForward();
  66 |   await page.reload();
  67 |   await expect(pills.getByRole('button', { name })).toHaveClass(/active/);
  68 |   await expect(page.locator('.product-card').first()).toBeVisible();
  69 | });
  70 | 
  71 | test('pack enters the cart, city quote updates, and COD order reaches its receipt', async ({ page }) => {
  72 |   await page.goto('/packs/duo-double-nettoyage');
  73 |   await page.getByRole('button', { name: 'Ajouter le pack au panier' }).click();
  74 |   await page.getByRole('button', { name: /Panier, / }).click();
  75 |   await expect(page.getByRole('dialog', { name: 'Mon panier' })).toContainText('Duo Double Nettoyage');
  76 |   await page.getByRole('link', { name: 'Continuer ma commande' }).click();
  77 |   await expect(page).toHaveURL(/\/checkout$/);
  78 |   await expect(page.getByRole('heading', { name: 'Finaliser ma commande' })).toBeVisible();
  79 |   await page.locator('select[name="city_id"]').selectOption({ label: 'Casablanca' });
  80 |   await expect(page.locator('.checkout-summary')).toContainText('Livraison');
  81 |   await expect(page.locator('.checkout-summary')).toContainText('Total à régler');
  82 |   await page.locator('input[name="first_name"]').fill('Test');
  83 |   await page.locator('input[name="last_name"]').fill('Gallery');
  84 |   await page.locator('input[name="phone"]').fill('0612345678');
  85 |   await page.locator('input[name="address"]').fill('12 rue du Test');
  86 |   await page.locator('input[name="district"]').fill('Centre');
  87 |   await page.getByRole('button', { name: 'Commander' }).click();
  88 |   await expect(page).toHaveURL(/\/commande\/[^/]+\/confirmation$/);
  89 |   await expect(page.getByRole('heading', { name: 'Commande reçue' })).toBeVisible();
  90 | });
  91 | 
```