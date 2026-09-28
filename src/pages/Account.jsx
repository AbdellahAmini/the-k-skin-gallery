import { useEffect, useState } from 'react';
import { ArrowRight, Heart, Package, User } from '@phosphor-icons/react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { api, money } from '../lib/api';
import { useStore } from '../state/StoreContext';

export function AuthPage({ register = false }) {
  const { authenticate, user } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [values, setValues] = useState({ email: '', password: '', first_name: '', last_name: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user) navigate(params.get('next') || (user.role === 'admin' ? '/admin' : '/compte'), { replace: true }); }, [user, navigate, params]);
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const signedIn = await authenticate(register ? '/auth/register' : '/auth/login', values);
      navigate(params.get('next') || (signedIn.role === 'admin' ? '/admin' : '/compte'), { replace: true });
    } catch (e) { setError(e.message); setBusy(false); }
  }
  return <main className="inner-page auth-page"><div className="page-heading"><p className="eyebrow">La Gallery</p><h1>{register ? 'Créer un compte' : 'Connexion'}</h1><p>{register ? 'Gardez vos favoris et retrouvez vos commandes.' : 'Retrouvez votre espace personnel.'}</p></div>
    <form className="auth-form" onSubmit={submit}>{register && <div className="form-grid"><label>Prénom<input required minLength={2} value={values.first_name} onChange={(e) => setValues({ ...values, first_name: e.target.value })} /></label><label>Nom<input required minLength={2} value={values.last_name} onChange={(e) => setValues({ ...values, last_name: e.target.value })} /></label></div>}
      <label>E-mail<input type="email" required autoComplete="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} /></label>
      <label>Mot de passe<input type="password" required minLength={register ? 10 : undefined} autoComplete={register ? 'new-password' : 'current-password'} value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} /></label>
      {register && <p className="quiet-note">Au moins 10 caractères.</p>}{error && <p role="alert" className="form-error">{error}</p>}
      <button className="button-primary" disabled={busy}>{busy ? 'Un instant…' : register ? 'Créer mon compte' : 'Se connecter'} <ArrowRight size={17} /></button>
      <p>{register ? 'Vous avez déjà un compte ?' : 'Nouveau à la Gallery ?'} <Link className="rose-link" to={register ? '/connexion' : '/inscription'}>{register ? 'Se connecter' : 'Créer un compte'}</Link></p>
    </form></main>;
}

export function AccountHome() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  if (!user) return <main className="inner-page"><div className="state-panel"><User size={32} /><h1>Votre espace Gallery</h1><p>Connectez-vous pour retrouver vos commandes et favoris.</p><Link className="button-primary" to="/connexion?next=/compte">Se connecter</Link></div></main>;
  return <main className="inner-page"><div className="page-heading"><p className="eyebrow">Mon compte</p><h1>Bonjour {user.first_name}</h1><p>{user.email}</p></div>
    <div className="directory-grid"><Link className="directory-card" to="/compte/commandes"><Package size={22} /><span>Mes commandes</span><ArrowRight size={18} /></Link><Link className="directory-card" to="/compte/favoris"><Heart size={22} /><span>Mes favoris</span><ArrowRight size={18} /></Link><Link className="directory-card" to="/compte/alertes-stock"><span>Alertes stock</span><ArrowRight size={18} /></Link></div>
    {user.role === 'admin' && <p><Link className="text-link" to="/admin">Administration <ArrowRight size={16} /></Link></p>}
    <button className="text-link" onClick={async () => { await logout(); navigate('/'); }}>Se déconnecter</button></main>;
}

export function AccountOrders() {
  const { user } = useStore();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { if (user) api('/me/orders').then(setOrders).catch((e) => setError(e.message)); }, [user]);
  if (!user) return <AccountHome />;
  return <main className="inner-page"><div className="page-heading"><p className="eyebrow">Mon compte</p><h1>Mes commandes</h1></div>
    {error && <p role="alert" className="form-error">{error}</p>}
    {orders.length ? <div className="order-list">{orders.map((order) => <Link className="order-list-item" key={order.number} to={`/compte/commandes/${order.id}`}><strong>{order.number}</strong><span>{order.status.replaceAll('_', ' ')}</span><b>{money(order.total_dh)}</b><ArrowRight size={17} /></Link>)}</div>
      : <div className="state-panel"><Package size={30} /><h2>Aucune commande</h2><p>Votre première découverte vous attend.</p><Link className="button-primary" to="/boutique">Explorer la boutique</Link></div>}
  </main>;
}

export function AccountOrder() {
  const { id } = useParams();
  const { user } = useStore();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { if (user) api(`/me/orders/${id}`).then(setOrder).catch((e) => setError(e.message)); }, [id, user]);
  if (!user) return <AccountHome />;
  if (error) return <main className="inner-page"><div className="state-panel"><p>{error}</p><Link to="/compte/commandes">Mes commandes</Link></div></main>;
  if (!order) return <main className="inner-page"><p>Chargement…</p></main>;
  return <main className="inner-page"><div className="page-heading"><p className="eyebrow">Mon compte · Mes commandes</p><h1>{order.number}</h1><p>Statut : {order.status.replaceAll('_', ' ')}</p></div><div className="receipt-card"><p><span>Ville</span><strong>{order.city}</strong></p>{order.items.map((item, i) => <p key={i}><span>{item.quantity} × {item.name}</span><strong>{money(item.line_total_dh)}</strong></p>)}<p className="grand-total"><span>Total</span><strong>{money(order.total_dh)}</strong></p></div></main>;
}

export function AccountAlerts() {
  return <main className="inner-page"><div className="page-heading"><p className="eyebrow">Mon compte</p><h1>Alertes stock</h1></div><div className="state-panel"><h2>Suivre un retour en stock</h2><p>Sur la fiche d’un produit épuisé, indiquez votre e-mail pour enregistrer une alerte.</p><Link className="button-primary" to="/boutique">Voir les produits</Link></div></main>;
}
