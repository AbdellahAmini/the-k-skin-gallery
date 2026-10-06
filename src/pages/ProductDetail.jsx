import { useEffect, useState } from 'react';
import { ArrowLeft, Bag, Heart, ShieldCheck, Truck } from '@phosphor-icons/react';
import { Link, useParams } from 'react-router';
import { api, money } from '../lib/api';
import ProductImage from '../components/ProductImage';
import ProductCard from '../components/ProductCard';
import { useStore } from '../state/StoreContext';

export default function ProductDetail() {
  const { slug } = useParams();
  const { products, wishlist, toggleWishlist, addToCart, mergeProducts } = useStore();
  const initialProduct = products.find((item) => item.slug === slug) || null;
  const [product, setProduct] = useState(initialProduct);
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [alertState, setAlertState] = useState('idle');
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    const cached = products.find((item) => item.slug === slug) || null;
    setProduct(cached); setError(''); setQuantity(1); setMessage(''); setAlertState('idle');
    setSelectedImage(null);
    if (cached) document.title = `${cached.name} | K-Skin Gallery`;
    else api(`/products/${encodeURIComponent(slug)}`).then((p) => { if (alive) { setProduct(p); mergeProducts([p]); document.title = `${p.name} | K-Skin Gallery`; } })
      .catch((e) => alive && setError(e.message));
    return () => { alive = false; };
  }, [slug, products, mergeProducts]);
  if (error) return <main className="inner-page"><div className="state-panel"><h1>Produit introuvable</h1><p>{error}</p><Link className="button-primary" to="/boutique">Voir la boutique</Link></div></main>;
  if (!product) return <main className="inner-page"><div className="skeleton-pdp" /></main>;
  const related = products.filter((p) => p.id !== product.id && p.category_slug === product.category_slug).slice(0, 4);
  const isPromotion = product.compare_at_dh > product.price_dh;
  const discountPercent = isPromotion ? Math.round((product.compare_at_dh - product.price_dh) / product.compare_at_dh * 100) : 0;
  const savings = isPromotion ? product.compare_at_dh - product.price_dh : 0;
  async function alert(event) {
    event.preventDefault(); setMessage(''); setAlertState('loading');
    try {
      const result = await api('/stock-alerts', { method: 'POST', body: { product_id: product.id, email } });
      setMessage(result.message); setAlertState(result.status === 'already_subscribed' ? 'already' : 'success');
    } catch (e) { setMessage(e.message); setAlertState('error'); }
  }
  return <main className="inner-page"><nav className="breadcrumbs" aria-label="Fil d’Ariane"><Link to="/">Accueil</Link> / <Link to="/boutique">Boutique</Link> / <Link to={`/marques/${product.brand_slug}`}>{product.brand}</Link> / <span>{product.name}</span></nav>
    <div className="pdp-layout"><div><div className="pdp-image"><ProductImage src={selectedImage?.image_url || product.image_url} alt={selectedImage?.alt_text || `${product.brand} ${product.name}`} eager /></div>
      {product.images?.length > 1 && <div className="pdp-thumbnails" aria-label="Images du produit">{product.images.map((image, index) => <button key={image.image_url} type="button" aria-label={`Voir l’image ${index + 1}`} aria-pressed={(selectedImage?.image_url || product.image_url) === image.image_url} onClick={() => setSelectedImage(image)}><ProductImage src={image.image_url} alt={image.alt_text} /></button>)}</div>}</div>
      <div className="pdp-info"><Link className="eyebrow" to={`/marques/${product.brand_slug}`}>{product.brand}</Link><h1>{product.name}</h1>
        {product.size && <p className="pdp-size">{product.size}</p>}
        <div className={isPromotion ? 'pdp-promotion' : ''}><p className={`pdp-price${isPromotion ? ' pdp-price--promotion' : ''}`}><span className="pdp-current-price">{money(product.price_dh)}</span>
          {isPromotion && <><del aria-label={`Ancien prix : ${money(product.compare_at_dh)}`}>{money(product.compare_at_dh)}</del><span className="pdp-promo-discount-badge">−{discountPercent}%</span></>}
        </p>{isPromotion && <p className="pdp-promo-savings">Vous économisez {money(savings)}</p>}</div>
        <p className={product.stock > 0 ? 'stock-ok' : 'stock-out'}>{product.stock > 0 ? 'En stock' : 'Rupture de stock'}</p>
        {product.short_description && <p>{product.short_description}</p>}
        {product.verification_status !== 'VERIFIED' && <p className="quiet-note">Informations produit en cours de vérification auprès des sources officielles. Consultez l’emballage pour les instructions complètes.</p>}
        {product.stock > 0 ? <div className="pdp-actions"><label>Quantité <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>{Array.from({ length: Math.min(10, product.stock) }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select></label><button className="button-primary" onClick={() => addToCart(product, quantity)}><Bag size={18} /> Ajouter au panier</button></div>
          : <form className="stock-alert-form" id="alerte" onSubmit={alert}><h2>Me prévenir du réassort</h2><label>E-mail<input type="email" required value={email} onChange={(e) => { setEmail(e.target.value); if (alertState !== 'loading') setAlertState('idle'); }} placeholder="vous@exemple.ma" /></label><button className="button-primary" disabled={alertState === 'loading'}>{alertState === 'loading' ? 'Envoi…' : 'Me prévenir'}</button>{message && <p role={alertState === 'error' ? 'alert' : 'status'} className={alertState === 'error' ? 'form-error' : ''}>{message}</p>}</form>}
        <button className="favorite-inline" onClick={() => toggleWishlist(product.id)}><Heart size={19} weight={wishlist.includes(product.id) ? 'fill' : 'regular'} /> {wishlist.includes(product.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}</button>
        <div className="pdp-promises"><span><Truck size={18} /> Livraison 24–48h selon ville</span><span><ShieldCheck size={18} /> Paiement à la livraison</span><span><ShieldCheck size={18} /> Produits authentiques</span></div>
        {(product.skin_types?.length || product.concerns?.length || product.usage_time || product.routine_step) && <dl className="pdp-facts">
          {product.skin_types?.length > 0 && <><dt>Type de peau</dt><dd>{product.skin_types.map((item) => item.name).join(' · ')}</dd></>}
          {product.concerns?.length > 0 && <><dt>Besoin</dt><dd>{product.concerns.map((item) => item.name).join(' · ')}</dd></>}
          {product.usage_time && <><dt>Utilisation</dt><dd>{{ am: 'Matin', pm: 'Soir', both: 'Matin & soir' }[product.usage_time]}</dd></>}
          {product.routine_step && <><dt>Routine</dt><dd>{product.routine_step}</dd></>}
        </dl>}
      </div></div>
    <div className="product-details"><section><h2>Description</h2><p>{product.description || 'La fiche détaillée de ce produit est en cours de vérification. Le nom, le format, le prix et la marque proviennent du catalogue de la Gallery.'}</p></section>
      <section><h2>Comment l’utiliser ?</h2><p>{product.usage_instructions || 'Référez-vous aux instructions figurant sur l’emballage du produit.'}</p></section>
      <section><h2>Ingrédients</h2><p>{product.inci || 'Liste INCI à vérifier sur l’emballage avant utilisation.'}</p></section>
      <section><h2>Livraison & retours</h2><p>Livraison calculée selon votre ville au moment de la commande. Consultez nos <Link to="/livraison">conditions de livraison</Link> et notre <Link to="/retours">politique de retours</Link>.</p></section>
      {product.official_source_url && <section><h2>Source de l’information</h2><p><a href={product.official_source_url} target="_blank" rel="noreferrer">{product.official_source_name || 'Fiche officielle du fabricant'}</a>{product.verified_at && ` · Vérifié le ${new Date(product.verified_at).toLocaleDateString('fr-FR')}`}</p></section>}</div>
    {related.length > 0 && <section className="related-products"><div className="section-heading"><h2>Vous pourriez aussi aimer</h2><Link className="text-link" to={`/soins/${product.category_slug}`}>Voir cette catégorie <ArrowLeft size={16} /></Link></div><div className="product-grid">{related.map((p) => <ProductCard key={p.id} product={p} />)}</div></section>}
  </main>;
}
