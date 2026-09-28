import { Link } from 'react-router';
import { ArrowRight, Minus, Plus, Trash } from '@phosphor-icons/react';
import ProductImage from '../components/ProductImage';
import { money } from '../lib/api';
import { useStore } from '../state/StoreContext';

export default function CartPage() {
  const { cartLines, subtotal, changeQuantity, removeFromCart, settings } = useStore();
  const threshold = Number(settings.free_shipping_threshold_dh || 0);
  return <main className="inner-page"><div className="page-heading"><p className="eyebrow">Votre sélection</p><h1>Mon panier</h1></div>
    {!cartLines.length ? <div className="state-panel"><h2>Votre panier vous attend</h2><p>Découvrez les soins de la Gallery.</p><Link className="button-primary" to="/boutique">Explorer la sélection</Link></div>
      : <div className="cart-page-layout"><div className="cart-page-lines">{cartLines.map(({ item, kind, path, quantity }) => <article className="cart-page-line" key={`${kind}-${item.id}`}><Link to={path}><ProductImage src={item.image_url} alt={item.name} /></Link><div><span className="eyebrow">{kind === 'bundle' ? 'Pack' : item.brand}</span><Link to={path}><h2>{item.name}</h2></Link><p>{kind === 'bundle' ? `${item.items.length} soins` : item.size}</p><button className="remove-link" onClick={() => removeFromCart(item.id, kind)}><Trash size={14} /> Retirer</button></div><div><strong>{money(item.price_dh * quantity)}</strong><div className="quantity-control"><button onClick={() => changeQuantity(item.id, -1, kind)} aria-label="Diminuer la quantité"><Minus size={13} /></button><span>{quantity}</span><button onClick={() => changeQuantity(item.id, 1, kind)} aria-label="Augmenter la quantité" disabled={quantity >= item.stock}><Plus size={13} /></button></div></div></article>)}</div>
        <aside className="order-summary"><h2>Votre commande</h2><p><span>Sous-total</span><strong>{money(subtotal)}</strong></p><small>Frais de livraison calculés selon votre ville.</small>{threshold > subtotal && <p className="quiet-note">Encore {money(threshold - subtotal)} pour la livraison offerte.</p>}
          <Link className="button-primary checkout-button" to="/checkout">Continuer ma commande <ArrowRight size={17} /></Link><small>Paiement à la livraison.</small></aside></div>}
  </main>;
}
