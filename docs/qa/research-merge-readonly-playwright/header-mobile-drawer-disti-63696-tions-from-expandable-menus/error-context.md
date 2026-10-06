# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: header.spec.mjs >> mobile drawer distinguishes destinations from expandable menus
- Location: tests\e2e\header.spec.mjs:66:1

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.click: Test timeout of 45000ms exceeded.
Call log:
  - waiting for getByRole('dialog', { name: 'Menu mobile' }).getByRole('button', { name: 'Soins', exact: true })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - button "Ouvrir le menu" [active] [ref=e6] [cursor=pointer]
      - link "K-Skin Gallery, accueil" [ref=e9] [cursor=pointer]:
        - /url: /
        - img "K-Skin Gallery — Korean Skincare" [ref=e10]
      - generic [ref=e11]:
        - button "Ouvrir la recherche" [ref=e12] [cursor=pointer]
        - button "Panier, 0 article" [ref=e15] [cursor=pointer]:
          - generic [ref=e16]: "0"
    - generic "Nos engagements" [ref=e20]:
      - generic [ref=e21]:
        - generic [ref=e22]:
          - generic [ref=e23]: Livraison 24–48h
          - generic [aria-hidden] [ref=e27]: ✦
          - generic [aria-hidden] [ref=e28]: ✦
          - generic [ref=e29]: Produits authentiques
          - generic [aria-hidden] [ref=e33]: ✦
          - generic [ref=e34]: Assistance 7j/7
          - generic [aria-hidden] [ref=e38]: ✦
        - generic [aria-hidden] [ref=e39]:
          - generic [ref=e40]: Livraison 24–48h
          - generic [aria-hidden] [ref=e44]: ✦
          - generic [aria-hidden] [ref=e45]: ✦
          - generic [ref=e46]: Produits authentiques
          - generic [aria-hidden] [ref=e50]: ✦
          - generic [ref=e51]: Assistance 7j/7
          - generic [aria-hidden] [ref=e55]: ✦
  - main [ref=e56]:
    - navigation "Fil d’Ariane" [ref=e57]:
      - link "Accueil" [ref=e58] [cursor=pointer]:
        - /url: /
      - generic [ref=e59]: / Nos marques
    - generic [ref=e60]:
      - paragraph [ref=e61]: La Gallery
      - heading "Nos marques" [level=1] [ref=e62]
      - paragraph [ref=e63]: Explorez notre sélection à votre rythme.
    - generic [ref=e64]:
      - heading "Nos marques" [level=2] [ref=e65]
      - generic [ref=e66]:
        - link "AXIS-Y 7 produits sélectionnés" [ref=e67] [cursor=pointer]:
          - /url: /marques/axis-y
          - generic [ref=e68]: AXIS-Y
          - generic [ref=e69]: 7 produits sélectionnés
        - link "Anua 8 produits sélectionnés" [ref=e72] [cursor=pointer]:
          - /url: /marques/anua
          - generic [ref=e73]: Anua
          - generic [ref=e74]: 8 produits sélectionnés
        - link "Arencia 5 produits sélectionnés" [ref=e77] [cursor=pointer]:
          - /url: /marques/arencia
          - generic [ref=e78]: Arencia
          - generic [ref=e79]: 5 produits sélectionnés
        - link "Beauty of Joseon 7 produits sélectionnés" [ref=e82] [cursor=pointer]:
          - /url: /marques/beauty-of-joseon
          - generic [ref=e83]: Beauty of Joseon
          - generic [ref=e84]: 7 produits sélectionnés
        - link "Biodance 5 produits sélectionnés" [ref=e87] [cursor=pointer]:
          - /url: /marques/biodance
          - generic [ref=e88]: Biodance
          - generic [ref=e89]: 5 produits sélectionnés
        - link "COSRX 1 produit sélectionné" [ref=e92] [cursor=pointer]:
          - /url: /marques/cosrx
          - generic [ref=e93]: COSRX
          - generic [ref=e94]: 1 produit sélectionné
        - link "Celimax 1 produit sélectionné" [ref=e97] [cursor=pointer]:
          - /url: /marques/celimax
          - generic [ref=e98]: Celimax
          - generic [ref=e99]: 1 produit sélectionné
        - link "Dr. Althea 7 produits sélectionnés" [ref=e102] [cursor=pointer]:
          - /url: /marques/dr-althea
          - generic [ref=e103]: Dr. Althea
          - generic [ref=e104]: 7 produits sélectionnés
        - link "Dr.Melaxin 2 produits sélectionnés" [ref=e107] [cursor=pointer]:
          - /url: /marques/dr-melaxin
          - generic [ref=e108]: Dr.Melaxin
          - generic [ref=e109]: 2 produits sélectionnés
        - link "Mary&May 1 produit sélectionné" [ref=e112] [cursor=pointer]:
          - /url: /marques/mary-may
          - generic [ref=e113]: Mary&May
          - generic [ref=e114]: 1 produit sélectionné
        - link "Medicube 9 produits sélectionnés" [ref=e117] [cursor=pointer]:
          - /url: /marques/medicube
          - generic [ref=e118]: Medicube
          - generic [ref=e119]: 9 produits sélectionnés
        - link "SKIN1004 24 produits sélectionnés" [ref=e122] [cursor=pointer]:
          - /url: /marques/skin1004
          - generic [ref=e123]: SKIN1004
          - generic [ref=e124]: 24 produits sélectionnés
        - link "SOME BY MI 12 produits sélectionnés" [ref=e127] [cursor=pointer]:
          - /url: /marques/some-by-mi
          - generic [ref=e128]: SOME BY MI
          - generic [ref=e129]: 12 produits sélectionnés
        - link "Shiseido Fino 1 produit sélectionné" [ref=e132] [cursor=pointer]:
          - /url: /marques/shiseido-fino
          - generic [ref=e133]: Shiseido Fino
          - generic [ref=e134]: 1 produit sélectionné
        - link "got2b 1 produit sélectionné" [ref=e137] [cursor=pointer]:
          - /url: /marques/got2b
          - generic [ref=e138]: got2b
          - generic [ref=e139]: 1 produit sélectionné
        - link "numbuzin 3 produits sélectionnés" [ref=e142] [cursor=pointer]:
          - /url: /marques/numbuzin
          - generic [ref=e143]: numbuzin
          - generic [ref=e144]: 3 produits sélectionnés
  - contentinfo [ref=e147]:
    - generic [ref=e148]:
      - generic [ref=e149]:
        - link [ref=e150] [cursor=pointer]:
          - /url: /
          - img "K-Skin Gallery" [ref=e151]
        - paragraph [ref=e152]: Une sélection coréenne, tout près de vous.
      - generic [ref=e153]:
        - heading "La Gallery" [level=2] [ref=e154]
        - link "Boutique" [ref=e155] [cursor=pointer]:
          - /url: /boutique
        - link "Nouveautés" [ref=e156] [cursor=pointer]:
          - /url: /nouveautes
        - link "Promotions" [ref=e157] [cursor=pointer]:
          - /url: /promotions
        - link "Marques" [ref=e158] [cursor=pointer]:
          - /url: /marques
        - link "Routines" [ref=e159] [cursor=pointer]:
          - /url: /routines
        - link "Packs" [ref=e160] [cursor=pointer]:
          - /url: /packs
        - link "Conseils" [ref=e161] [cursor=pointer]:
          - /url: /conseils
      - generic [ref=e162]:
        - heading "Aide" [level=2] [ref=e163]
        - link "FAQ" [ref=e164] [cursor=pointer]:
          - /url: /faq
        - link "Livraison" [ref=e165] [cursor=pointer]:
          - /url: /livraison
        - link "Retours" [ref=e166] [cursor=pointer]:
          - /url: /retours
        - link "Contact" [ref=e167] [cursor=pointer]:
          - /url: /contact
      - generic [ref=e168]:
        - heading "Informations" [level=2] [ref=e169]
        - link "Conditions de vente" [ref=e170] [cursor=pointer]:
          - /url: /cgv
        - link "Confidentialité" [ref=e171] [cursor=pointer]:
          - /url: /confidentialite
    - generic [ref=e172]:
      - generic [ref=e173]: © 2026 K-Skin Gallery
      - generic [ref=e174]: Paiement à la livraison · Livraison au Maroc · Produits authentiques
  - navigation "Navigation mobile" [ref=e175]:
    - link "Accueil" [ref=e176] [cursor=pointer]:
      - /url: /
    - link "Boutique" [ref=e180] [cursor=pointer]:
      - /url: /boutique
    - link "Recherche" [ref=e184] [cursor=pointer]:
      - /url: /recherche
    - link "Favoris" [ref=e188] [cursor=pointer]:
      - /url: /favoris
    - link "Compte" [ref=e192] [cursor=pointer]:
      - /url: /connexion
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | test('sticky header and dropdown panels fit desktop widths', async ({ page }) => {
  4  |   const errors = [];
  5  |   page.on('pageerror', (error) => errors.push(error.message));
  6  |   for (const width of [1024, 1280, 1440, 1600]) {
  7  |     await page.setViewportSize({ width, height: 900 });
  8  |     await page.goto('/');
  9  |     const nav = page.getByRole('navigation', { name: 'Navigation principale' });
  10 |     await expect(nav.getByRole('link')).toHaveCount(6);
  11 |     await expect(nav.getByRole('button')).toHaveCount(4);
  12 |     for (const label of ['Marques', 'Soins', 'Peau', 'Routines & Packs']) {
  13 |       await nav.getByRole('link', { name: label }).hover();
  14 |       const panel = page.getByRole('region', { name: `Explorer ${label}` });
  15 |       await expect(panel).toBeVisible();
  16 |       const bounds = await panel.boundingBox();
  17 |       expect(bounds.x, `${label} left edge at ${width}`).toBeGreaterThanOrEqual(0);
  18 |       expect(bounds.x + bounds.width, `${label} right edge at ${width}`).toBeLessThanOrEqual(width);
  19 |       expect(bounds.y + bounds.height, `${label} height at ${width}`).toBeLessThan(900);
  20 |     }
  21 |     await page.evaluate(() => scrollTo(0, 450));
  22 |     await expect.poll(() => page.locator('.site-header').evaluate((el) => Math.round(el.getBoundingClientRect().top))).toBe(0);
  23 |     await expect(page.locator('.trust-marquee')).toBeVisible();
  24 |     expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(2);
  25 |   }
  26 |   expect(errors).toEqual([]);
  27 | });
  28 | 
  29 | test('desktop menus have distinct layouts and accessible interactions', async ({ page }) => {
  30 |   await page.setViewportSize({ width: 1440, height: 900 });
  31 |   await page.goto('/');
  32 |   const nav = page.getByRole('navigation', { name: 'Navigation principale' });
  33 |   const brands = nav.getByRole('link', { name: 'Marques' });
  34 |   await brands.hover();
  35 |   await page.waitForTimeout(170);
  36 |   const brandMenu = page.getByRole('region', { name: 'Explorer Marques' });
  37 |   await expect(brandMenu).toBeVisible();
  38 |   await expect(brandMenu.locator('.gallery-mega-heading > span')).toHaveText('Marques');
  39 |   await expect(brandMenu.getByRole('heading', { name: 'Marques populaires' })).toHaveCount(0);
  40 |   await expect(brandMenu.locator('.gallery-mega-heading').getByRole('link', { name: 'Toutes les marques' })).toHaveAttribute('href', '/marques');
  41 |   await expect(brandMenu.getByRole('heading', { name: 'Toutes les marques' })).toHaveCount(0);
  42 |   await brandMenu.getByRole('link', { name: 'Anua' }).first().hover();
  43 |   await expect(brandMenu).toBeVisible();
  44 |   for (const [label, headings] of [
  45 |     ['Soins', ['Nettoyer', 'Préparer & traiter', 'Hydrater & protéger']],
  46 |     ['Peau', ['Type de peau', 'Besoins']],
  47 |     ['Routines & Packs', ['Routines', 'Packs']],
  48 |   ]) {
  49 |     await nav.getByRole('link', { name: label }).hover();
  50 |     const panel = page.getByRole('region', { name: `Explorer ${label}` });
  51 |     await expect(panel).toBeVisible();
  52 |     for (const heading of headings) await expect(panel.getByRole('heading', { name: heading })).toBeVisible();
  53 |   }
  54 |   await page.keyboard.press('Escape');
  55 |   await expect(page.locator('.gallery-mega')).toBeHidden();
  56 |   const trigger = nav.getByRole('button', { name: 'Afficher le menu Marques' });
  57 |   await trigger.focus();
  58 |   await trigger.press('Enter');
  59 |   await expect(brandMenu).toBeVisible();
  60 |   await page.mouse.click(1400, 700);
  61 |   await expect(page.locator('.gallery-mega')).toBeHidden();
  62 |   await brands.click();
  63 |   await expect(page).toHaveURL(/\/marques$/);
  64 | });
  65 | 
  66 | test('mobile drawer distinguishes destinations from expandable menus', async ({ page }) => {
  67 |   await page.setViewportSize({ width: 390, height: 844 });
  68 |   await page.goto('/');
  69 |   await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
  70 |   const drawer = page.getByRole('dialog', { name: 'Menu mobile' });
  71 |   await expect(drawer.locator('.gallery-mobile-link')).toHaveCount(3);
  72 |   await expect(drawer.locator('.gallery-mobile-trigger')).toHaveCount(4);
  73 |   await drawer.getByRole('button', { name: 'Marques', exact: true }).click();
  74 |   const brandPanel = drawer.locator('#mobile-brands');
  75 |   await expect(brandPanel.getByRole('link', { name: 'Toutes les marques' })).toBeVisible();
  76 |   expect(await brandPanel.getByRole('link').count()).toBeGreaterThan(5);
  77 |   await brandPanel.getByRole('link', { name: 'Toutes les marques' }).click();
  78 |   await expect(page).toHaveURL(/\/marques$/);
  79 |   await expect(drawer).toHaveCount(0);
  80 |   await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
> 81 |   await drawer.getByRole('button', { name: 'Soins', exact: true }).click();
     |                                                                    ^ Error: locator.click: Test timeout of 45000ms exceeded.
  82 |   await expect(drawer.getByRole('link', { name: 'Sérums & Ampoules' })).toBeVisible();
  83 |   await drawer.getByRole('link', { name: 'Sérums & Ampoules' }).click();
  84 |   await expect(page).toHaveURL(/\/soins\/serums-ampoules$/);
  85 | });
  86 | 
```