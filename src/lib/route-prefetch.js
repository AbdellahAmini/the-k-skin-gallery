const loaders = {
  home: () => import('../pages/Home.jsx'),
  catalog: () => import('../pages/CatalogPages.jsx'),
  product: () => import('../pages/ProductDetail.jsx'),
  guided: () => import('../pages/GuidedPages.jsx'),
  cart: () => import('../pages/CartPage.jsx'),
  checkout: () => import('../pages/Checkout.jsx'),
  receipt: () => import('../pages/Receipt.jsx'),
  account: () => import('../pages/Account.jsx'),
  info: () => import('../pages/Info.jsx'),
  advice: () => import('../pages/Advice.jsx'),
  admin: () => import('../pages/Admin.jsx'),
};

const pending = new Map();

export function loadRouteModule(name) {
  if (!pending.has(name)) pending.set(name, loaders[name]().catch((error) => {
    pending.delete(name);
    throw error;
  }));
  return pending.get(name);
}

export function routeModuleFor(pathname) {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/produits/')) return 'product';
  if (/^\/(routines|packs)\//.test(pathname)) return 'guided';
  if (pathname.startsWith('/commande/')) return 'receipt';
  if (pathname === '/checkout') return 'checkout';
  if (pathname === '/panier') return 'cart';
  if (pathname.startsWith('/connexion') || pathname.startsWith('/inscription') || pathname.startsWith('/compte')) return 'account';
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname === '/conseils' || pathname.startsWith('/conseils/')) return 'advice';
  if (['/boutique', '/nouveautes', '/incontournables', '/marques', '/soins', '/peau', '/type-de-peau', '/besoins', '/routines', '/packs', '/promotions', '/recherche', '/favoris'].includes(pathname)
    || /^\/(marques|soins|type-de-peau|besoins)\//.test(pathname)) return 'catalog';
  if (['/contact', '/faq', '/livraison', '/retours', '/cgv', '/confidentialite'].includes(pathname)) return 'info';
  return null;
}

export function prefetchRoute(pathname) {
  const moduleName = routeModuleFor(pathname);
  return moduleName ? loadRouteModule(moduleName) : Promise.resolve(null);
}
