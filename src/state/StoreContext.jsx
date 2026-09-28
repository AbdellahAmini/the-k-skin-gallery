import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const StoreContext = createContext(null);
const read = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(window.localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const cartKey = (line) => line.bundle_id ? `bundle:${line.bundle_id}` : `product:${line.product_id}`;

export function StoreProvider({ children, initialData = null }) {
  const [products, setProducts] = useState(initialData?.products || []);
  const [brands, setBrands] = useState(initialData?.brands || []);
  const [categories, setCategories] = useState(initialData?.categories || []);
  const [skinTypes, setSkinTypes] = useState(initialData?.skinTypes || []);
  const [concerns, setConcerns] = useState(initialData?.concerns || []);
  const [routines, setRoutines] = useState(initialData?.routines || []);
  const [bundles, setBundles] = useState(initialData?.bundles || []);
  const [cities, setCities] = useState(initialData?.cities || []);
  const [settings, setSettings] = useState(initialData?.settings || {});
  const [content, setContent] = useState(initialData?.content || {});
  const [articles, setArticles] = useState(initialData?.articles || []);
  const [adviceArticles] = useState(initialData?.adviceArticles || []);
  // Keep the first client render identical to the server. Guest storage is read
  // after hydration so a saved cart cannot cause a markup mismatch.
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [storageReady, setStorageReady] = useState(false);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(Boolean(initialData));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    setCart(read('gallery-cart', []));
    setWishlist(read('gallery-wishlist', []));
    setStorageReady(true);
  }, []);

  const refreshProducts = useCallback(async () => {
    const result = await api('/products?page_size=200');
    setProducts(result.products);
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([api('/products?page_size=200'), api('/navigation'), api('/routines'), api('/bundles'), api('/cities'), api('/settings'), api('/content'), api('/articles'), api('/auth/me')])
      .then(async ([p, nav, routineRows, bundleRows, city, site, sections, advice, signedIn]) => {
        if (!alive) return;
        setProducts(p.products); setBrands(nav.brands); setCategories(nav.product_types);
        setSkinTypes(nav.skin_types); setConcerns(nav.concerns);
        setRoutines(routineRows); setBundles(bundleRows); setCities(city); setSettings(site); setContent(sections); setArticles(advice);
        if (signedIn) {
          const [serverCart, serverWish] = await Promise.all([api('/me/cart'), api('/me/wishlist')]);
          if (!alive) return;
          const guestCart = read('gallery-cart', []);
          const merged = new Map(serverCart.map((item) => [cartKey(item), item]));
          for (const item of guestCart) {
            const key = cartKey(item);
            merged.set(key, { ...item, quantity: Math.max(merged.get(key)?.quantity || 0, item.quantity) });
          }
          setCart([...merged.values()]);
          setWishlist([...new Set([...serverWish, ...read('gallery-wishlist', [])])]);
          setUser(signedIn);
        }
        setReady(true);
      }).catch((e) => { if (alive) { setError(e.message); setReady(true); } });
    return () => { alive = false; };
  }, []);

  useEffect(() => { if (storageReady) window.localStorage.setItem('gallery-cart', JSON.stringify(cart)); }, [cart, storageReady]);
  useEffect(() => { if (storageReady) window.localStorage.setItem('gallery-wishlist', JSON.stringify(wishlist)); }, [wishlist, storageReady]);
  useEffect(() => { if (ready && user) api('/me/cart', { method: 'PUT', body: { items: cart } }).catch(() => {}); }, [cart, ready, user]);
  useEffect(() => { if (ready && user) api('/me/wishlist', { method: 'PUT', body: { product_ids: wishlist } }).catch(() => {}); }, [wishlist, ready, user]);

  function flash(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3000);
  }

  function addToCart(product, quantity = 1) {
    if (!product.stock) { flash('Ce produit est actuellement indisponible.'); return; }
    setCart((current) => {
      const found = current.find((item) => item.product_id === product.id);
      if (found) return current.map((item) => item.product_id === product.id ?
        { ...item, quantity: Math.min(product.stock, item.quantity + quantity) } : item);
      return [...current, { product_id: product.id, quantity: Math.min(quantity, product.stock) }];
    });
    flash(`${product.brand} ajouté au panier`);
  }

  function addBundleToCart(bundle, quantity = 1) {
    if (!bundle.stock) { flash('Ce pack est actuellement indisponible.'); return; }
    setCart((current) => {
      const found = current.find((item) => item.bundle_id === bundle.id);
      if (found) return current.map((item) => item.bundle_id === bundle.id ?
        { ...item, quantity: Math.min(bundle.stock, item.quantity + quantity) } : item);
      return [...current, { bundle_id: bundle.id, quantity: Math.min(quantity, bundle.stock) }];
    });
    flash(`${bundle.name} ajouté au panier`);
  }

  function changeQuantity(itemId, amount, kind = 'product') {
    const item = (kind === 'bundle' ? bundles : products).find((entry) => entry.id === itemId);
    setCart((current) => current.map((line) => line[kind === 'bundle' ? 'bundle_id' : 'product_id'] === itemId ?
      { ...line, quantity: Math.max(0, Math.min(item?.stock || 0, line.quantity + amount)) } : line)
      .filter((line) => line.quantity > 0));
  }

  function removeFromCart(itemId, kind = 'product') { setCart((current) => current.filter((line) => line[kind === 'bundle' ? 'bundle_id' : 'product_id'] !== itemId)); }
  function toggleWishlist(productId) {
    setWishlist((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]);
  }

  async function authenticate(path, values) {
    const signedIn = await api(path, { method: 'POST', body: values });
    const [serverCart, serverWish] = await Promise.all([api('/me/cart'), api('/me/wishlist')]);
    const merged = new Map(serverCart.map((item) => [cartKey(item), item]));
    for (const item of cart) {
      const key = cartKey(item);
      merged.set(key, { ...item, quantity: Math.max(merged.get(key)?.quantity || 0, item.quantity) });
    }
    setCart([...merged.values()]);
    setWishlist([...new Set([...wishlist, ...serverWish])]);
    setUser(signedIn);
    return signedIn;
  }

  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    setUser(null);
  }

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const bundleById = useMemo(() => new Map(bundles.map((b) => [b.id, b])), [bundles]);
  const cartLines = useMemo(() => cart.map((line) => {
    const kind = line.bundle_id ? 'bundle' : 'product';
    const item = kind === 'bundle' ? bundleById.get(line.bundle_id) : productById.get(line.product_id);
    return { ...line, kind, item, product: kind === 'product' ? item : null,
      bundle: kind === 'bundle' ? item : null,
      path: item ? (kind === 'bundle' ? `/packs/${item.slug}` : `/produits/${item.slug}`) : '' };
  }).filter((line) => line.item), [cart, productById, bundleById]);
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cartLines.reduce((sum, line) => sum + line.item.price_dh * line.quantity, 0);

  return <StoreContext.Provider value={{ products, brands, categories, skinTypes, concerns, routines, bundles,
    cities, settings, content, articles, adviceArticles, cart, setCart,
    cartLines, cartCount, subtotal, wishlist, toggleWishlist, addToCart, addBundleToCart, changeQuantity, removeFromCart,
    user, authenticate, logout, ready, error, notice, setNotice, flash, cartOpen, setCartOpen, refreshProducts }}>
    {children}
  </StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
