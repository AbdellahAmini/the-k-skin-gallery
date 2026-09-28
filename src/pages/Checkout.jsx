import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bag, ShieldCheck } from '@phosphor-icons/react';
import { Link, useNavigate } from 'react-router';
import ProductImage from '../components/ProductImage';
import { api, money } from '../lib/api';
import { useStore } from '../state/StoreContext';

export default function Checkout() {
  const { cart, cartLines, cities, user, setCart } = useStore();
  const navigate = useNavigate();
  const requestId = useRef(crypto.randomUUID());
  const [form, setForm] = useState({ first_name: user?.first_name || '', last_name: user?.last_name || '',
    phone: user?.phone || '', email: user?.email || '', city_id: '', address: '', district: '', complement: '', delivery_notes: '' });
  const [promotionCode, setPromotionCode] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { if (user) setForm((f) => ({ ...f, first_name: f.first_name || user.first_name,
    last_name: f.last_name || user.last_name, email: f.email || user.email, phone: f.phone || user.phone })); }, [user]);
  useEffect(() => {
    if (!cart.length) { setQuote(null); return; }
    let alive = true;
    api('/quote', { method: 'POST', body: { items: cart, city_id: form.city_id ? Number(form.city_id) : null,
      promotion_code: promotionCode.trim() } }).then((result) => { if (alive) { setQuote(result); setQuoteError(''); } })
      .catch((e) => { if (alive) { setQuote(null); setQuoteError(e.message); } });
    return () => { alive = false; };
  }, [cart, form.city_id, promotionCode]);
  function update(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault(); setError('');
    if (!quote || !form.city_id) { setError('Choisissez une ville pour calculer la livraison.'); return; }
    setSubmitting(true);
    try {
      const order = await api('/orders', { method: 'POST', body: { ...form, city_id: Number(form.city_id),
        promotion_code: promotionCode.trim(), items: cart, client_request_id: requestId.current } });
      setCart([]);
      navigate(`/commande/${order.public_token}/confirmation`, { replace: true });
    } catch (e) { setError(e.message); setSubmitting(false); }
  }
  if (!cartLines.length) return <main className="inner-page"><div className="state-panel"><h1>Votre panier est vide</h1><p>Ajoutez un soin avant de passer commande.</p><Link to="/boutique" className="button-primary">Voir la boutique</Link></div></main>;
  return <main className="inner-page checkout-page"><div className="page-heading"><p className="eyebrow">Paiement à la livraison</p><h1>Finaliser ma commande</h1><p>Votre commande sera confirmée par téléphone avant préparation.</p></div>
    <div className="checkout-layout"><form className="checkout-page-form" onSubmit={submit}>
      <section className="form-section"><h2>Vos coordonnées</h2><div className="form-grid">
        <label>Prénom<input name="first_name" required minLength={2} autoComplete="given-name" value={form.first_name} onChange={update} /></label>
        <label>Nom<input name="last_name" required minLength={2} autoComplete="family-name" value={form.last_name} onChange={update} /></label>
        <label>Téléphone<input name="phone" type="tel" required inputMode="tel" autoComplete="tel" placeholder="06 00 00 00 00" value={form.phone} onChange={update} /></label>
        <label>E-mail <small>(facultatif)</small><input name="email" type="email" autoComplete="email" value={form.email} onChange={update} /></label>
      </div></section>
      <section className="form-section"><h2>Adresse de livraison</h2><div className="form-grid">
        <label>Ville<select name="city_id" required value={form.city_id} onChange={update}><option value="">Choisir une ville</option>{cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Région<input value={cities.find((c) => c.id === Number(form.city_id))?.region || ''} readOnly placeholder="Selon votre ville" /></label>
        <label className="full-field">Adresse<input name="address" required minLength={6} autoComplete="street-address" value={form.address} onChange={update} placeholder="Rue, numéro, immeuble…" /></label>
        <label>Quartier<input name="district" required minLength={2} value={form.district} onChange={update} /></label>
        <label>Complément <small>(facultatif)</small><input name="complement" value={form.complement} onChange={update} placeholder="Étage, repère…" /></label>
        <label className="full-field">Notes de livraison <small>(facultatif)</small><textarea name="delivery_notes" value={form.delivery_notes} onChange={update} rows={3} /></label>
      </div></section>
      <section className="form-section"><h2>Paiement</h2><div className="payment-method"><Bag size={21} /><div><strong>À la livraison</strong><small>Réglez votre commande lors de la réception.</small></div><span aria-hidden="true">✓</span></div></section>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" className="button-primary checkout-submit" disabled={submitting || !quote || !form.city_id}>{submitting ? 'Enregistrement…' : 'Commander'} <ArrowRight size={17} /></button>
      <p className="checkout-assurance"><ShieldCheck size={16} /> Votre commande sera confirmée par téléphone avant préparation.</p>
    </form>
    <aside className="order-summary checkout-summary"><h2>Votre commande</h2>
      {cartLines.map(({ item, kind, quantity }) => <div className="summary-line" key={`${kind}-${item.id}`}><ProductImage src={item.image_url} alt="" /><div><strong>{kind === 'bundle' ? 'Pack' : item.brand}</strong><span>{item.name}</span><small>Qté {quantity}</small></div><b>{money(item.price_dh * quantity)}</b></div>)}
      <label className="coupon-field">Code promotionnel<input value={promotionCode} onChange={(e) => setPromotionCode(e.target.value)} placeholder="Facultatif" /></label>
      {quoteError && <p className="form-error" role="alert">{quoteError}</p>}
      {quote && <><p><span>Sous-total</span><strong>{money(quote.subtotal_dh)}</strong></p>{quote.discount_dh > 0 && <p><span>Promotion</span><strong>−{money(quote.discount_dh)}</strong></p>}
        <p><span>Livraison</span><strong>{form.city_id ? (quote.shipping_dh ? money(quote.shipping_dh) : 'Offerte') : 'Selon la ville'}</strong></p>
        <p className="grand-total"><span>Total à régler</span><strong>{form.city_id ? money(quote.total_dh) : 'Choisissez une ville'}</strong></p></>}
    </aside></div>
  </main>;
}
