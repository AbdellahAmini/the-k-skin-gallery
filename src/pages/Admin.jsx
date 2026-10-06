import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Package, Phone, ShieldCheck } from '@phosphor-icons/react';
import { Link, useLocation, useNavigate } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Dialog from '@radix-ui/react-dialog';
import ProductImage from '../components/ProductImage';
import { api, money } from '../lib/api';
import { AdminShell } from '../admin/AdminShell.jsx';
import { OrdersPage, ProductsPage } from '../admin/AdminDataViews.jsx';
import AdminCreateProduct from '../admin/AdminCreateProduct.jsx';

import '../admin/admin-v2.css';

const nav = [
  ['Commerce', [['Tableau de bord', '/admin'], ['Commandes', '/admin/commandes']]],
  ['Catalogue', [['Produits', '/admin/catalogue/produits'], ['Marques', '/admin/catalogue/marques'],
    ['Types de soin', '/admin/catalogue/types-de-soin'], ['Sous-types de soin', '/admin/catalogue/sous-types-de-soin'], ['Types de peau', '/admin/catalogue/types-de-peau'],
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

function useProductLookup(selectedIds = [], enabled = true) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  useEffect(() => {
    if (!enabled) { setProducts([]); return undefined; }
    let live = true;
    const timer = window.setTimeout(async () => {
      const query = new URLSearchParams({ limit: '20', publication_status: 'published' });
      if (search.trim()) query.set('q', search.trim());
      const selectedQuery = selectedIds.length ? api(`/admin/products?ids=${selectedIds.join(',')}`) : Promise.resolve({ products: [] });
      try {
        const [matches, selected] = await Promise.all([api(`/admin/products?${query}`), selectedQuery]);
        if (live) setProducts([...new Map([...(matches.products || []), ...(selected.products || [])].map((item) => [item.id, item])).values()]);
      } catch { if (live) setProducts([]); }
    }, 180);
    return () => { live = false; clearTimeout(timer); };
  }, [search, selectedIds.join(','), enabled]);
  return { search, setSearch, products };
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
  const [statusNote, setStatusNote] = useState('');
  async function update(status) {
    if (!statusNote.trim()) { setActionError('Ajoutez une note pour garder le contexte du changement dans l’historique.'); return; }
    if (status === 'annulee' && !window.confirm('Annuler cette commande et libérer le stock réservé ?')) return;
    setBusy(true); setActionError('');
    try { await api(`/admin/orders/${id}/status`, { method: 'POST', body: { status, note: statusNote.trim() } }); setStatusNote(''); reload(); }
    catch (e) { setActionError(e.message); } finally { setBusy(false); }
  }
  if (error) return <div className="state-panel"><p>{error}</p><Link to="/admin/commandes">Retour</Link></div>;
  if (!order) return <p>Chargement…</p>;
  return <><Link className="text-link" to="/admin/commandes"><ArrowLeft size={16} /> Commandes</Link><div className="admin-heading"><div><h1>{order.number}</h1><span className="status-pill">{labels[order.status]}</span></div><strong>{money(order.total_dh)}</strong></div>
    <div className="admin-detail-grid"><section className="admin-panel"><h2>Client & livraison</h2><p><strong>{order.first_name} {order.last_name}</strong></p><p><a className="call-link" href={`tel:${order.phone}`}><Phone size={17} /> Appeler {order.phone}</a></p><p>{order.email}</p><p>{order.address}, {order.district}, {order.city}<br />{order.region}</p>{order.complement && <p>Complément : {order.complement}</p>}{order.delivery_notes && <p>Note : {order.delivery_notes}</p>}</section>
      <section className="admin-panel"><h2>Actions</h2><label>Note à ajouter à l’historique<textarea rows={3} required aria-required="true" value={statusNote} onChange={(event) => setStatusNote(event.target.value)} placeholder="Ex. Client joint, livraison confirmée pour demain." /></label><div className="admin-actions">{(transitions[order.status] || []).map((status) => <button key={status} className={status === 'annulee' ? 'button-outline' : 'button-primary'} onClick={() => update(status)} disabled={busy}>{labels[status]}</button>)}</div>{actionError && <p role="alert" className="form-error">{actionError}</p>}</section></div>
    <section className="admin-panel"><h2>Articles</h2>{order.items.map((item, i) => <div className="admin-order-line" key={i}><ProductImage src={item.image_url} alt="" /><span>{item.quantity} × {item.brand} {item.name}</span><strong>{money(item.line_total_dh)}</strong></div>)}<p className="summary-row">Sous-total <strong>{money(order.subtotal_dh)}</strong></p><p className="summary-row">Remise <strong>−{money(order.discount_dh)}</strong></p><p className="summary-row">Livraison <strong>{money(order.shipping_dh)}</strong></p><p className="summary-row grand-total">Total <strong>{money(order.total_dh)}</strong></p></section>
    <section className="admin-panel"><h2>Historique</h2><ol className="status-history">{order.history.map((h, i) => <li key={i}><strong>{labels[h.status]}</strong><small>{new Date(h.created_at).toLocaleString('fr-FR')}</small>{h.note && <span>{h.note}</span>}</li>)}</ol></section></>;
}

function Products({ stockOnly = false }) {
  const [query, setQuery] = useState('');
  const [publication, setPublication] = useState('');
  const [verification, setVerification] = useState('');
  const [inventory, setInventory] = useState('');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState([]);
  const [action, setAction] = useState('');
  const [actionValue, setActionValue] = useState('');
  const [message, setMessage] = useState('');
  const [types] = useData('/admin/taxonomy/product-types');
  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ page: String(page), page_size: '24' });
      if (query.trim()) params.set('q', query.trim());
      if (publication) params.set('publication_status', publication);
      if (verification) params.set('verification_status', verification);
      if (inventory) params.set('inventory_status', inventory);
      api(`/admin/products?${params}`).then((result) => { if (alive) { setData(result); setError(''); setSelected([]); } })
        .catch((cause) => alive && setError(cause.message));
    }, 160);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [query, publication, verification, inventory, page, revision]);
  async function bulkSubmit(event) {
    event.preventDefault(); setMessage('');
    if (!selected.length || !action) { setMessage('Sélectionnez des produits et une action.'); return; }
    let body = { product_ids: selected };
    if (action === 'publication') body.publication_status = actionValue;
    if (action === 'featured') body.featured = actionValue === 'true';
    if (action === 'threshold') body.low_stock_threshold = Number(actionValue);
    if (action === 'type') body.category_slug = actionValue;
    try { const result = await api('/admin/products/bulk', { method: 'POST', body }); setMessage(`${result.updated} produit(s) mis à jour.`); setPage(1); setRevision((value) => value + 1); }
    catch (cause) { setMessage(cause.message); }
  }
  const rows = data?.products || [];
  const allSelected = rows.length > 0 && rows.every((row) => selected.includes(row.id));
  const toggleAll = () => setSelected(allSelected ? selected.filter((id) => !rows.some((row) => row.id === id)) : [...new Set([...selected, ...rows.map((row) => row.id)])]);
  return <><h1>{stockOnly ? 'Stock & disponibilité' : 'Produits'}</h1>
    <div className="admin-toolbar catalog-admin-filters"><input aria-label="Rechercher un produit" placeholder="Rechercher un produit…" value={query} onChange={(event) => { setPage(1); setQuery(event.target.value); }} />
      <select aria-label="Filtrer par vérification" value={verification} onChange={(event) => { setPage(1); setVerification(event.target.value); }}><option value="">Toutes les vérifications</option><option value="VERIFIED">Vérifié</option><option value="PARTIAL">Partiel</option><option value="NEEDS_REVIEW">À vérifier</option><option value="UNVERIFIED">Non vérifié</option></select>
      <select aria-label="Filtrer par publication" value={publication} onChange={(event) => { setPage(1); setPublication(event.target.value); }}><option value="">Toutes les publications</option><option value="published">Publié</option><option value="draft">Brouillon</option><option value="archived">Archivé</option></select>
      <select aria-label="Filtrer par stock" value={inventory} onChange={(event) => { setPage(1); setInventory(event.target.value); }}><option value="">Tous les stocks</option><option value="in_stock">En stock</option><option value="low_stock">Stock faible</option><option value="out_of_stock">Rupture</option></select>
      <span>{data ? `${data.total} produit(s)` : 'Chargement…'}</span></div>
    <form className="admin-panel admin-bulk-toolbar" onSubmit={bulkSubmit}><label><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Sélectionner la page" /> Sélectionner la page</label><span>{selected.length} sélectionné(s)</span><select value={action} onChange={(event) => { setAction(event.target.value); setActionValue(''); }}><option value="">Action groupée…</option><option value="publication">État de publication</option><option value="featured">À la une</option><option value="threshold">Seuil de stock faible</option><option value="type">Type de soin</option></select>
      {action === 'publication' && <select required value={actionValue} onChange={(event) => setActionValue(event.target.value)}><option value="">Choisir…</option><option value="published">Publier</option><option value="draft">Brouillon</option><option value="archived">Archiver</option></select>}
      {action === 'featured' && <select required value={actionValue} onChange={(event) => setActionValue(event.target.value)}><option value="">Choisir…</option><option value="true">À la une</option><option value="false">Retirer de la une</option></select>}
      {action === 'threshold' && <input required aria-label="Seuil de stock faible" type="number" min="0" value={actionValue} onChange={(event) => setActionValue(event.target.value)} placeholder="Seuil" />}
      {action === 'type' && <select required value={actionValue} onChange={(event) => setActionValue(event.target.value)}><option value="">Choisir un type…</option>{types?.map((type) => <option key={type.slug} value={type.slug}>{type.name}</option>)}</select>}
      <button className="button-primary" disabled={!selected.length || !action || !actionValue}>Appliquer</button>{message && <p role="status">{message}</p>}</form>
    {error && <p role="alert" className="form-error">{error}</p>}
    {data && !rows.length && <div className="state-panel"><h2>Aucun produit</h2><p>Modifiez votre recherche ou vos filtres.</p></div>}
    {rows.length > 0 && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th></th><th>Produit</th><th>Vérification</th><th>Stock</th><th>Publication</th><th></th></tr></thead><tbody>{rows.map((product) => <tr key={product.id}><td><input aria-label={`Sélectionner ${product.name}`} type="checkbox" checked={selected.includes(product.id)} onChange={(event) => setSelected(event.target.checked ? [...selected, product.id] : selected.filter((id) => id !== product.id))} /></td><td><div className="admin-product-name"><ProductImage src={product.image_url} alt="" /><span><b>{product.brand}</b><br />{product.name}<br /><small>{product.sku}</small></span></div></td><td><span className={`catalog-state catalog-verify-${product.verification_status.toLowerCase()}`}>{({ VERIFIED: 'Vérifié', PARTIAL: 'Partiel', NEEDS_REVIEW: 'À vérifier', UNVERIFIED: 'Non vérifié' })[product.verification_status]}</span></td><td><span className={`catalog-state catalog-stock-${product.inventory_status}`}>{product.inventory_status === 'in_stock' ? `En stock · ${product.stock}` : product.inventory_status === 'low_stock' ? `Stock faible · ${product.stock}` : 'Rupture'}</span></td><td><span className={`catalog-state catalog-publication-${product.publication_status}`}>{({ published: 'Publié', draft: 'Brouillon', archived: 'Archivé' })[product.publication_status]}</span></td><td><Link to={`/admin/catalogue/produits/${product.id}`}>Modifier</Link></td></tr>)}</tbody></table></div>}
    {data?.pages > 1 && <nav className="pagination" aria-label="Pages du catalogue admin">{page > 1 && <button onClick={() => setPage(page - 1)}>Précédent</button>}<span>Page {page} sur {data.pages}</span>{page < data.pages && <button onClick={() => setPage(page + 1)}>Suivant</button>}</nav>}
  </>;
}

function ProductEditor({ id }) {
  const [original, error, reload, setProduct] = useData(`/admin/products/${id}`);
  const [subtypeRows] = useData('/admin/taxonomy/product-subtypes');
  const [typeRows] = useData('/admin/taxonomy/product-types');
  const [skinRows] = useData('/admin/taxonomy/skin-types');
  const [concernRows] = useData('/admin/taxonomy/concerns');
  const [ingredientRows] = useData('/admin/taxonomy/ingredients');
  const [values, setValues] = useState(null);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [savedSignature, setSavedSignature] = useState('');
  useEffect(() => { if (original && !values) {
    const initial = { official_name: original.official_name, display_name_fr: original.display_name_fr,
    product_subtype_slug: original.product_subtype_slug || '', barcode: original.barcode || '', size: original.size || '', size_value: original.size_value || '', size_unit: original.size_unit || '',
    price_dh: original.price_dh, compare_at_dh: original.compare_at_dh ?? '', cost_dh: original.cost_dh ?? '', wholesale_dh: original.wholesale_dh ?? '', stock: original.stock, low_stock_threshold: original.low_stock_threshold,
    publication_status: original.publication_status, verification_status: original.verification_status,
    classification_verified: original.classification_verified,
    featured: original.featured, new_arrival: original.new_arrival,
    category_slug: original.category_slug,
    skin_type_slugs: original.skin_types?.map((item) => item.slug) || [],
    concern_slugs: original.concerns?.map((item) => item.slug) || [],
    ingredient_slugs: original.ingredients?.map((item) => item.slug) || [],
    usage_time: original.usage_time || '', routine_step: original.routine_step || '',
    search_aliases: original.search_aliases || '',
    new_until: original.new_until?.slice(0, 10) || '',
    official_source_name: original.official_source_name || '', mark_verified: false,
    short_description: original.short_description || '', description: original.description || '',
    manufacturer_description: original.manufacturer_description || '', manufacturer_benefits: original.manufacturer_benefits || '',
    benefits_fr: original.benefits_fr || '', usage_instructions_fr: original.usage_instructions_fr || '', warnings_fr: original.warnings_fr || '',
    usage_instructions: original.usage_instructions || '', inci: original.inci || '', source_language: original.source_language || '',
    official_source_url: original.official_source_url || '', seo_title: original.seo_title || '', seo_description: original.seo_description || '', image_url: original.image_url || '' };
    setValues(initial); setSavedSignature(JSON.stringify(initial));
  } }, [original, values]);
  const dirty = Boolean(values && JSON.stringify(values) !== savedSignature);
  async function save(event) {
    event.preventDefault(); setMessage('');
    try { await api(`/admin/products/${id}`, { method: 'PATCH', body: { ...values,
      price_dh: Number(values.price_dh), stock: Number(values.stock), low_stock_threshold: Number(values.low_stock_threshold),
      cost_dh: values.cost_dh === '' ? null : Number(values.cost_dh), wholesale_dh: values.wholesale_dh === '' ? null : Number(values.wholesale_dh),
      compare_at_dh: values.compare_at_dh === '' ? null : Number(values.compare_at_dh),
      size_value: values.size_value === '' ? null : Number(values.size_value),
      new_until: values.new_until ? `${values.new_until}T23:59:59Z` : null } }); setMessage('Produit enregistré.'); setSavedSignature(JSON.stringify(values)); reload(); }
    catch (e) { setMessage(e.message); }
  }
  async function uploadImage(file) {
    if (!file) return;
    const body = new FormData(); body.append('file', file);
    setUploading(true); setMessage('');
    try {
      const result = await api(`/admin/products/${id}/images`, { method: 'POST', body });
      if (result.is_primary) setValues((current) => ({ ...current, image_url: result.image_url }));
      setMessage('Image optimisée et ajoutée à la galerie.'); reload();
    } catch (cause) { setMessage(cause.message); }
    finally { setUploading(false); }
  }
  if (error) return <p role="alert" className="form-error">{error}</p>;
  if (!original || !values) return <p>Chargement…</p>;
  const field = (key, label, type = 'text') => <label key={key}>{label}<input type={type} value={values[key]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} /></label>;
  const area = (key, label) => <label key={key}>{label}<textarea rows={4} value={values[key]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} /></label>;
  const multi = (key, title, options) => <fieldset className="admin-taxonomy-checks"><legend>{title}</legend>{options?.length ? options.map((item) => <label key={item.slug}><input type="checkbox" checked={values[key].includes(item.slug)} onChange={(event) => setValues({ ...values, [key]: event.target.checked ? [...values[key], item.slug] : values[key].filter((slug) => slug !== item.slug) })} /> {item.name}</label>) : <small>Aucune entrée disponible.</small>}</fieldset>;
  return <><Link className="text-link" to="/admin/catalogue/produits"><ArrowLeft size={16} /> Produits</Link><h1>{original.name}</h1><form className="admin-panel admin-editor" onSubmit={save}><div className="admin-editor-top"><ProductImage src={original.image_url} alt={original.name} /><div><p><strong>{original.brand}</strong> · {original.sku} · {original.category}</p><p>Les coûts et prix grossistes restent accessibles uniquement dans cet écran admin.</p></div></div>
      <section className="admin-product-section"><h2>Identité</h2><div className="form-grid">{field('official_name', 'Nom officiel du fabricant')}{field('display_name_fr', 'Nom affiché en français')}{field('barcode', 'Code-barres')}{field('size', 'Format affiché')}{field('size_value', 'Valeur du format', 'number')}{field('size_unit', 'Unité (ml, g…)')}<label>Type de soin<select value={values.category_slug} onChange={(event) => setValues({ ...values, category_slug: event.target.value, product_subtype_slug: '' })}>{typeRows?.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label><label>Sous-type<select value={values.product_subtype_slug} onChange={(event) => setValues({ ...values, product_subtype_slug: event.target.value })}><option value="">Aucun</option>{subtypeRows?.filter((item) => item.product_type_id === typeRows?.find((type) => type.slug === values.category_slug)?.id).map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label></div></section>
      <section className="admin-product-section"><h2>Commercial</h2><div className="form-grid">{field('price_dh', 'Prix public (DH)', 'number')}{field('compare_at_dh', 'Prix barré (DH)', 'number')}{field('cost_dh', 'Coût interne (DH)', 'number')}{field('wholesale_dh', 'Prix grossiste (DH)', 'number')}</div></section>
      <section className="admin-product-section"><h2>Inventaire & publication</h2><div className="form-grid">{field('stock', 'Stock disponible', 'number')}{field('low_stock_threshold', 'Seuil stock faible', 'number')}<label>Publication<select value={values.publication_status} onChange={(event) => setValues({ ...values, publication_status: event.target.value })}><option value="draft">Brouillon</option><option value="published">Publié</option><option value="archived">Archivé</option></select></label><label>Vérification<select value={values.verification_status} onChange={(event) => setValues({ ...values, verification_status: event.target.value })}><option value="UNVERIFIED">Non vérifié</option><option value="PARTIAL">Partiel</option><option value="NEEDS_REVIEW">À vérifier</option><option value="VERIFIED">Vérifié</option></select></label></div><div className="admin-checks"><label><input type="checkbox" checked={values.featured} onChange={(event) => setValues({ ...values, featured: event.target.checked })} /> À la une</label><label><input type="checkbox" checked={values.mark_verified} onChange={(event) => setValues({ ...values, mark_verified: event.target.checked })} /> Vérifier aujourd’hui</label></div></section>
      <section className="admin-product-section"><h2>Classification</h2><p className="quiet-note">Les filtres peau, besoins et ingrédients ne s’affichent qu’après validation de ces associations par la Gallery.</p><div className="admin-taxonomy-grid">{multi('skin_type_slugs', 'Types de peau', skinRows)}{multi('concern_slugs', 'Besoins', concernRows)}{multi('ingredient_slugs', 'Ingrédients clés', ingredientRows)}</div><label className="admin-verify"><input type="checkbox" checked={values.classification_verified} onChange={(event) => setValues({ ...values, classification_verified: event.target.checked })} /> Associations vérifiées pour le catalogue</label><div className="form-grid"><label>Utilisation<select value={values.usage_time} onChange={(event) => setValues({ ...values, usage_time: event.target.value })}><option value="">Non renseignée</option><option value="am">Matin</option><option value="pm">Soir</option><option value="both">Matin & soir</option></select></label>{field('routine_step', 'Étape de routine')}{field('new_until', 'Nouveauté jusqu’au', 'date')}</div>{field('search_aliases', 'Alias de recherche')}</section>
      <section className="admin-product-section"><h2>Contenu</h2>{field('short_description', 'Description courte en français')}{area('description', 'Description française')}{area('benefits_fr', 'Bénéfices en français')}{area('usage_instructions_fr', 'Conseils d’utilisation français')}{area('warnings_fr', 'Précautions')}</section>
      <section className="admin-product-section"><h2>Informations officielles</h2><p className="quiet-note">Séparez les faits publiés par le fabricant des textes rédigés par la Gallery.</p>{area('manufacturer_description', 'Description fabricant')}{area('manufacturer_benefits', 'Bénéfices / allégations fabricant')}{area('usage_instructions', 'Instructions du fabricant')}{area('inci', 'Liste INCI complète')}{field('source_language', 'Langue de la source')}{field('official_source_name', 'Nom de la source officielle')}{field('official_source_url', 'URL fabricant (http/https)')}</section>
      <section className="admin-product-section"><h2>SEO & médias</h2>{field('seo_title', 'Titre SEO')}{area('seo_description', 'Description SEO')}<label className="admin-v2-media-upload">Ajouter un média local<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadImage(event.target.files?.[0])} disabled={uploading} /><small>PNG, JPEG ou WebP · 12 Mo maximum. Les fichiers sont optimisés en WebP.</small></label><div className="admin-image-gallery">{original.images?.map((image) => <figure key={`${image.image_url}-${image.position}`}><ProductImage src={image.image_url} alt={image.alt_text} /><figcaption>{image.is_primary ? 'Image principale' : `Image ${image.position + 1}`}</figcaption></figure>)}</div></section>
      <div className="admin-v2-sticky-save"><div><strong>{dirty ? 'Modifications non enregistrées' : 'Toutes les modifications sont enregistrées'}</strong><span>{message || `${original.brand} · ${original.sku}`}</span></div><button className="admin-v2-primary" disabled={!dirty || uploading}>{uploading ? 'Import en cours…' : 'Enregistrer les modifications'}</button></div>{message && <p role="status" className="admin-v2-form-message">{message}</p>}</form></>;
}

function Shipping() {
  const [cities, error, reload] = useData('/admin/cities');
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({ name: '', region: '', shipping_dh: 35, delivery_window: '24–48h' });
  const [message, setMessage] = useState('');
  async function save(city) {
    try { await api(`/admin/cities/${city.id}`, { method: 'PATCH', body: { shipping_dh: Number(editing.shipping_dh), delivery_window: editing.delivery_window, active: editing.active } }); setMessage('Ville et conditions de livraison enregistrées.'); setEditing(null); reload(); }
    catch (e) { setMessage(e.message); }
  }
  async function createCity(event) {
    event.preventDefault(); setMessage('');
    try { await api('/admin/cities', { method: 'POST', body: { ...draft, shipping_dh: Number(draft.shipping_dh) } }); setDraft({ name: '', region: '', shipping_dh: 35, delivery_window: '24–48h' }); setMessage('Ville ajoutée.'); reload(); }
    catch (e) { setMessage(e.message); }
  }
  return <><h1>Livraison & villes</h1><p className="quiet-note">Le tarif et le délai choisis ici sont recalculés par le serveur au moment de chaque commande COD.</p>{error && <p className="form-error">{error}</p>}{message && <p role="status">{message}</p>}
    {cities && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Ville</th><th>Région</th><th>Tarif</th><th>Délai indicatif</th><th>Active</th><th></th></tr></thead><tbody>{cities.map((city) => <tr key={city.id}><td>{city.name}</td><td>{city.region}</td><td>{editing?.id === city.id ? <input type="number" min="0" value={editing.shipping_dh} onChange={(event) => setEditing({ ...editing, shipping_dh: event.target.value })} /> : money(city.shipping_dh)}</td><td>{editing?.id === city.id ? <input maxLength="50" value={editing.delivery_window || ''} onChange={(event) => setEditing({ ...editing, delivery_window: event.target.value })} /> : city.delivery_window}</td><td>{editing?.id === city.id ? <input aria-label="Ville active" type="checkbox" checked={editing.active} onChange={(event) => setEditing({ ...editing, active: event.target.checked })} /> : city.active ? 'Oui' : 'Non'}</td><td>{editing?.id === city.id ? <button onClick={() => save(city)}>Enregistrer</button> : <button onClick={() => setEditing(city)}>Modifier</button>}</td></tr>)}</tbody></table></div>}
    <form className="admin-panel admin-editor admin-subform" onSubmit={createCity}><h2>Ajouter une ville</h2><div className="form-grid"><label>Ville<input required minLength="2" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label><label>Région<input value={draft.region} onChange={(event) => setDraft({ ...draft, region: event.target.value })} /></label><label>Tarif livraison (DH)<input type="number" min="0" value={draft.shipping_dh} onChange={(event) => setDraft({ ...draft, shipping_dh: event.target.value })} /></label><label>Délai indicatif<input maxLength="50" value={draft.delivery_window} onChange={(event) => setDraft({ ...draft, delivery_window: event.target.value })} /></label></div><button className="button-primary">Ajouter la ville</button></form>
  </>;
}

function Promotions() {
  const [promos, error, reload] = useData('/admin/promotions');
  const blank = { name: '', code: '', kind: 'percent', amount: 10, minimum_dh: 0, active: false };
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  function choose(row = null) { setEditing(row?.id || null); setForm(row ? { ...row, code: row.code || '' } : blank); setMessage(''); }
  async function submit(event) {
    event.preventDefault(); setMessage('');
    const body = { ...form, amount: Number(form.amount), minimum_dh: Number(form.minimum_dh), code: form.code || null };
    try {
      await api(`/admin/promotions${editing ? `/${editing}` : ''}`, { method: editing ? 'PATCH' : 'POST', body });
      setMessage(editing ? 'Promotion mise à jour.' : 'Promotion créée.'); choose(null); reload();
    } catch (cause) { setMessage(cause.message); }
  }
  async function toggle(promo) {
    setMessage('');
    try { await api(`/admin/promotions/${promo.id}`, { method: 'PATCH', body: { active: !promo.active } }); setMessage(`Promotion ${promo.active ? 'désactivée' : 'activée'}.`); reload(); }
    catch (cause) { setMessage(cause.message); }
  }
  return <><div className="admin-heading"><div><h1>Promotions</h1><p className="quiet-note">Types gérés par le moteur : pourcentage, montant fixe et livraison offerte.</p></div><button className="button-primary" onClick={() => choose()}>Créer une promotion</button></div>
    <p className="quiet-note">Les dates d’effet, le ciblage client/produit et la priorité ne sont pas présents dans le modèle actuel; ils ne sont pas simulés ici.</p>{error && <p className="form-error">{error}</p>}{message && <p role="status">{message}</p>}
    {promos && !promos.length && <div className="state-panel"><h2>Aucune promotion</h2><p>Créez une remise selon les types déjà pris en charge.</p></div>}
    {promos?.length > 0 && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Nom</th><th>Code</th><th>Type</th><th>Valeur</th><th>Minimum</th><th>État</th><th>Actions</th></tr></thead><tbody>{promos.map((promo) => <tr key={promo.id}><td>{promo.name}</td><td>{promo.code || 'Automatique'}</td><td>{{ percent: 'Pourcentage', fixed: 'Montant fixe', free_shipping: 'Livraison offerte' }[promo.kind] || promo.kind}</td><td>{promo.kind === 'percent' ? `${promo.amount}%` : promo.kind === 'fixed' ? money(promo.amount) : '—'}</td><td>{money(promo.minimum_dh)}</td><td>{promo.active ? 'Active' : 'Inactive'}</td><td><button type="button" onClick={() => choose(promo)}>Modifier</button> <button type="button" onClick={() => toggle(promo)}>{promo.active ? 'Désactiver' : 'Activer'}</button></td></tr>)}</tbody></table></div>}
    <form className="admin-panel admin-editor admin-subform" onSubmit={submit}><h2>{editing ? 'Modifier la promotion' : 'Nouvelle promotion'}</h2><div className="form-grid"><label>Nom<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Code <small>(vide = automatique)</small><input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} /></label><label>Type<select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value })}><option value="percent">Pourcentage</option><option value="fixed">Montant fixe</option><option value="free_shipping">Livraison offerte</option></select></label><label>Montant<input type="number" min="0" max={form.kind === 'percent' ? 100 : undefined} value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label><label>Minimum (DH)<input type="number" min="0" value={form.minimum_dh} onChange={(event) => setForm({ ...form, minimum_dh: event.target.value })} /></label><label className="admin-verify"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Active</label></div><button className="button-primary">{editing ? 'Enregistrer' : 'Créer la promotion'}</button>{editing && <button type="button" className="button-outline" onClick={() => choose()}>Annuler la modification</button>}</form>
  </>;
}

function Settings() {
  const [data, error, reload] = useData('/admin/settings');
  const [values, setValues] = useState(null);
  const [message, setMessage] = useState('');
  useEffect(() => { if (data && !values) setValues(data); }, [data, values]);
  async function save(e) { e.preventDefault(); try { await api('/admin/settings', { method: 'PUT', body: values }); setMessage('Paramètres enregistrés.'); reload(); } catch (err) { setMessage(err.message); } }
  if (error) return <p className="form-error">{error}</p>;
  if (!values) return <p>Chargement…</p>;
  return <><h1>Paramètres</h1><p className="quiet-note">Les changements s’appliquent aux informations de la boutique. Vérifiez le numéro et les URL avant l’enregistrement.</p><form className="admin-panel admin-editor" onSubmit={save}>{[['free_shipping_threshold_dh', 'Seuil de livraison offerte (DH)'], ['whatsapp_number', 'Numéro WhatsApp'], ['support_phone', 'Téléphone de support'], ['instagram_url', 'Instagram (URL)'], ['tiktok_url', 'TikTok (URL)']].map(([key, label]) => <label key={key}>{label}<input type={key === 'free_shipping_threshold_dh' ? 'number' : key.endsWith('_url') ? 'url' : 'tel'} min={key === 'free_shipping_threshold_dh' ? '0' : undefined} step={key === 'free_shipping_threshold_dh' ? '1' : undefined} pattern={key.endsWith('_number') || key === 'support_phone' ? '\\+?[0-9 ()-]{8,20}' : undefined} inputMode={key.endsWith('_number') || key === 'support_phone' ? 'tel' : undefined} value={values[key] || ''} onChange={(e) => setValues({ ...values, [key]: e.target.value })} /></label>)}<button className="button-primary">Enregistrer</button>{message && <p role="status">{message}</p>}</form></>;
}

function ListPage({ title, endpoint, columns, rowLink = '' }) {
  const [rows, error] = useData(endpoint);
  return <><h1>{title}</h1>{error && <p role="alert" className="form-error">{error}</p>}{rows && !rows.length && <div className="state-panel"><h2>Aucune donnée</h2><p>Les éléments enregistrés apparaîtront ici.</p></div>}{rows?.length > 0 && <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{columns.map(([label]) => <th key={label}>{label}</th>)}{rowLink && <th></th>}</tr></thead><tbody>{rows.map((row, i) => <tr key={row.id || i}>{columns.map(([label, key]) => <td key={label}>{String(row[key] ?? '')}</td>)}{rowLink && <td><Link className="admin-v2-row-link" to={`${rowLink}${row.id}`}>Ouvrir</Link></td>}</tr>)}</tbody></table></div>}</>;
}

function CustomerDetail({ id }) {
  const [customer, error] = useData(`/admin/customers/${id}`);
  if (error) return <div className="state-panel"><p role="alert">{error}</p><Link to="/admin/clients">Retour aux clients</Link></div>;
  if (!customer) return <p>Chargement…</p>;
  return <><Link className="text-link" to="/admin/clients"><ArrowLeft size={16} /> Clients</Link><div className="admin-heading"><div><h1>{customer.name || customer.email}</h1><p>{customer.email} · {customer.phone}</p></div><div><strong>{customer.orders_count} commande(s)</strong><br /><span>{money(customer.lifetime_value_dh)} de commandes historiques</span></div></div><p className="quiet-note">Les adresses ci-dessous proviennent des instantanés de livraison des commandes passées. Le compte client ne stocke pas d’adresse par défaut.</p>{customer.orders.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Commande</th><th>Statut</th><th>Ville</th><th>Adresse historique</th><th>Total</th><th>Date</th></tr></thead><tbody>{customer.orders.map((order) => <tr key={order.id}><td><Link to={`/admin/commandes/${order.id}`}>{order.number}</Link></td><td>{labels[order.status] || order.status}</td><td>{order.city}</td><td>{order.address}, {order.district}</td><td>{money(order.total_dh)}</td><td>{new Date(order.created_at).toLocaleDateString('fr-FR')}</td></tr>)}</tbody></table></div> : <div className="state-panel"><h2>Aucune commande</h2><p>Ce compte n’a pas encore passé de commande.</p></div>}</>;
}

function TaxonomyPage({ kind, title }) {
  const [rows, error, reload] = useData(`/admin/taxonomy/${kind}`);
  const [productTypes] = useData('/admin/taxonomy/product-types');
  const [editing, setEditing] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const blank = { name: '', slug: '', description: '', active: true, logo: '', official_website: '', featured_homepage: false, homepage_order: 0, seo_title: '', seo_description: '', product_type_slug: '' };
  const [form, setForm] = useState(blank);
  const [message, setMessage] = useState('');
  const supportsDeactivation = ['brands', 'product-subtypes', 'skin-types', 'concerns'].includes(kind);
  const editorHeading = { brands: editing ? 'Modifier la marque' : 'Ajouter une marque', 'product-types': editing ? 'Modifier le type de soin' : 'Ajouter un type de soin', 'product-subtypes': editing ? 'Modifier le sous-type de soin' : 'Ajouter un sous-type de soin', 'skin-types': editing ? 'Modifier le type de peau' : 'Ajouter un type de peau', concerns: editing ? 'Modifier le besoin' : 'Ajouter un besoin', ingredients: editing ? 'Modifier l’ingrédient' : 'Ajouter un ingrédient' }[kind] || title;
  function choose(row = null) { setEditing(row?.id || null); setForm(row ? { ...blank, ...row, description: row.description_fr || row.description || '', product_type_slug: productTypes?.find((item) => item.id === row.product_type_id)?.slug || '' } : { ...blank }); setMessage(''); setEditorOpen(true); }
  async function save(event) {
    event.preventDefault(); setMessage('');
    try {
      await api(`/admin/taxonomy/${kind}${editing ? `/${editing}` : ''}`, { method: editing ? 'PATCH' : 'POST', body: form });
      setEditorOpen(false); setEditing(null); setForm({ ...blank }); setMessage('Enregistré.'); reload();
    } catch (cause) { setMessage(cause.message); }
  }
  return <><div className="admin-heading"><h1>{title}</h1><button type="button" className="button-outline" onClick={() => choose()}>Ajouter</button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <p className="quiet-note">Ces entrées organisent le catalogue. Les enregistrements ne sont pas supprimés; désactiver une entrée prise en charge la retire des nouveaux usages publics tout en conservant les associations historiques.{!supportsDeactivation && ' Cette taxonomie ne possède pas encore de champ actif dans son modèle.'}</p>
    {message && <p className="admin-v2-inline-status" role="status">{message}</p>}
    {rows && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Nom</th><th>Adresse</th>{supportsDeactivation && <th>État</th>}<th>Produits</th><th></th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.name}</td><td>{row.slug}</td>{supportsDeactivation && <td>{row.active ? 'Actif' : 'Inactif'}</td>}<td>{row.count}</td><td><button type="button" onClick={() => choose(row)}>Modifier</button></td></tr>)}</tbody></table></div>}
    <Dialog.Root open={editorOpen} onOpenChange={setEditorOpen}>
      <Dialog.Portal><Dialog.Overlay className="admin-v2-dialog-overlay" /><Dialog.Content className="admin-v2-dialog-content">
        <div className="admin-v2-dialog-heading"><div><Dialog.Title>{editorHeading}</Dialog.Title><Dialog.Description>Les produits déjà associés restent inchangés. Les modifications s’appliquent après enregistrement.</Dialog.Description></div><Dialog.Close className="admin-v2-close" aria-label="Fermer">×</Dialog.Close></div>
        <form className="admin-panel admin-editor admin-subform admin-v2-dialog-form" onSubmit={save}><div className="form-grid"><label>Nom<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Adresse courte<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label></div>{['skin-types', 'concerns', 'brands'].includes(kind) && <label>Courte description en français<textarea rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>}{kind === 'brands' && <><div className="form-grid"><label>Logo local ou URL<input value={form.logo} onChange={(event) => setForm({ ...form, logo: event.target.value })} /></label><label>Site officiel<input type="url" value={form.official_website} onChange={(event) => setForm({ ...form, official_website: event.target.value })} /></label><label>Ordre d’accueil<input type="number" value={form.homepage_order} onChange={(event) => setForm({ ...form, homepage_order: event.target.value })} /></label></div><div className="form-grid"><label>Titre SEO<input value={form.seo_title} onChange={(event) => setForm({ ...form, seo_title: event.target.value })} /></label><label>Description SEO<input value={form.seo_description} onChange={(event) => setForm({ ...form, seo_description: event.target.value })} /></label></div><label className="admin-verify"><input type="checkbox" checked={form.featured_homepage} onChange={(event) => setForm({ ...form, featured_homepage: event.target.checked })} /> Marque mise en avant sur l’accueil</label></>}{kind === 'product-subtypes' && <label>Type de soin parent<select required value={form.product_type_slug} onChange={(event) => setForm({ ...form, product_type_slug: event.target.value })}><option value="">Choisir…</option>{productTypes?.filter((item) => item.active !== false).map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>}{supportsDeactivation && <label className="admin-verify"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Actif</label>}<div className="admin-v2-dialog-actions"><button type="button" className="button-outline" onClick={() => setEditorOpen(false)}>Annuler</button><button className="button-primary">Enregistrer</button></div>{message && <p role="status">{message}</p>}</form>
      </Dialog.Content></Dialog.Portal>
    </Dialog.Root>
  </>;
}

function BundleAdmin() {
  const [rows, error, reload] = useData('/admin/bundles');
  const blank = { name: '', slug: '', description: '', image_url: '', price_dh: 0, compare_at_dh: '', active: false, items: [{ product_id: '', quantity: 1 }, { product_id: '', quantity: 1 }] };
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const productLookup = useProductLookup(form.items.map((item) => Number(item.product_id)).filter(Boolean));
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
    <form className="admin-panel admin-editor admin-subform" onSubmit={save}><h2>{editing ? 'Modifier le pack' : 'Nouveau pack'}</h2><div className="form-grid"><label>Nom<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Adresse courte<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label><label>Prix (DH)<input type="number" min="0" value={form.price_dh} onChange={(event) => setForm({ ...form, price_dh: event.target.value })} /></label><label>Prix barré (DH)<input type="number" min="0" value={form.compare_at_dh} onChange={(event) => setForm({ ...form, compare_at_dh: event.target.value })} /></label></div><label>Description<textarea rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label>Image (URL)<input value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} /></label><h3>Composants</h3><label>Rechercher dans le catalogue<input value={productLookup.search} onChange={(event) => productLookup.setSearch(event.target.value)} placeholder="Nom, marque ou SKU…" /><small>Résultats recherchés côté serveur; le catalogue complet n’est pas téléchargé.</small></label>{form.items.map((item, index) => <div className="admin-component-row" key={index}><select required value={item.product_id} onChange={(event) => component(index, { product_id: event.target.value })}><option value="">Choisir un produit</option>{productLookup.products.filter((product) => product.active).map((product) => <option key={product.id} value={product.id}>{product.sku} · {product.name}</option>)}</select><input type="number" min="1" max="25" aria-label="Quantité du composant" value={item.quantity} onChange={(event) => component(index, { quantity: event.target.value })} /><button type="button" disabled={form.items.length <= 2} onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })}>Retirer</button></div>)}<button type="button" className="button-outline" onClick={() => setForm({ ...form, items: [...form.items, { product_id: '', quantity: 1 }] })}>Ajouter un composant</button><label className="admin-verify"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Pack actif</label><button className="button-primary">Enregistrer</button>{message && <p role="status">{message}</p>}</form>
  </>;
}

function RoutineAdmin() {
  const [rows, error, reload] = useData('/admin/routines');
  const [categories] = useData('/admin/taxonomy/product-types');
  const blank = { name: '', slug: '', description: '', active: true, steps: [{ name: '', description: '', category_slug: '', product_ids: [] }] };
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const productLookup = useProductLookup(form.steps.flatMap((step) => step.product_ids).map(Number));
  const [message, setMessage] = useState('');
  function choose(row) { setEditing(row?.id || null); setForm(row ? { name: row.name, slug: row.slug, description: row.description, active: row.active, steps: row.steps.map((step) => ({ name: step.name, description: step.description, category_slug: step.category_slug, product_ids: step.products.map((product) => product.id) })) } : blank); setMessage(''); }
  function stepChange(index, patch) { setForm((current) => ({ ...current, steps: current.steps.map((step, i) => i === index ? { ...step, ...patch } : step) })); }
  async function save(event) { event.preventDefault(); setMessage(''); try { await api(`/admin/routines${editing ? `/${editing}` : ''}`, { method: editing ? 'PUT' : 'POST', body: form }); setMessage('Routine enregistrée.'); reload(); } catch (cause) { setMessage(cause.message); } }
  return <><div className="admin-heading"><h1>Routines</h1><button className="button-outline" onClick={() => choose(null)}>Créer une routine</button></div>{error && <p className="form-error">{error}</p>}
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Routine</th><th>Étapes</th><th>État</th><th></th></tr></thead><tbody>{rows?.map((row) => <tr key={row.id}><td>{row.name}</td><td>{row.steps.length}</td><td>{row.active ? 'Active' : 'Inactive'}</td><td><button onClick={() => choose(row)}>Modifier</button></td></tr>)}</tbody></table></div>
    <form className="admin-panel admin-editor admin-subform" onSubmit={save}><h2>{editing ? 'Modifier la routine' : 'Nouvelle routine'}</h2><div className="form-grid"><label>Nom<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Adresse courte<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label></div><label>Description<textarea rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><h3>Étapes</h3>{form.steps.map((step, index) => <div className="admin-step-editor" key={index}><strong>Étape {index + 1}</strong><div className="form-grid"><label>Nom<input required value={step.name} onChange={(event) => stepChange(index, { name: event.target.value })} /></label><label>Type de soin<select value={step.category_slug} onChange={(event) => stepChange(index, { category_slug: event.target.value, product_subtype_slug: '' })}><option value="">Choisir</option>{categories?.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label></div><label>Explication<input value={step.description} onChange={(event) => stepChange(index, { description: event.target.value })} /></label><label>Rechercher dans le catalogue<input value={productLookup.search} onChange={(event) => productLookup.setSearch(event.target.value)} placeholder="Nom, marque ou SKU…" /><small>Les produits associés restent sélectionnés pendant la recherche.</small></label><label>Produits sélectionnés<select multiple size={5} value={step.product_ids.map(String)} onChange={(event) => stepChange(index, { product_ids: [...event.target.selectedOptions].map((option) => Number(option.value)) })}>{productLookup.products.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.sku} · {item.name}</option>)}</select></label><button type="button" disabled={form.steps.length <= 1} onClick={() => setForm({ ...form, steps: form.steps.filter((_, i) => i !== index) })}>Retirer l’étape</button></div>)}<button type="button" className="button-outline" onClick={() => setForm({ ...form, steps: [...form.steps, { name: '', description: '', category_slug: '', product_ids: [] }] })}>Ajouter une étape</button><label className="admin-verify"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Routine active</label><button className="button-primary">Enregistrer</button>{message && <p role="status">{message}</p>}</form>
  </>;
}

function ContentEditor({ kind, title }) {
  const [data, error, reload] = useData(`/admin/content/${kind}`);
  const [brands] = useData('/admin/taxonomy/brands');
  const [routines] = useData('/admin/routines');
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  useEffect(() => { if (data) setForm(data); }, [data, kind]);
  async function save(event) {
    event.preventDefault(); setMessage('');
    if (kind === 'homepage') {
      const destinations = [form.hero_cta_path, ...(form.entry_cards || []).map((card) => card.path)].filter(Boolean);
      if (destinations.some((path) => !path.startsWith('/') || path.startsWith('//'))) {
        setMessage('Utilisez une destination interne commençant par / pour chaque bouton de la page d’accueil.');
        return;
      }
    }
    try { await api(`/admin/content/${kind}`, { method: 'PUT', body: form }); setMessage('Contenu enregistré.'); reload(); } catch (cause) { setMessage(cause.message); }
  }
  const field = (key, label, rows = 0) => <label>{label}{rows ? <textarea rows={rows} value={form[key] || ''} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /> : <input value={form[key] || ''} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />}</label>;
  if (error) return <p className="form-error">{error}</p>;
  if (!form) return <p>Chargement…</p>;
  return <><h1>{title}</h1><p className="quiet-note">Sections éditoriales structurées. Les liens doivent mener à des pages du site.</p><form className="admin-panel admin-editor" onSubmit={save}>
    {kind === 'homepage' && <><h2>Hero</h2>{field('hero_eyebrow', 'Accroche')}{field('hero_title', 'Titre (une ligne par retour)', 3)}{field('hero_intro', 'Introduction', 2)}<div className="form-grid">{field('hero_cta_label', 'Texte du bouton')}{field('hero_cta_path', 'Destination')}</div><h2>Entrer dans la Gallery</h2>{field('entry_title', 'Titre de la section')}{form.entry_cards.map((card, index) => <div className="admin-step-editor" key={index}><strong>Entrée {index + 1}</strong>{[['title', 'Titre'], ['description', 'Description'], ['action', 'Action'], ['path', 'Destination']].map(([key, label]) => <label key={key}>{label}<input value={card[key]} onChange={(event) => setForm({ ...form, entry_cards: form.entry_cards.map((item, i) => i === index ? { ...item, [key]: event.target.value } : item) })} /></label>)}</div>)}
      <h2>Sélections</h2><p className="quiet-note">La section Promotions affiche automatiquement les produits avec un prix barré supérieur au prix de vente.</p><label>Marques à afficher<select multiple size={6} value={form.featured_brand_slugs} onChange={(event) => setForm({ ...form, featured_brand_slugs: [...event.target.selectedOptions].map((option) => option.value) })}>{brands?.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label><label>Routines mises en avant<select multiple size={4} value={form.featured_routine_slugs} onChange={(event) => setForm({ ...form, featured_routine_slugs: [...event.target.selectedOptions].map((option) => option.value) })}>{routines?.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label><h2>Messages de confiance</h2>{form.trust_messages.map((message, index) => <label key={index}>Message de confiance {index + 1}<input value={message} onChange={(event) => setForm({ ...form, trust_messages: form.trust_messages.map((item, i) => i === index ? event.target.value : item) })} /></label>)}</>}
    {kind === 'faq' && <><h2>Questions fréquentes</h2>{form.items.map((item, index) => <div className="admin-step-editor" key={index}><label>Question<input value={item.question} onChange={(event) => setForm({ ...form, items: form.items.map((entry, i) => i === index ? { ...entry, question: event.target.value } : entry) })} /></label><label>Réponse<textarea rows={3} value={item.answer} onChange={(event) => setForm({ ...form, items: form.items.map((entry, i) => i === index ? { ...entry, answer: event.target.value } : entry) })} /></label><button type="button" onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })}>Retirer</button></div>)}<button type="button" className="button-outline" onClick={() => setForm({ ...form, items: [...form.items, { question: '', answer: '' }] })}>Ajouter une question</button></>}
    {kind === 'menus' && <label>Marque à découvrir dans le menu<select value={form.featured_brand_slug} onChange={(event) => setForm({ ...form, featured_brand_slug: event.target.value })}><option value="">Aucune</option>{brands?.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>}
    {kind === 'footer' && <>{field('introduction', 'Introduction')}{field('closing_line', 'Ligne de bas de page')}</>}
    <button className="button-primary">Enregistrer</button>{message && <p role="status">{message}</p>}</form>{kind === 'homepage' && <section className="admin-v2-home-preview" aria-label="Aperçu du contenu d’accueil"><span className="admin-v2-eyebrow">APERÇU TEXTE · NON PUBLIÉ</span><h2>{form.hero_title || 'Titre de la page d’accueil'}</h2><p className="admin-v2-home-preview-eyebrow">{form.hero_eyebrow}</p><p>{form.hero_intro}</p><button type="button" className="admin-v2-primary" disabled>{form.hero_cta_label || 'Bouton principal'} <small>{form.hero_cta_path}</small></button><div className="admin-v2-home-preview-cards">{(form.entry_cards || []).map((card, index) => <article key={index}><span>0{index + 1}</span><h3>{card.title}</h3><p>{card.description}</p><small>{card.action} · {card.path}</small></article>)}</div></section>}</>;
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

function AdminContent({ user, ready }) {
  const location = useLocation();
  const { pathname } = location;
  const segments = pathname.split('/').filter(Boolean);
  if (!ready) return <main className="inner-page">Chargement…</main>;
  if (!user || user.role !== 'admin') return <main className="inner-page"><div className="state-panel"><ShieldCheck size={31} /><h1>Accès administrateur</h1><p>Connectez-vous avec un compte administrateur.</p><Link className="button-primary" to={`/connexion?next=${encodeURIComponent(pathname)}`}>Se connecter</Link></div></main>;
  const section = segments[1] || '';
  let page = <Dashboard />;
  if (section === 'catalogue') {
    const area = segments[2];
    if (area === 'produits') page = segments[3] === 'nouveau' ? <AdminCreateProduct /> : segments[3] ? <ProductEditor key={location.pathname} id={segments[3]} /> : <ProductsPage />;
    else if (area === 'marques') page = <TaxonomyPage kind="brands" title="Marques" />;
    else if (area === 'types-de-soin') page = <TaxonomyPage kind="product-types" title="Types de soin" />;
    else if (area === 'sous-types-de-soin') page = <TaxonomyPage kind="product-subtypes" title="Sous-types de soin" />;
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
  else if (section === 'commandes') page = segments[2] ? <OrderDetail id={segments[2]} /> : <OrdersPage />;
  else if (section === 'produits') page = segments[2] ? <ProductEditor key={location.pathname} id={segments[2]} /> : <ProductsPage />;
  else if (section === 'stock') page = <ProductsPage stockOnly />;
  else if (section === 'livraison') page = <Shipping />;
  else if (section === 'promotions') page = <Promotions />;
  else if (section === 'parametres') page = <Settings />;
  else if (section === 'clients') page = segments[2] ? <CustomerDetail id={segments[2]} /> : <ListPage title="Clients" endpoint="/admin/customers" columns={[["Nom", "name"], ["E-mail", "email"], ["Téléphone", "phone"], ["Commandes", "orders"]]} rowLink="/admin/clients/" />;
  else if (section === 'alertes-stock') page = <ListPage title="Alertes stock" endpoint="/admin/stock-alerts" columns={[["Produit", "product_id"], ["E-mail", "email"], ["Date", "created_at"]]} />;
  else if (section === 'notifications') page = <ListPage title="Notifications" endpoint="/admin/notification-outbox" columns={[["Commande", "order_id"], ["Tentatives", "attempts"], ["Dernier envoi", "sent_at"], ["Dernière erreur", "last_error"]]} />;
  else if (section === 'marques') page = <ListPage title="Marques" endpoint="/brands" columns={[["Nom", "name"], ["Produits", "count"]]} />;
  else if (section === 'categories') page = <ListPage title="Catégories" endpoint="/categories" columns={[["Nom", "name"], ["Produits", "count"]]} />;
  else if (section === 'avis') page = <><h1>Avis</h1><div className="state-panel"><h2>Avis publics désactivés</h2><p>La publication nécessite une commande livrée et une modération.</p></div></>;
  else if (section) page = <><h1>{section.replaceAll('-', ' ')}</h1><div className="state-panel"><h2>Données vérifiées requises</h2><p>Les attributs de soin seront ajoutés après vérification des sources officielles.</p><Link className="button-primary" to="/admin/produits">Gérer les produits</Link></div></>;
  return <AdminShell user={user}>{page}</AdminShell>;
}

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

function AdminEntry() {
  const { pathname } = useLocation();
  const [user, setUser] = useState(undefined);
  useEffect(() => { document.title = 'Administration | The K-Skin Gallery'; }, []);
  useEffect(() => {
    let live = true;
    api('/auth/me').then((value) => { if (live) setUser(value); })
      .catch(() => { if (live) setUser(null); });
    return () => { live = false; };
  }, []);
  if (user === undefined) return <main className="admin-v2-access-loading" role="status" aria-live="polite">
    <div className="admin-v2-loading-card">
      <span className="admin-v2-loading-mark" aria-hidden="true">G</span>
      <span className="admin-v2-eyebrow">THE K-SKIN GALLERY · ADMINISTRATION</span>
      <strong>Préparation de votre espace</strong>
      <span>Vérification sécurisée de l’accès…</span>
      <i className="admin-v2-loading-spinner" aria-hidden="true" />
    </div>
  </main>;
  if (!user || user.role !== 'admin') return <main className="admin-v2-access"><div className="admin-v2-access-card"><ShieldCheck size={32} /><span className="admin-v2-eyebrow">ESPACE SÉCURISÉ</span><h1>Accès administrateur</h1><p>Connectez-vous avec un compte administrateur pour ouvrir cette page.</p><Link className="admin-v2-primary" to={`/connexion?next=${encodeURIComponent(pathname)}`}>Se connecter</Link></div></main>;
  return <AdminContent user={user} ready />;
}

export default function Admin() {
  return <QueryClientProvider client={queryClient}><AdminEntry /></QueryClientProvider>;
}
