import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Package, Phone, ShieldCheck } from '@phosphor-icons/react';
import { Link, useLocation, useNavigate } from 'react-router';
import ProductImage from '../components/ProductImage';
import { api, money } from '../lib/api';
import { useStore } from '../state/StoreContext';

const nav = [
  ['Commerce', [['Tableau de bord', '/admin'], ['Commandes', '/admin/commandes']]],
  ['Catalogue', [['Produits', '/admin/catalogue/produits'], ['Marques', '/admin/catalogue/marques'],
    ['Types de soin', '/admin/catalogue/types-de-soin'], ['Types de peau', '/admin/catalogue/types-de-peau'],
    ['Besoins', '/admin/catalogue/besoins'], ['Ingrédients', '/admin/catalogue/ingredients'],
    ['Routines', '/admin/catalogue/routines'], ['Packs', '/admin/catalogue/packs']]],
  ['Gestion', [['Stock', '/admin/stock'], ['Promotions', '/admin/promotions'], ['Livraison', '/admin/livraison'],
    ['Clients', '/admin/clients'], ['Avis', '/admin/avis'], ['Alertes stock', '/admin/alertes-stock']]],
  ['Contenu', [['Homepage', '/admin/contenu/homepage'], ['FAQ', '/admin/contenu/faq'],
    ['Conseils', '/admin/contenu/conseils'], ['Menus', '/admin/contenu/menus'], ['Footer', '/admin/contenu/footer']]],
  ['Configuration', [['Paramètres', '/admin/parametres']]],
];
const labels = { a_confirmer: 'À confirmer', appel_en_cours: 'Appel en cours', confirmee: 'Confirmée',
  preparation: 'Préparation', expediee: 'Expédiée', livree: 'Livrée', injoignable: 'Injoignable',
  annulee: 'Annulée', refusee: 'Refusée à la livraison', retournee: 'Retournée' };
const transitions = { a_confirmer: ['appel_en_cours', 'confirmee', 'injoignable', 'annulee'],
  appel_en_cours: ['confirmee', 'injoignable', 'annulee'], injoignable: ['appel_en_cours', 'confirmee', 'annulee'],
  confirmee: ['preparation', 'annulee'], preparation: ['expediee', 'annulee'],
  expediee: ['livree', 'refusee', 'retournee'], livree: ['retournee'] };

function useData(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const reload = () => api(path).then((r) => { setData(r); setError(''); }).catch((e) => setError(e.message));
  useEffect(() => { reload(); }, [path]);
  return [data, error, reload, setData];
}

function Dashboard() {
  const [data, error] = useData('/admin/overview');
  if (error) return <p role="alert" className="form-error">{error}</p>;
  if (!data) return <p>Chargement du tableau de bord…</p>;
  const cards = [['Commandes à confirmer', data.to_confirm, '/admin/commandes'],
    ['Confirmées', data.confirmed, '/admin/commandes'], ['À préparer', data.preparing, '/admin/commandes'],
    ['Expédiées', data.shipped, '/admin/commandes'], ['Ruptures stock', data.out_of_stock, '/admin/stock'],
    ['Stock faible', data.low_stock, '/admin/stock']];
  return <><h1>Tableau de bord</h1><div className="admin-stats">{cards.map(([name, value, path]) => <Link key={name} to={path}><span>{name}</span><strong>{value}</strong></Link>)}</div>
    <div className="admin-stats value-stats"><div><span>Valeur des commandes déposées</span><strong>{money(data.ordered_value_dh)}</strong></div><div><span>Chiffre d’affaires livré</span><strong>{money(data.delivered_revenue_dh)}</strong></div></div>
    <p className="quiet-note">Seules les commandes livrées comptent comme chiffre d’affaires réalisé.</p></>;
}

function Orders() {
  const [data, error] = useData('/admin/orders');
  const [filter, setFilter] = useState('');
  const filtered = (data || []).filter((o) => !filter || o.status === filter);
  return <><div className="admin-heading"><h1>Commandes</h1><label>Statut<select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">Tous</option>{Object.entries(labels).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label></div>
    {error && <p role="alert" className="form-error">{error}</p>}
    {data && !filtered.length && <div className="state-panel"><h2>Aucune commande</h2><p>Les nouvelles commandes apparaîtront ici.</p></div>}
    {filtered.length > 0 && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Commande</th><th>Client</th><th>Ville</th><th>Statut</th><th>Total</th><th></th></tr></thead><tbody>{filtered.map((o) => <tr key={o.id}><td><Link to={`/admin/commandes/${o.id}`}>{o.number}</Link></td><td>{o.first_name} {o.last_name}<br /><a href={`tel:${o.phone}`}>{o.phone}</a></td><td>{o.city}</td><td><span className="status-pill">{labels[o.status]}</span></td><td>{money(o.total_dh)}</td><td><Link to={`/admin/commandes/${o.id}`}>Voir <ArrowRight size={14} /></Link></td></tr>)}</tbody></table></div>}
  </>;
}

function OrderDetail({ id }) {
  const [order, error, reload] = useData(`/admin/orders/${id}`);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  async function update(status) {
    if (status === 'annulee' && !window.confirm('Annuler cette commande et libérer le stock réservé ?')) return;
    setBusy(true); setActionError('');
    try { await api(`/admin/orders/${id}/status`, { method: 'POST', body: { status } }); reload(); }
    catch (e) { setActionError(e.message); } finally { setBusy(false); }
  }
  if (error) return <div className="state-panel"><p>{error}</p><Link to="/admin/commandes">Retour</Link></div>;
  if (!order) return <p>Chargement…</p>;
  return <><Link className="text-link" to="/admin/commandes"><ArrowLeft size={16} /> Commandes</Link><div className="admin-heading"><div><h1>{order.number}</h1><span className="status-pill">{labels[order.status]}</span></div><strong>{money(order.total_dh)}</strong></div>
    <div className="admin-detail-grid"><section className="admin-panel"><h2>Client & livraison</h2><p><strong>{order.first_name} {order.last_name}</strong></p><p><a className="call-link" href={`tel:${order.phone}`}><Phone size={17} /> Appeler {order.phone}</a></p><p>{order.email}</p><p>{order.address}, {order.district}, {order.city}<br />{order.region}</p>{order.complement && <p>Complément : {order.complement}</p>}{order.delivery_notes && <p>Note : {order.delivery_notes}</p>}</section>
      <section className="admin-panel"><h2>Actions</h2><div className="admin-actions">{(transitions[order.status] || []).map((status) => <button key={status} className={status === 'annulee' ? 'button-outline' : 'button-primary'} onClick={() => update(status)} disabled={busy}>{labels[status]}</button>)}</div>{actionError && <p role="alert" className="form-error">{actionError}</p>}</section></div>
    <section className="admin-panel"><h2>Articles</h2>{order.items.map((item, i) => <div className="admin-order-line" key={i}><ProductImage src={item.image_url} alt="" /><span>{item.quantity} × {item.brand} {item.name}</span><strong>{money(item.line_total_dh)}</strong></div>)}<p className="summary-row">Sous-total <strong>{money(order.subtotal_dh)}</strong></p><p className="summary-row">Remise <strong>−{money(order.discount_dh)}</strong></p><p className="summary-row">Livraison <strong>{money(order.shipping_dh)}</strong></p><p className="summary-row grand-total">Total <strong>{money(order.total_dh)}</strong></p></section>
    <section className="admin-panel"><h2>Historique</h2><ol className="status-history">{order.history.map((h, i) => <li key={i}><strong>{labels[h.status]}</strong><small>{new Date(h.created_at).toLocaleString('fr-FR')}</small>{h.note && <span>{h.note}</span>}</li>)}</ol></section></>;
}

function Products({ stockOnly = false }) {
  const [data, error] = useData('/admin/products');
  const [q, setQ] = useState('');
  const rows = (data || []).filter((p) => (!stockOnly || p.stock <= 3) &&
    `${p.name} ${p.brand}`.toLowerCase().includes(q.toLowerCase()));
  return <><h1>{stockOnly ? 'Stock' : 'Produits'}</h1><div className="admin-toolbar"><input aria-label="Rechercher un produit" placeholder="Rechercher un produit…" value={q} onChange={(e) => setQ(e.target.value)} /><span>{rows.length} produit(s)</span></div>
    {error && <p role="alert" className="form-error">{error}</p>}
    {data && !rows.length && <div className="state-panel"><h2>Aucun produit</h2><p>Modifiez votre recherche.</p></div>}
    {rows.length > 0 && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Produit</th><th>Prix</th><th>Stock</th><th>État</th><th></th></tr></thead><tbody>{rows.map((p) => <tr key={p.id}><td><div className="admin-product-name"><ProductImage src={p.image_url} alt="" /><span><b>{p.brand}</b><br />{p.name}<br /><small>{p.sku}</small></span></div></td><td>{money(p.price_dh)}</td><td>{p.stock}{p.stock_is_sample && <small> démo</small>}</td><td>{p.active ? 'Actif' : 'Inactif'}</td><td><Link to={`/admin/catalogue/produits/${p.id}`}>Modifier</Link></td></tr>)}</tbody></table></div>}
  </>;
}

function ProductEditor({ id }) {
  const [product, error, reload, setProduct] = useData(`/admin/products`);
  const [typeRows] = useData('/admin/taxonomy/product-types');
  const [skinRows] = useData('/admin/taxonomy/skin-types');
  const [concernRows] = useData('/admin/taxonomy/concerns');
  const [ingredientRows] = useData('/admin/taxonomy/ingredients');
  const original = product?.find((p) => p.id === Number(id));
  const [values, setValues] = useState(null);
  const [message, setMessage] = useState('');
  useEffect(() => { if (original && !values) setValues({ price_dh: original.price_dh, stock: original.stock,
    active: original.active, featured: original.featured, new_arrival: original.new_arrival,
    compare_at_dh: original.compare_at_dh ?? '', category_slug: original.category_slug,
    skin_type_slugs: original.skin_types?.map((item) => item.slug) || [],
    concern_slugs: original.concerns?.map((item) => item.slug) || [],
    ingredient_slugs: original.ingredients?.map((item) => item.slug) || [],
    usage_time: original.usage_time || '', routine_step: original.routine_step || '',
    search_aliases: original.search_aliases || '',
    new_until: original.new_until?.slice(0, 10) || '',
    official_source_name: original.official_source_name || '', mark_verified: false,
    short_description: original.short_description || '', description: original.description || '',
    usage_instructions: original.usage_instructions || '', inci: original.inci || '',
    official_source_url: original.official_source_url || '' }); }, [original, values]);
  async function save(event) {
    event.preventDefault(); setMessage('');
    try { await api(`/admin/products/${id}`, { method: 'PATCH', body: { ...values,
      price_dh: Number(values.price_dh), stock: Number(values.stock),
      compare_at_dh: values.compare_at_dh === '' ? null : Number(values.compare_at_dh),
      new_until: values.new_until ? `${values.new_until}T23:59:59Z` : null } }); setMessage('Produit enregistré.'); reload(); }
    catch (e) { setMessage(e.message); }
  }
  if (error) return <p role="alert" className="form-error">{error}</p>;
  if (!original || !values) return <p>Chargement…</p>;
  const field = (key, label, type = 'text') => <label key={key}>{label}<input type={type} value={values[key]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} /></label>;
  const area = (key, label) => <label key={key}>{label}<textarea rows={4} value={values[key]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} /></label>;
  const multi = (key, title, options) => <fieldset className="admin-taxonomy-checks"><legend>{title}</legend>{options?.length ? options.map((item) => <label key={item.slug}><input type="checkbox" checked={values[key].includes(item.slug)} onChange={(event) => setValues({ ...values, [key]: event.target.checked ? [...values[key], item.slug] : values[key].filter((slug) => slug !== item.slug) })} /> {item.name}</label>) : <small>Aucune entrée disponible.</small>}</fieldset>;
  return <><Link className="text-link" to="/admin/catalogue/produits"><ArrowLeft size={16} /> Produits</Link><h1>{original.name}</h1><form className="admin-panel admin-editor" onSubmit={save}><div className="admin-editor-top"><ProductImage src={original.image_url} alt={original.name} /><div><p><strong>{original.brand}</strong> · {original.sku} · {original.category}</p><p>Coût interne : {money(original.cost_dh || 0)}</p><p>Prix grossiste interne : {money(original.wholesale_dh || 0)}</p></div></div>
      <div className="form-grid">{field('price_dh', 'Prix public (DH)', 'number')}{field('compare_at_dh', 'Prix barré (DH)', 'number')}{field('stock', 'Stock', 'number')}<label>Type de soin<select value={values.category_slug} onChange={(event) => setValues({ ...values, category_slug: event.target.value })}>{typeRows?.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label></div>
      <div className="admin-checks">{['active', 'featured'].map((key) => <label key={key}><input type="checkbox" checked={values[key]} onChange={(e) => setValues({ ...values, [key]: e.target.checked })} /> {{ active: 'Actif', featured: 'À la une' }[key]}</label>)}</div>
      <p className="quiet-note">La nouveauté visible expire à la date choisie. Les correspondances de peau et de besoins doivent être vérifiées avant attribution.</p>
      {field('new_until', 'Nouveauté jusqu’au', 'date')}
      <div className="admin-taxonomy-grid">{multi('skin_type_slugs', 'Types de peau', skinRows)}{multi('concern_slugs', 'Besoins', concernRows)}{multi('ingredient_slugs', 'Ingrédients clés', ingredientRows)}</div>
      <div className="form-grid"><label>Utilisation<select value={values.usage_time} onChange={(event) => setValues({ ...values, usage_time: event.target.value })}><option value="">Non vérifiée</option><option value="am">Matin</option><option value="pm">Soir</option><option value="both">Matin & soir</option></select></label>{field('routine_step', 'Étape de routine')}</div>
      {field('search_aliases', 'Alias de recherche')}
      {field('short_description', 'Description courte')}{area('description', 'Description')}{area('usage_instructions', 'Utilisation')}{area('inci', 'Ingrédients INCI')}{field('official_source_url', 'Source officielle (URL)')}
      {field('official_source_name', 'Nom de la source officielle')}<label className="admin-verify"><input type="checkbox" checked={values.mark_verified} onChange={(event) => setValues({ ...values, mark_verified: event.target.checked })} /> Marquer les informations de cette fiche comme vérifiées aujourd’hui</label>
      <button className="button-primary">Enregistrer</button>{message && <p role="status">{message}</p>}</form></>;
}

function Shipping() {
  const [cities, error, reload] = useData('/admin/cities');
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  async function save(city) {
    try { await api(`/admin/cities/${city.id}`, { method: 'PATCH', body: { shipping_dh: Number(editing.shipping_dh), active: editing.active } }); setMessage('Tarif enregistré.'); setEditing(null); reload(); }
    catch (e) { setMessage(e.message); }
  }
  return <><h1>Livraison</h1><p className="quiet-note">Le tarif choisi ici est recalculé par le serveur au moment de la commande.</p>{error && <p className="form-error">{error}</p>}{message && <p role="status">{message}</p>}
    {cities && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Ville</th><th>Région</th><th>Tarif</th><th>Active</th><th></th></tr></thead><tbody>{cities.map((c) => <tr key={c.id}><td>{c.name}</td><td>{c.region}</td><td>{editing?.id === c.id ? <input type="number" min="0" value={editing.shipping_dh} onChange={(e) => setEditing({ ...editing, shipping_dh: e.target.value })} /> : money(c.shipping_dh)}</td><td>{editing?.id === c.id ? <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> : c.active ? 'Oui' : 'Non'}</td><td>{editing?.id === c.id ? <button onClick={() => save(c)}>Enregistrer</button> : <button onClick={() => setEditing(c)}>Modifier</button>}</td></tr>)}</tbody></table></div>}</>;
}

function Promotions() {
  const [promos, error, reload] = useData('/admin/promotions');
  const [form, setForm] = useState({ name: '', code: '', kind: 'percent', amount: 10, minimum_dh: 0, active: false });
  const [message, setMessage] = useState('');
  async function submit(e) { e.preventDefault(); try { await api('/admin/promotions', { method: 'POST', body: { ...form, amount: Number(form.amount), minimum_dh: Number(form.minimum_dh) } }); setMessage('Promotion créée.'); reload(); } catch (err) { setMessage(err.message); } }
  return <><h1>Promotions</h1>{error && <p className="form-error">{error}</p>}{promos && !promos.length && <div className="state-panel"><h2>Aucune promotion active</h2><p>Créez une remise ou un code ci-dessous.</p></div>}
    {promos?.length > 0 && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Nom</th><th>Code</th><th>Type</th><th>Montant</th><th>Minimum</th><th>État</th></tr></thead><tbody>{promos.map((p) => <tr key={p.id}><td>{p.name}</td><td>{p.code || 'Automatique'}</td><td>{p.kind}</td><td>{p.amount}</td><td>{money(p.minimum_dh)}</td><td>{p.active ? 'Active' : 'Inactive'}</td></tr>)}</tbody></table></div>}
    <form className="admin-panel admin-editor" onSubmit={submit}><h2>Nouvelle promotion</h2><div className="form-grid"><label>Nom<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>Code <small>(vide = automatique)</small><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></label><label>Type<select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}><option value="percent">Pourcentage</option><option value="fixed">Montant fixe</option><option value="free_shipping">Livraison offerte</option></select></label><label>Montant<input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label><label>Minimum (DH)<input type="number" min="0" value={form.minimum_dh} onChange={(e) => setForm({ ...form, minimum_dh: e.target.value })} /></label><label><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label></div><button className="button-primary">Créer la promotion</button>{message && <p role="status">{message}</p>}</form></>;
}

function Settings() {
  const [data, error, reload] = useData('/admin/settings');
  const [values, setValues] = useState(null);
  const [message, setMessage] = useState('');
  useEffect(() => { if (data && !values) setValues(data); }, [data, values]);
  async function save(e) { e.preventDefault(); try { await api('/admin/settings', { method: 'PUT', body: values }); setMessage('Paramètres enregistrés.'); reload(); } catch (err) { setMessage(err.message); } }
  if (error) return <p className="form-error">{error}</p>;
  if (!values) return <p>Chargement…</p>;
  return <><h1>Paramètres</h1><form className="admin-panel admin-editor" onSubmit={save}>{[['free_shipping_threshold_dh', 'Seuil de livraison offerte (DH)'], ['whatsapp_number', 'Numéro WhatsApp'], ['support_phone', 'Téléphone de support'], ['instagram_url', 'Instagram (URL)'], ['tiktok_url', 'TikTok (URL)']].map(([key, label]) => <label key={key}>{label}<input value={values[key] || ''} onChange={(e) => setValues({ ...values, [key]: e.target.value })} /></label>)}<button className="button-primary">Enregistrer</button>{message && <p role="status">{message}</p>}</form></>;
}

function ListPage({ title, endpoint, columns }) {
  const [rows, error] = useData(endpoint);
  return <><h1>{title}</h1>{error && <p role="alert" className="form-error">{error}</p>}{rows && !rows.length && <div className="state-panel"><h2>Aucune donnée</h2><p>Les éléments enregistrés apparaîtront ici.</p></div>}{rows?.length > 0 && <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{columns.map(([label]) => <th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={row.id || i}>{columns.map(([label, key]) => <td key={label}>{String(row[key] ?? '')}</td>)}</tr>)}</tbody></table></div>}</>;
}

function TaxonomyPage({ kind, title }) {
  const [rows, error, reload] = useData(`/admin/taxonomy/${kind}`);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', active: true });
  const [message, setMessage] = useState('');
  function choose(row) { setEditing(row?.id || null); setForm(row ? { name: row.name, slug: row.slug, description: row.description || '', active: row.active } : { name: '', slug: '', description: '', active: true }); setMessage(''); }
  async function save(event) {
    event.preventDefault(); setMessage('');
    try {
      await api(`/admin/taxonomy/${kind}${editing ? `/${editing}` : ''}`, { method: editing ? 'PATCH' : 'POST', body: form });
      choose(null); setMessage('Enregistré.'); reload();
    } catch (cause) { setMessage(cause.message); }
  }
  return <><div className="admin-heading"><h1>{title}</h1><button className="button-outline" onClick={() => choose(null)}>Ajouter</button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <p className="quiet-note">Ces entrées organisent le catalogue. Associez ensuite les produits depuis leur fiche après vérification.</p>
    {rows && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Nom</th><th>Adresse</th><th>Produits</th><th></th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.name}</td><td>{row.slug}</td><td>{row.count}</td><td><button onClick={() => choose(row)}>Modifier</button></td></tr>)}</tbody></table></div>}
    <form className="admin-panel admin-editor admin-subform" onSubmit={save}><h2>{editing ? 'Modifier' : 'Ajouter'} {title.toLowerCase()}</h2><div className="form-grid"><label>Nom<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Adresse courte<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label></div>{['skin-types', 'concerns'].includes(kind) && <label>Courte description<textarea rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>}{['skin-types', 'concerns'].includes(kind) && <label className="admin-verify"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Actif</label>}<button className="button-primary">Enregistrer</button>{message && <p role="status">{message}</p>}</form>
  </>;
}

function BundleAdmin() {
  const [rows, error, reload] = useData('/admin/bundles');
  const [products] = useData('/admin/products');
  const blank = { name: '', slug: '', description: '', image_url: '', price_dh: 0, compare_at_dh: '', active: false, items: [{ product_id: '', quantity: 1 }, { product_id: '', quantity: 1 }] };
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [message, setMessage] = useState('');
  function choose(row) { setEditing(row?.id || null); setForm(row ? { name: row.name, slug: row.slug, description: row.description, image_url: row.image_url, price_dh: row.price_dh, compare_at_dh: row.compare_at_dh ?? '', active: row.active, items: row.items.map((item) => ({ product_id: item.product.id, quantity: item.quantity })) } : blank); setMessage(''); }
  async function save(event) {
    event.preventDefault(); setMessage('');
    const body = { ...form, price_dh: Number(form.price_dh), compare_at_dh: form.compare_at_dh === '' ? null : Number(form.compare_at_dh), items: form.items.map((item) => ({ product_id: Number(item.product_id), quantity: Number(item.quantity) })) };
    try { await api(`/admin/bundles${editing ? `/${editing}` : ''}`, { method: editing ? 'PUT' : 'POST', body }); setMessage('Pack enregistré.'); reload(); }
    catch (cause) { setMessage(cause.message); }
  }
  function component(index, patch) { setForm((current) => ({ ...current, items: current.items.map((item, i) => i === index ? { ...item, ...patch } : item) })); }
  return <><div className="admin-heading"><h1>Packs</h1><button className="button-outline" onClick={() => choose(null)}>Créer un pack</button></div><p className="quiet-note">Un pack contient au moins deux SKU. Sa disponibilité est calculée depuis le stock de chaque composant.</p>{error && <p className="form-error">{error}</p>}
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Pack</th><th>Composants</th><th>Prix</th><th>Disponible</th><th></th></tr></thead><tbody>{rows?.map((row) => <tr key={row.id}><td>{row.name} {row.active ? '' : '(inactif)'}</td><td>{row.items.length}</td><td>{money(row.price_dh)}</td><td>{row.stock}</td><td><button onClick={() => choose(row)}>Modifier</button></td></tr>)}</tbody></table></div>
    <form className="admin-panel admin-editor admin-subform" onSubmit={save}><h2>{editing ? 'Modifier le pack' : 'Nouveau pack'}</h2><div className="form-grid"><label>Nom<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Adresse courte<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label><label>Prix (DH)<input type="number" min="0" value={form.price_dh} onChange={(event) => setForm({ ...form, price_dh: event.target.value })} /></label><label>Prix barré (DH)<input type="number" min="0" value={form.compare_at_dh} onChange={(event) => setForm({ ...form, compare_at_dh: event.target.value })} /></label></div><label>Description<textarea rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label>Image (URL)<input value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} /></label><h3>Composants</h3>{form.items.map((item, index) => <div className="admin-component-row" key={index}><select required value={item.product_id} onChange={(event) => component(index, { product_id: event.target.value })}><option value="">Choisir un produit</option>{products?.filter((product) => product.active).map((product) => <option key={product.id} value={product.id}>{product.sku} · {product.name}</option>)}</select><input type="number" min="1" max="25" aria-label="Quantité du composant" value={item.quantity} onChange={(event) => component(index, { quantity: event.target.value })} /><button type="button" disabled={form.items.length <= 2} onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })}>Retirer</button></div>)}<button type="button" className="button-outline" onClick={() => setForm({ ...form, items: [...form.items, { product_id: '', quantity: 1 }] })}>Ajouter un composant</button><label className="admin-verify"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Pack actif</label><button className="button-primary">Enregistrer</button>{message && <p role="status">{message}</p>}</form>
  </>;
}

function RoutineAdmin() {
  const [rows, error, reload] = useData('/admin/routines');
  const [products] = useData('/admin/products');
  const [categories] = useData('/admin/taxonomy/product-types');
  const blank = { name: '', slug: '', description: '', active: true, steps: [{ name: '', description: '', category_slug: '', product_ids: [] }] };
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [message, setMessage] = useState('');
  function choose(row) { setEditing(row?.id || null); setForm(row ? { name: row.name, slug: row.slug, description: row.description, active: row.active, steps: row.steps.map((step) => ({ name: step.name, description: step.description, category_slug: step.category_slug, product_ids: step.products.map((product) => product.id) })) } : blank); setMessage(''); }
  function stepChange(index, patch) { setForm((current) => ({ ...current, steps: current.steps.map((step, i) => i === index ? { ...step, ...patch } : step) })); }
  async function save(event) { event.preventDefault(); setMessage(''); try { await api(`/admin/routines${editing ? `/${editing}` : ''}`, { method: editing ? 'PUT' : 'POST', body: form }); setMessage('Routine enregistrée.'); reload(); } catch (cause) { setMessage(cause.message); } }
  return <><div className="admin-heading"><h1>Routines</h1><button className="button-outline" onClick={() => choose(null)}>Créer une routine</button></div>{error && <p className="form-error">{error}</p>}
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Routine</th><th>Étapes</th><th>État</th><th></th></tr></thead><tbody>{rows?.map((row) => <tr key={row.id}><td>{row.name}</td><td>{row.steps.length}</td><td>{row.active ? 'Active' : 'Inactive'}</td><td><button onClick={() => choose(row)}>Modifier</button></td></tr>)}</tbody></table></div>
    <form className="admin-panel admin-editor admin-subform" onSubmit={save}><h2>{editing ? 'Modifier la routine' : 'Nouvelle routine'}</h2><div className="form-grid"><label>Nom<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Adresse courte<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label></div><label>Description<textarea rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><h3>Étapes</h3>{form.steps.map((step, index) => <div className="admin-step-editor" key={index}><strong>Étape {index + 1}</strong><div className="form-grid"><label>Nom<input required value={step.name} onChange={(event) => stepChange(index, { name: event.target.value })} /></label><label>Type de soin<select value={step.category_slug} onChange={(event) => stepChange(index, { category_slug: event.target.value })}><option value="">Choisir</option>{categories?.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label></div><label>Explication<input value={step.description} onChange={(event) => stepChange(index, { description: event.target.value })} /></label><label>Produits sélectionnés<select multiple size={5} value={step.product_ids.map(String)} onChange={(event) => stepChange(index, { product_ids: [...event.target.selectedOptions].map((option) => Number(option.value)) })}>{products?.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.sku} · {item.name}</option>)}</select></label><button type="button" disabled={form.steps.length <= 1} onClick={() => setForm({ ...form, steps: form.steps.filter((_, i) => i !== index) })}>Retirer l’étape</button></div>)}<button type="button" className="button-outline" onClick={() => setForm({ ...form, steps: [...form.steps, { name: '', description: '', category_slug: '', product_ids: [] }] })}>Ajouter une étape</button><label className="admin-verify"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Routine active</label><button className="button-primary">Enregistrer</button>{message && <p role="status">{message}</p>}</form>
  </>;
}

function ContentEditor({ kind, title }) {
  const [data, error, reload] = useData(`/admin/content/${kind}`);
  const [products] = useData('/admin/products');
  const [brands] = useData('/admin/taxonomy/brands');
  const [routines] = useData('/admin/routines');
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  useEffect(() => { if (data) setForm(data); }, [data, kind]);
  async function save(event) { event.preventDefault(); setMessage(''); try { await api(`/admin/content/${kind}`, { method: 'PUT', body: form }); setMessage('Contenu enregistré.'); reload(); } catch (cause) { setMessage(cause.message); } }
  const field = (key, label, rows = 0) => <label>{label}{rows ? <textarea rows={rows} value={form[key] || ''} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /> : <input value={form[key] || ''} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />}</label>;
  if (error) return <p className="form-error">{error}</p>;
  if (!form) return <p>Chargement…</p>;
  return <><h1>{title}</h1><p className="quiet-note">Sections éditoriales structurées. Les liens doivent mener à des pages du site.</p><form className="admin-panel admin-editor" onSubmit={save}>
    {kind === 'homepage' && <><h2>Hero</h2>{field('hero_eyebrow', 'Accroche')}{field('hero_title', 'Titre (une ligne par retour)', 3)}{field('hero_intro', 'Introduction', 2)}<div className="form-grid">{field('hero_cta_label', 'Texte du bouton')}{field('hero_cta_path', 'Destination')}</div><h2>Entrer dans la Gallery</h2>{field('entry_title', 'Titre de la section')}{form.entry_cards.map((card, index) => <div className="admin-step-editor" key={index}><strong>Entrée {index + 1}</strong>{[['title', 'Titre'], ['description', 'Description'], ['action', 'Action'], ['path', 'Destination']].map(([key, label]) => <label key={key}>{label}<input value={card[key]} onChange={(event) => setForm({ ...form, entry_cards: form.entry_cards.map((item, i) => i === index ? { ...item, [key]: event.target.value } : item) })} /></label>)}</div>)}
      <h2>Sélections</h2><label>Produits incontournables<select multiple size={6} value={form.featured_product_ids.map(String)} onChange={(event) => setForm({ ...form, featured_product_ids: [...event.target.selectedOptions].map((option) => Number(option.value)) })}>{products?.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.sku} · {item.name}</option>)}</select></label><label>Marques à afficher<select multiple size={6} value={form.featured_brand_slugs} onChange={(event) => setForm({ ...form, featured_brand_slugs: [...event.target.selectedOptions].map((option) => option.value) })}>{brands?.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label><label>Routines mises en avant<select multiple size={4} value={form.featured_routine_slugs} onChange={(event) => setForm({ ...form, featured_routine_slugs: [...event.target.selectedOptions].map((option) => option.value) })}>{routines?.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label><h2>Campagne & confiance</h2>{field('promotion_title', 'Titre de campagne (vide = seuil de livraison offert)')}<div className="form-grid">{field('promotion_cta_label', 'Texte du bouton')}{field('promotion_cta_path', 'Destination')}</div>{form.trust_messages.map((message, index) => <label key={index}>Message de confiance {index + 1}<input value={message} onChange={(event) => setForm({ ...form, trust_messages: form.trust_messages.map((item, i) => i === index ? event.target.value : item) })} /></label>)}</>}
    {kind === 'faq' && <><h2>Questions fréquentes</h2>{form.items.map((item, index) => <div className="admin-step-editor" key={index}><label>Question<input value={item.question} onChange={(event) => setForm({ ...form, items: form.items.map((entry, i) => i === index ? { ...entry, question: event.target.value } : entry) })} /></label><label>Réponse<textarea rows={3} value={item.answer} onChange={(event) => setForm({ ...form, items: form.items.map((entry, i) => i === index ? { ...entry, answer: event.target.value } : entry) })} /></label><button type="button" onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })}>Retirer</button></div>)}<button type="button" className="button-outline" onClick={() => setForm({ ...form, items: [...form.items, { question: '', answer: '' }] })}>Ajouter une question</button></>}
    {kind === 'menus' && <label>Marque à découvrir dans le menu<select value={form.featured_brand_slug} onChange={(event) => setForm({ ...form, featured_brand_slug: event.target.value })}><option value="">Aucune</option>{brands?.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>}
    {kind === 'footer' && <>{field('introduction', 'Introduction')}{field('closing_line', 'Ligne de bas de page')}</>}
    <button className="button-primary">Enregistrer</button>{message && <p role="status">{message}</p>}</form></>;
}

function ArticleAdmin() {
  const [rows, error, reload] = useData('/admin/articles');
  const blank = { title: '', slug: '', excerpt: '', body: '', published: false };
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [message, setMessage] = useState('');
  function choose(row) { setEditing(row?.id || null); setForm(row ? { title: row.title, slug: row.slug, excerpt: row.excerpt, body: row.body, published: row.published } : blank); setMessage(''); }
  async function save(event) { event.preventDefault(); setMessage(''); try { await api(`/admin/articles${editing ? `/${editing}` : ''}`, { method: editing ? 'PUT' : 'POST', body: form }); setMessage('Conseil enregistré.'); reload(); } catch (cause) { setMessage(cause.message); } }
  return <><div className="admin-heading"><h1>Conseils</h1><button className="button-outline" onClick={() => choose(null)}>Nouveau conseil</button></div><p className="quiet-note">Les articles publiés sont visibles sur /conseils. Vérifiez les informations produit avant publication.</p>{error && <p className="form-error">{error}</p>}
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Titre</th><th>Adresse</th><th>État</th><th></th></tr></thead><tbody>{rows?.map((row) => <tr key={row.id}><td>{row.title}</td><td>{row.slug}</td><td>{row.published ? 'Publié' : 'Brouillon'}</td><td><button onClick={() => choose(row)}>Modifier</button></td></tr>)}</tbody></table></div><form className="admin-panel admin-editor admin-subform" onSubmit={save}><h2>{editing ? 'Modifier le conseil' : 'Nouveau conseil'}</h2><label>Titre<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label>Adresse courte<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label><label>Résumé<textarea rows={2} value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} /></label><label>Article<textarea rows={12} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} /></label><label className="admin-verify"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} /> Publié</label><button className="button-primary">Enregistrer</button>{message && <p role="status">{message}</p>}</form></>;
}

export default function Admin() {
  const { user, ready } = useStore();
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  if (!ready) return <main className="inner-page">Chargement…</main>;
  if (!user || user.role !== 'admin') return <main className="inner-page"><div className="state-panel"><ShieldCheck size={31} /><h1>Accès administrateur</h1><p>Connectez-vous avec un compte administrateur.</p><Link className="button-primary" to={`/connexion?next=${encodeURIComponent(pathname)}`}>Se connecter</Link></div></main>;
  const section = segments[1] || '';
  let page = <Dashboard />;
  if (section === 'catalogue') {
    const area = segments[2];
    if (area === 'produits') page = segments[3] ? <ProductEditor id={segments[3]} /> : <Products />;
    else if (area === 'marques') page = <TaxonomyPage kind="brands" title="Marques" />;
    else if (area === 'types-de-soin') page = <TaxonomyPage kind="product-types" title="Types de soin" />;
    else if (area === 'types-de-peau') page = <TaxonomyPage kind="skin-types" title="Types de peau" />;
    else if (area === 'besoins') page = <TaxonomyPage kind="concerns" title="Besoins" />;
    else if (area === 'ingredients') page = <TaxonomyPage kind="ingredients" title="Ingrédients" />;
    else if (area === 'routines') page = <RoutineAdmin />;
    else if (area === 'packs') page = <BundleAdmin />;
  }
  else if (section === 'contenu') {
    const area = segments[2];
    if (area === 'homepage') page = <ContentEditor kind="homepage" title="Homepage" />;
    else if (area === 'faq') page = <ContentEditor kind="faq" title="FAQ" />;
    else if (area === 'menus') page = <ContentEditor kind="menus" title="Menus" />;
    else if (area === 'footer') page = <ContentEditor kind="footer" title="Footer" />;
    else if (area === 'conseils') page = <ArticleAdmin />;
  }
  else if (section === 'commandes') page = segments[2] ? <OrderDetail id={segments[2]} /> : <Orders />;
  else if (section === 'produits') page = segments[2] ? <ProductEditor id={segments[2]} /> : <Products />;
  else if (section === 'stock') page = <Products stockOnly />;
  else if (section === 'livraison') page = <Shipping />;
  else if (section === 'promotions') page = <Promotions />;
  else if (section === 'parametres') page = <Settings />;
  else if (section === 'clients') page = <ListPage title="Clients" endpoint="/admin/customers" columns={[["Nom", "name"], ["E-mail", "email"], ["Téléphone", "phone"], ["Commandes", "orders"]]} />;
  else if (section === 'alertes-stock') page = <ListPage title="Alertes stock" endpoint="/admin/stock-alerts" columns={[["Produit", "product_id"], ["E-mail", "email"], ["Date", "created_at"]]} />;
  else if (section === 'marques') page = <ListPage title="Marques" endpoint="/brands" columns={[["Nom", "name"], ["Produits", "count"]]} />;
  else if (section === 'categories') page = <ListPage title="Catégories" endpoint="/categories" columns={[["Nom", "name"], ["Produits", "count"]]} />;
  else if (section === 'avis') page = <><h1>Avis</h1><div className="state-panel"><h2>Avis publics désactivés</h2><p>La publication nécessite une commande livrée et une modération.</p></div></>;
  else if (section) page = <><h1>{section.replaceAll('-', ' ')}</h1><div className="state-panel"><h2>Données vérifiées requises</h2><p>Les attributs de soin seront ajoutés après vérification des sources officielles.</p><Link className="button-primary" to="/admin/produits">Gérer les produits</Link></div></>;
  return <main className="admin-shell"><aside className="admin-sidebar"><Link className="admin-logo" to="/admin">THE K-SKIN <strong>GALLERY</strong><small>Administration</small></Link><nav>{nav.map(([group, items]) => <div className="admin-nav-group" key={group}><h2>{group}</h2>{items.map(([name, path]) => <Link className={pathname === path ? 'active' : ''} key={path} to={path}>{name}</Link>)}</div>)}</nav><Link className="admin-store-link" to="/">Voir la boutique <ArrowRight size={15} /></Link></aside><div className="admin-content">{page}</div></main>;
}
