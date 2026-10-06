import { Truck } from '@phosphor-icons/react';
import { money } from '../lib/api';

export default function FreeShippingProgress({ subtotal, threshold }) {
  if (!threshold || subtotal <= 0) return null;

  const remaining = Math.max(0, threshold - subtotal);
  const progress = Math.min(100, Math.round((subtotal / threshold) * 100));

  return <div className="shipping-progress" role="status" aria-live="polite">
    <div className="shipping-progress-message">
      <Truck size={19} aria-hidden="true" />
      <span>{remaining
        ? <>Encore <strong>{money(remaining)}</strong> pour la livraison offerte.</>
        : <>Vous avez atteint le seuil de livraison offerte.</>}</span>
    </div>
    <div className="shipping-progress-track" role="progressbar" aria-label="Progression vers la livraison offerte" aria-valuemin={0} aria-valuemax={threshold} aria-valuenow={Math.min(subtotal, threshold)}>
      <span style={{ width: progress + '%' }} />
    </div>
    <small>Seuil calculé avant remises. Livraison confirmée à la commande.</small>
  </div>;
}
