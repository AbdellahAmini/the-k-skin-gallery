#!/usr/bin/env node
import { createServer, loadEnv } from 'vite';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clientDir = path.join(root, 'dist', 'client');
const fileEnv = loadEnv('production', root, '');
const apiOrigin = (process.env.GALLERY_API_ORIGIN || fileEnv.GALLERY_API_ORIGIN || 'http://127.0.0.1:8000').replace(/\/$/, '');
const publicUrl = (process.env.PUBLIC_SITE_URL || fileEnv.PUBLIC_SITE_URL || '').replace(/\/$/, '');

async function api(pathname) {
  const response = await fetch(`${apiOrigin}/api${pathname}`);
  if (!response.ok) throw new Error(`GET /api${pathname} returned ${response.status}`);
  return response.json();
}

async function fetchAllProducts() {
  const rows = [];
  let page = 1;
  let pages = 1;
  do {
    const response = await api(`/products?page_size=100&page=${page}`);
    rows.push(...response.products);
    pages = response.pages;
    page += 1;
  } while (page <= pages);
  return rows;
}

const [allProducts, navigation, routines, bundles, cities, settings, content, articles] = await Promise.all([
  fetchAllProducts(), api('/navigation'), api('/routines'), api('/bundles'), api('/cities'), api('/settings'), api('/content'), api('/articles'),
]);
const { brands, product_types: categories, skin_types: skinTypes, concerns } = navigation;
const commonData = { brands, categories, skinTypes, concerns, routines, bundles, cities, settings, content, articles };
const adviceArticles = await Promise.all(articles.map((article) => api(`/articles/${article.slug}`)));

const pages = [
  { path: '/', title: 'K-Skin Gallery — Korean Skincare au Maroc', description: 'Une sélection de soins coréens authentiques, livrés partout au Maroc. Paiement à la livraison.', products: homeProducts() },
  { path: '/boutique', title: 'Toute la boutique | K-Skin Gallery', description: 'Découvrez les soins coréens sélectionnés par la Gallery.', products: allProducts.slice(0, 24) },
  { path: '/incontournables', title: 'Nos incontournables | K-Skin Gallery', description: 'La sélection de la Gallery.', products: allProducts.filter((product) => product.featured) },
  { path: '/nouveautes', title: 'Nouveautés | K-Skin Gallery', description: 'Les dernières nouveautés de notre sélection de skincare coréenne.', products: allProducts.filter((product) => product.new_arrival && !(product.compare_at_dh > product.price_dh)) },
  { path: '/promotions', title: 'Promotions | K-Skin Gallery', description: 'Retrouvez les soins coréens actuellement en promotion.', products: allProducts.filter((product) => product.compare_at_dh > product.price_dh) },
  { path: '/marques', title: 'Nos marques | K-Skin Gallery', description: 'Parcourez les marques officielles de skincare coréenne.', products: [] },
  { path: '/soins', title: 'Les soins | K-Skin Gallery', description: 'Nettoyer, préparer, traiter, hydrater et protéger : parcourez les catégories de soins coréens.', products: [] },
  { path: '/peau', title: 'Votre peau | K-Skin Gallery', description: 'Choisissez votre type de peau ou le besoin qui vous concerne.', products: [] },
  { path: '/type-de-peau', title: 'Choisir selon votre type de peau | K-Skin Gallery', description: 'Explorez la sélection selon votre type de peau.', products: [] },
  { path: '/besoins', title: 'Vos besoins | K-Skin Gallery', description: 'Explorez la sélection selon vos besoins.', products: [] },
  { path: '/routines', title: 'Routines | K-Skin Gallery', description: 'Des routines de soin simples, à construire à votre rythme.', products: [] },
  { path: '/packs', title: 'Packs | K-Skin Gallery', description: 'Des soins réunis en packs.', products: [] },
  { path: '/conseils', title: 'Conseils | K-Skin Gallery', description: 'Conseils simples pour composer sa routine.', products: [] },
  ...adviceArticles.map((article) => ({ path: `/conseils/${article.slug}`, title: `${article.title} | K-Skin Gallery`, description: article.excerpt, products: [], adviceArticles: [article] })),
  { path: '/recherche', title: 'Recherche | K-Skin Gallery', description: 'Recherchez un produit ou une marque dans la sélection Gallery.', products: [] },
  { path: '/panier', title: 'Mon panier | K-Skin Gallery', description: 'Consultez votre panier K-Skin Gallery.', products: [] },
  { path: '/checkout', title: 'Finaliser ma commande | K-Skin Gallery', description: 'Finalisez votre commande avec paiement à la livraison.', products: [] },
  { path: '/favoris', title: 'Mes favoris | K-Skin Gallery', description: 'Retrouvez vos soins favoris.', products: [] },
  { path: '/connexion', title: 'Connexion | K-Skin Gallery', description: 'Connectez-vous à votre compte Gallery.', products: [] },
  { path: '/inscription', title: 'Créer un compte | K-Skin Gallery', description: 'Créez votre compte K-Skin Gallery.', products: [] },
  ...['contact', 'faq', 'livraison', 'retours', 'cgv', 'confidentialite'].map((name) => ({
    path: `/${name}`, title: `${pageLabel(name)} | K-Skin Gallery`, description: `${pageLabel(name)} de K-Skin Gallery.`, products: [],
  })),
  ...brands.map((brand) => ({ path: `/marques/${brand.slug}`, title: `${brand.name} | K-Skin Gallery`, description: `Découvrez les soins ${brand.name} disponibles chez K-Skin Gallery.`, products: allProducts.filter((product) => product.brand_slug === brand.slug).slice(0, 24) })),
  ...categories.map((category) => ({ path: `/soins/${category.slug}`, title: `${category.name} | K-Skin Gallery`, description: `Découvrez notre sélection de ${category.name.toLocaleLowerCase('fr-FR')}.`, products: allProducts.filter((product) => product.category_slug === category.slug).slice(0, 24) })),
  ...skinTypes.map((skin) => ({ path: `/type-de-peau/${skin.slug}`, title: `${skin.name} | K-Skin Gallery`, description: `Soins sélectionnés pour ${skin.name.toLocaleLowerCase('fr-FR')}.`, products: allProducts.filter((p) => p.skin_types.some((value) => value.slug === skin.slug)).slice(0, 24) })),
  ...concerns.map((concern) => ({ path: `/besoins/${concern.slug}`, title: `${concern.name} | K-Skin Gallery`, description: `Soins sélectionnés pour ${concern.name.toLocaleLowerCase('fr-FR')}.`, products: allProducts.filter((p) => p.concerns.some((value) => value.slug === concern.slug)).slice(0, 24) })),
  ...routines.map((routine) => ({ path: `/routines/${routine.slug}`, title: `${routine.name} | K-Skin Gallery`, description: routine.description, products: routine.steps.flatMap((step) => step.products) })),
  ...bundles.map((bundle) => ({ path: `/packs/${bundle.slug}`, title: `${bundle.name} | K-Skin Gallery`, description: bundle.description, products: bundle.items.map((item) => item.product) })),
  ...allProducts.map((product) => {
    const related = allProducts.filter((item) => item.id !== product.id && item.category_slug === product.category_slug).slice(0, 4);
    const short = product.short_description?.trim();
    const description = (product.seo_description || short || `${product.brand} ${product.name}, découvrez sa fiche chez K-Skin Gallery au Maroc.`).slice(0, 155);
    return { path: `/produits/${product.slug}`, title: product.seo_title || `${product.name} | K-Skin Gallery`, description, products: [product, ...related], product };
  }),
];

function homeProducts() {
  const promotions = allProducts.filter((product) => product.price_dh > 0 && product.compare_at_dh > product.price_dh).slice(0, 10);
  const fresh = allProducts.filter((product) => product.new_arrival && !(product.compare_at_dh > product.price_dh)).slice(0, 5);
  return [...new Map([...promotions, ...fresh].map((product) => [product.id, product])).values()];
}

function initialCollection(pathname) {
  let rows;
  if (pathname === '/boutique') rows = allProducts;
  else if (pathname === '/incontournables') rows = allProducts.filter((p) => p.featured);
  else if (pathname === '/nouveautes') rows = allProducts.filter((p) => p.new_arrival && !(p.compare_at_dh > p.price_dh));
  else if (pathname === '/promotions') rows = allProducts.filter((p) => p.compare_at_dh > p.price_dh);
  else {
    const [, group, slug] = pathname.split('/');
    if (group === 'marques' && slug) rows = allProducts.filter((p) => p.brand_slug === slug);
    if (group === 'soins' && slug) rows = allProducts.filter((p) => p.category_slug === slug);
    if (group === 'type-de-peau' && slug) rows = allProducts.filter((p) => p.skin_types.some((s) => s.slug === slug));
    if (group === 'besoins' && slug) rows = allProducts.filter((p) => p.concerns.some((s) => s.slug === slug));
  }
  if (!rows) return null;
  return { products: rows.slice(0, 24), total: rows.length, page: 1, page_size: 24,
    pages: Math.max(1, Math.ceil(rows.length / 24)), available_facets: {},
    available_sorts: ['relevance', 'newest', 'price_asc', 'price_desc'] };
}

function pageLabel(value) {
  return ({
    cgv: 'Conditions générales de vente', confidentialite: 'Politique de confidentialité',
    livraison: 'Livraison', retours: 'Retours', faq: 'Questions fréquentes', contact: 'Contact'
  })[value] || value;
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function metadata(page) {
  const meta = [`<meta property="og:type" content="${page.product ? 'product' : 'website'}" />`,
  `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
  `<meta property="og:description" content="${escapeHtml(page.description)}" />`];
  if (page.path === '/') meta.push('<link rel="preload" as="image" href="/assets/gallery-hero.png" fetchpriority="high" />');
  if (publicUrl) meta.push(`<link rel="canonical" href="${escapeHtml(publicUrl + page.path)}" />`);
  if (page.product) {
    const product = page.product;
    const image = product.image_url.startsWith('http') ? product.image_url : publicUrl ? `${publicUrl}${product.image_url}` : undefined;
    const schema = {
      '@context': 'https://schema.org', '@type': 'Product', name: product.name, sku: product.sku,
      brand: { '@type': 'Brand', name: product.brand }, description: page.description,
      ...(image ? { image } : {}), offers: {
        '@type': 'Offer', priceCurrency: 'MAD', price: product.price_dh,
        availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
      }
    };
    meta.push(`<script type="application/ld+json">${safeJson(schema)}</script>`);
  }
  return meta.join('\n  ');
}

function routeFilename(route) {
  if (route === '/') return path.join(clientDir, 'index.html');
  const pathname = new URL(route, 'https://gallery.invalid').pathname;
  return path.join(clientDir, ...pathname.split('/').filter(Boolean), 'index.html');
}

const template = await readFile(path.join(clientDir, 'index.html'), 'utf8');
const manifest = JSON.parse(await readFile(path.join(clientDir, '.vite', 'manifest.json'), 'utf8'));
const vite = await createServer({ configFile: path.join(root, 'vite.config.mjs'), server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });

function routeEntry(pathname) {
  if (pathname === '/') return 'src/pages/Home.jsx';
  if (pathname.startsWith('/produits/')) return 'src/pages/ProductDetail.jsx';
  if (/^\/(routines|packs)\//.test(pathname)) return 'src/pages/GuidedPages.jsx';
  if (pathname.startsWith('/commande/')) return 'src/pages/Receipt.jsx';
  if (pathname === '/checkout') return 'src/pages/Checkout.jsx';
  if (pathname === '/panier') return 'src/pages/CartPage.jsx';
  if (pathname.startsWith('/connexion') || pathname.startsWith('/inscription') || pathname.startsWith('/compte')) return 'src/pages/Account.jsx';
  if (pathname.startsWith('/admin')) return 'src/pages/Admin.jsx';
  if (pathname === '/conseils' || pathname.startsWith('/conseils/')) return 'src/pages/Advice.jsx';
  if (['/boutique', '/nouveautes', '/incontournables', '/marques', '/soins', '/peau', '/type-de-peau', '/besoins', '/routines', '/packs', '/promotions', '/recherche', '/favoris'].includes(pathname)
    || /^\/(marques|soins|type-de-peau|besoins)\//.test(pathname)) return 'src/pages/CatalogPages.jsx';
  if (['/contact', '/faq', '/livraison', '/retours', '/cgv', '/confidentialite'].includes(pathname)) return 'src/pages/Info.jsx';
  return null;
}

function routePreloads(pathname) {
  const entryKey = routeEntry(pathname);
  const entry = entryKey && manifest[entryKey];
  if (!entry) return '';
  const files = new Set();
  function visit(item) {
    for (const imported of item.imports || []) {
      const dependency = manifest[imported];
      if (dependency && !files.has(dependency.file)) {
        files.add(dependency.file);
        visit(dependency);
      }
    }
    if (item.file) files.add(item.file);
  }
  visit(entry);
  files.delete(manifest['src/main.jsx']?.file);
  return [...files].map((file) => `<link rel="modulepreload" crossorigin href="/${file}" />`).join('\n  ');
}

try {
  const { render } = await vite.ssrLoadModule('/src/entry-server.jsx');
  for (const page of pages) {
    const collectionResult = initialCollection(page.path);
    const initialData = { ...commonData, initialPath: page.path, products: collectionResult?.products || page.products,
      collectionResult, adviceArticles: page.adviceArticles || [] };
    const markup = await render(page.path, initialData);
    const rootHtml = `<div id="root">${markup}</div><script id="gallery-initial-data" type="application/json">${safeJson(initialData)}</script>`;
    const headTags = metadata(page);
    const html = template
      .replace('<div id="root"></div>', rootHtml)
      .replace(/<meta name="description"[\s\S]*?\/>/, `<meta name="description" content="${escapeHtml(page.description)}" />`)
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(page.title)}</title>\n  ${headTags}`)
      .replace('</head>', `  ${routePreloads(page.path)}\n</head>`);
    const output = routeFilename(page.path);
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, html);
  }
} finally {
  await vite.close();
}

if (publicUrl) {
  const urls = pages.filter((page) => page.path === '/' || page.path === '/boutique' ||
    /^\/(produits|marques|soins|type-de-peau|besoins|routines|packs|conseils)\//.test(page.path));
  const body = urls.map((page) => `  <url><loc>${escapeHtml(publicUrl + page.path)}</loc></url>`).join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  await writeFile(path.join(clientDir, 'sitemap.xml'), sitemap);
  await writeFile(path.join(clientDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${publicUrl}/sitemap.xml\n`);
}

console.log(`Pre-rendered ${pages.length} storefront routes from ${allProducts.length} active products.`);
