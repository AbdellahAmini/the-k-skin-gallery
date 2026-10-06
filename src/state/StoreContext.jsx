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
    const [featured, fresh, promotions] = await Promise.all([
      api('/products?featured=true&page_size=8'),
      api('/products?new=true&exclude_promotion=true&sort=newest&page_size=8'),
      api('/products?promotion=true&page_size=10'),
    ]);
    setProducts((current) => [...new Map([...current, ...featured.products, ...fresh.products, ...promotions.products].map((item) => [item.id, item])).values()]);
  }, []);

  const mergeProducts = useCallback((incoming = []) => {
    if (!incoming.length) return;
    setProducts((current) => [...new Map([...current, ...incoming].map((item) => [item.id, item])).values()]);
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([api('/products?featured=true&page_size=8'), api('/products?new=true&exclude_promotion=true&sort=newest&page_size=8'), api('/products?promotion=true&page_size=10'), api('/navigation'), api('/routines'), api('/bundles'), api('/cities'), api('/settings'), api('/content'), api('/articles'), api('/auth/me')])
      .then(async ([featured, fresh, promotions, nav, routineRows, bundleRows, city, site, sections, advice, signedIn]) => {
        if (!alive) return;
        const homeProducts = [...new Map([...featured.products, ...fresh.products, ...promotions.products].map((item) => [item.id, item])).values()];
        setProducts((current) => [...new Map([...current, ...homeProducts].map((item) => [item.id, item])).values()]);
        setBrands(nav.brands); setCategories(nav.product_types);
        setSkinTypes(nav.skin_types); setConcerns(nav.concerns);
        setRoutines(routineRows); setBundles(bundleRows); setCities(city); setSettings(site); setContent(sections); setArticles(advice);
        let serverCart = [];
        let serverWish = [];
        if (signedIn) {
          [serverCart, serverWish] = await Promise.all([api('/me/cart'), api('/me/wishlist')]);
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
        const productIds = [...new Set([
          ...read('gallery-cart', []).filter((item) => item.product_id).map((item) => item.product_id),
          ...serverCart.filter((item) => item.product_id).map((item) => item.product_id),
          ...read('gallery-wishlist', []), ...serverWish,
        ])];
        if (productIds.length) {
          try {
            const savedProducts = await api(`/products?ids=${productIds.join(',')}&page_size=100`);
            if (!alive) return;
            setProducts((current) => [...new Map([...current, ...savedProducts.products].map((item) => [item.id, item])).values()]);
          } catch { /* Saved lines remain available; missing product details can be reloaded on demand. */ }
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
    mergeProducts([product]);
    if (!product.stock) { flash('Ce produit est actuellement indisponible.'); return; }
    setCart((current) => {
      const found = current.find((item) => item.product_id === product.id);
      if (found) return current.map((item) => item.product_id === product.id ?
        { ...item, quantity: Math.min(product.stock, item.quantity + quantity) } : item);
      return [...current, { product_id: product.id, quantity: Math.min(quantity, product.stock) }];
    });
    setCartOpen(true);
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
    setCartOpen(true);
    flash(`${bundle.name} ajouté au panier`);
  }

  function changeQuantity(itemId, amount, kind = 'product') {
    const item = (kind === 'bundle' ? bundles : products).find((entry) => entry.id === itemId);
    setCart((current) => current.map((line) => line[kind === 'bundle' ? 'bundle_id' : 'product_id'] === itemId ?
      { ...line, quantity: Math.max(0, Math.min(item?.stock || 0, line.quantity + amount)) } : line)
      .filter((line) => line.quantity > 0));
  }

  function removeFromCart(itemId, kind = 'product') { setCart((current) => current.filter((line) => line[kind === 'bundle' ? 'bundle_id' : 'product_id'] !== itemId)); }
  function clearCart() {
    setCart([]);
    flash('Votre panier a été vidé.');
  }
  function toggleWishlist(productId) {
    setWishlist((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]);
  }

  async function authenticate(path, values) {
    const signedIn = await api(path, { method: 'POST', body: values });
    const [serverCart, serverWish] = await Promise.all([api('/me/cart'), api('/me/wishlist')]);
    const ids = [...new Set([...serverCart.filter((item) => item.product_id).map((item) => item.product_id), ...serverWish])];
    if (ids.length) mergeProducts((await api(`/products?ids=${ids.join(',')}&page_size=100`)).products);
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
    initialCollectionResult: initialData?.collectionResult,
    initialCollectionPath: initialData?.initialPath,
    cities, settings, content, articles, adviceArticles, cart, setCart, mergeProducts,
    cartLines, cartCount, subtotal, wishlist, toggleWishlist, addToCart, addBundleToCart, changeQuantity, removeFromCart, clearCart,
    user, authenticate, logout, ready, error, notice, setNotice, flash, cartOpen, setCartOpen, refreshProducts }}>
    {children}
  </StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
