import { useEffect, useState } from 'react';
import { Check } from '@phosphor-icons/react';
import { Link, useParams } from 'react-router';
import { api, money } from '../lib/api';

export default function Receipt() {
  const { token } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api(`/orders/receipt/${encodeURIComponent(token)}`).then(setOrder).catch((e) => setError(e.message)); }, [token]);
  if (error) return <main className="inner-page"><div className="state-panel"><h1>Commande introuvable</h1><p>{error}</p><Link to="/" className="button-primary">Retour à la Gallery</Link></div></main>;
  if (!order) return <main className="inner-page"><div className="state-panel">Chargement de votre commande…</div></main>;
  return <main className="inner-page receipt-page"><div className="success-mark"><Check size={28} /></div><h1>Commande reçue</h1><p>Votre commande a bien été enregistrée. Notre équipe vous appellera afin de la confirmer avant préparation.</p>
    <div className="receipt-card"><h2>Commande {order.number}</h2><p><span>Statut</span><strong>À confirmer</strong></p><p><span>Téléphone</span><strong>{order.phone}</strong></p><p><span>Ville</span><strong>{order.city}</strong></p>
      {order.items.map((item, index) => <p key={index}><span>{item.quantity} × {item.brand} {item.name}</span><strong>{money(item.line_total_dh)}</strong></p>)}
      <p><span>Sous-total</span><strong>{money(order.subtotal_dh)}</strong></p><p><span>Livraison</span><strong>{money(order.shipping_dh)}</strong></p><p className="grand-total"><span>Total à la livraison</span><strong>{money(order.total_dh)}</strong></p></div>
    <Link className="button-primary" to="/">Retour à la Gallery</Link></main>;
}
