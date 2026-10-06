import { Bag, Heart } from '@phosphor-icons/react';
import { Link } from 'react-router';
import ProductImage from './ProductImage';
import { money } from '../lib/api';
import { prefetchRoute } from '../lib/route-prefetch';
import { useStore } from '../state/StoreContext';

export default function ProductCard({ product }) {
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const saved = wishlist.includes(product.id);
  const isPromotion = product.compare_at_dh > product.price_dh;
  const discountPercent = isPromotion ? Math.round((product.compare_at_dh - product.price_dh) / product.compare_at_dh * 100) : 0;
  const savings = isPromotion ? product.compare_at_dh - product.price_dh : 0;
  return <article className={`product-card${isPromotion ? ' product-card--promotion' : ''}`}>
    <div className="product-image-area">
      <Link to={`/produits/${product.slug}`} className="product-image-link" aria-label={`Voir ${product.name}`}
        onMouseEnter={() => prefetchRoute(`/produits/${product.slug}`).catch(() => {})}>
        <ProductImage src={product.image_url} alt={`${product.brand} ${product.name}`} />
      </Link>
      {product.stock <= 0 ? <span className="product-note">Rupture</span>
        : isPromotion ? <span className="product-note product-note--promotion" aria-label={`Promotion, ${discountPercent} pour cent de réduction`}>−{discountPercent}%</span>
          : product.new_arrival ? <span className="product-note">Nouveau</span> : null}
      <button className={`favorite-button ${saved ? 'is-favorite' : ''}`} onClick={() => toggleWishlist(product.id)}
        aria-label={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}><Heart size={19} weight={saved ? 'fill' : 'regular'} /></button>
    </div>
    <div className="product-info"><p className="product-brand">{product.brand}</p>
      <Link to={`/produits/${product.slug}`} onMouseEnter={() => prefetchRoute(`/produits/${product.slug}`).catch(() => {})}><h3>{product.name}</h3></Link>
      <p className="product-size">{product.size || product.category}</p>
      <div className={`product-buy${isPromotion ? ' product-buy--promotion' : ''}`}><div className="product-price-group"><div className="product-price-row"><strong>{money(product.price_dh)}</strong>{isPromotion && <del aria-label={`Ancien prix : ${money(product.compare_at_dh)}`}>{money(product.compare_at_dh)}</del>}</div>
        {isPromotion && <small className="product-savings">Économisez {money(savings)}</small>}</div>
        {product.stock > 0 ? <button className="add-button" onClick={() => addToCart(product)}><Bag size={15} /> Ajouter au panier</button>
          : <Link className="add-button stock-button" to={`/produits/${product.slug}#alerte`}>Prévenez-moi</Link>}
      </div>
    </div>
  </article>;
}
