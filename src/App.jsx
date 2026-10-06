import { lazy, Suspense, useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router';
import { useStore } from './state/StoreContext';
import { StoreProvider } from './state/StoreContext';
import { BottomNav, CartDrawer, Footer, Header, Notice } from './components/SiteShell';
import SectionReveal from './components/SectionReveal';
import { loadRouteModule } from './lib/route-prefetch';

const lazyPage = (moduleName, exportName = 'default') => lazy(() =>
  loadRouteModule(moduleName).then((module) => ({ default: module[exportName] })));
const Home = lazyPage('home');
const CollectionPage = lazyPage('catalog', 'CollectionPage');
const DirectoryPage = lazyPage('catalog', 'DirectoryPage');
const FavoritesPage = lazyPage('catalog', 'FavoritesPage');
const ProductDetail = lazyPage('product');
const RoutinePage = lazyPage('guided', 'RoutinePage');
const PackPage = lazyPage('guided', 'PackPage');
const CartPage = lazyPage('cart');
const Checkout = lazyPage('checkout');
const Receipt = lazyPage('receipt');
const AccountAlerts = lazyPage('account', 'AccountAlerts');
const AccountHome = lazyPage('account', 'AccountHome');
const AccountOrder = lazyPage('account', 'AccountOrder');
const AccountOrders = lazyPage('account', 'AccountOrders');
const AuthPage = lazyPage('account', 'AuthPage');
const Info = lazyPage('info');
const AdviceDirectory = lazyPage('advice', 'AdviceDirectory');
const AdviceArticle = lazyPage('advice', 'AdviceArticle');
const Admin = lazyPage('admin');

function PageLoading() {
  return <main className="inner-page" aria-label="Chargement de la page"><div className="skeleton-grid">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton-card" />)}</div></main>;
}

function NotFound() {
  return <main className="inner-page"><div className="state-panel"><h1>Page introuvable</h1><p>Cette adresse ne correspond à aucune page de la Gallery.</p><Link className="button-primary" to="/">Retour à l’accueil</Link></div></main>;
}

function StorefrontApp() {
  const location = useLocation();
  const collection = (mode = 'all') => <CollectionPage key={location.pathname} mode={mode} />;
  const { error, brands, categories, skinTypes, concerns } = useStore();
  const isAdmin = location.pathname.startsWith('/admin');
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  useEffect(() => {
    if (location.pathname.startsWith('/produits/')) return;
    const brand = location.pathname.match(/^\/marques\/([^/]+)/)?.[1];
    const category = location.pathname.match(/^\/soins\/([^/]+)/)?.[1];
    const skin = location.pathname.match(/^\/type-de-peau\/([^/]+)/)?.[1];
    const concern = location.pathname.match(/^\/besoins\/([^/]+)/)?.[1];
    const title = brand ? brands.find((item) => item.slug === brand)?.name
      : category ? categories.find((item) => item.slug === category)?.name
      : skin ? skinTypes.find((item) => item.slug === skin)?.name
      : concern ? concerns.find((item) => item.slug === concern)?.name
      : ({ '/': 'K-Skin Gallery', '/nouveautes': 'Nouveautés', '/promotions': 'Promotions', '/boutique': 'La boutique', '/soins': 'Tous les soins', '/peau': 'Peau', '/besoins': 'Besoins', '/packs': 'Packs', '/checkout': 'Finaliser ma commande', '/panier': 'Mon panier', '/favoris': 'Mes favoris' })[location.pathname];
    document.title = location.pathname === '/' ? 'K-Skin Gallery — Korean Skincare au Maroc'
      : title ? `${title} | K-Skin Gallery` : 'K-Skin Gallery — Korean Skincare au Maroc';
  }, [location.pathname, brands, categories, skinTypes, concerns]);
  return <div className="site-shell"><SectionReveal routeKey={location.pathname} />{!isAdmin && <Header />}
    {error && <div className="api-banner" role="alert">{error}</div>}
    <Suspense fallback={<PageLoading />}><Routes>
      <Route path="/" element={<Home />} />
      <Route path="/boutique" element={collection()} /><Route path="/nouveautes" element={collection('new')} /><Route path="/incontournables" element={collection('featured')} />
      <Route path="/marques" element={<DirectoryPage kind="marques" />} /><Route path="/marques/:slug" element={collection('brand')} />
      <Route path="/soins" element={<DirectoryPage kind="soins" />} /><Route path="/soins/serums" element={<Navigate to="/soins/serums-ampoules" replace />} /><Route path="/soins/:slug" element={collection('category')} />
      <Route path="/peau" element={<DirectoryPage kind="peau" />} /><Route path="/besoins" element={<DirectoryPage kind="besoins" />} /><Route path="/besoins/hydratation" element={<Navigate to="/besoins/deshydratation" replace />} /><Route path="/besoins/:slug" element={collection('concern')} />
      <Route path="/type-de-peau" element={<DirectoryPage kind="type-de-peau" />} /><Route path="/type-de-peau/:slug" element={collection('skin')} />
      <Route path="/routines" element={<DirectoryPage kind="routines" />} /><Route path="/routines/:slug" element={<RoutinePage />} />
      <Route path="/packs" element={<DirectoryPage kind="packs" />} /><Route path="/packs/:slug" element={<PackPage />} />
      <Route path="/promotions" element={collection('promo')} /><Route path="/recherche" element={collection('search')} />
      <Route path="/favoris" element={<FavoritesPage />} /><Route path="/panier" element={<CartPage />} />
      <Route path="/produits/:slug" element={<ProductDetail />} /><Route path="/checkout" element={<Checkout />} />
      <Route path="/commande/:token/confirmation" element={<Receipt />} />
      <Route path="/connexion" element={<AuthPage />} /><Route path="/inscription" element={<AuthPage register />} />
      <Route path="/compte" element={<AccountHome />} /><Route path="/compte/commandes" element={<AccountOrders />} />
      <Route path="/compte/commandes/:id" element={<AccountOrder />} /><Route path="/compte/favoris" element={<FavoritesPage />} />
      <Route path="/compte/alertes-stock" element={<AccountAlerts />} />
      <Route path="/conseils" element={<AdviceDirectory />} /><Route path="/conseils/:slug" element={<AdviceArticle />} />
      {['contact', 'faq', 'livraison', 'retours', 'cgv', 'confidentialite'].map((type) => <Route key={type} path={`/${type}`} element={<Info type={type} />} />)}
      <Route path="/admin/*" element={<Admin />} /><Route path="*" element={<NotFound />} />
    </Routes></Suspense>
    {!isAdmin && <><Footer /><BottomNav /><CartDrawer /><Notice /></>}
  </div>;
}

// Admin is deliberately mounted outside StoreProvider. StoreProvider syncs the
// signed-in shopper cart and wishlist; those effects must never run in admin.
export default function App({ initialData = null }) {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) {
    return <div className="admin-v2-root"><SectionReveal routeKey={location.pathname} rootSelector=".admin-v2-root" /><Suspense fallback={<main className="admin-v2-loading">Loading administration…</main>}><Admin /></Suspense></div>;
  }
  return <StoreProvider initialData={initialData}><StorefrontApp /></StoreProvider>;
}
