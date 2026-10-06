import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from '@phosphor-icons/react';
import { api } from '../lib/api';

const slugify = (value) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function AdminCreateProduct() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', sku: '', slug: '', brand_slug: '', category_slug: '', size: '', price_dh: '0', stock: '0' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const brands = useQuery({ queryKey: ['admin', 'taxonomy', 'brands'], queryFn: () => api('/admin/taxonomy/brands') });
  const types = useQuery({ queryKey: ['admin', 'taxonomy', 'product-types'], queryFn: () => api('/admin/taxonomy/product-types') });
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value,
    ...(key === 'name' && !current.slug ? { slug: slugify(value) } : {}) }));
  async function submit(event) {
    event.preventDefault();
    setBusy(true); setMessage('');
    try {
      const created = await api('/admin/products', { method: 'POST', body: { ...form, price_dh: Number(form.price_dh || 0), stock: Number(form.stock || 0) } });
      navigate(`/admin/catalogue/produits/${created.id}`, { replace: true });
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <section className="admin-v2-page admin-v2-editor-page">
    <Link className="admin-v2-back" to="/admin/catalogue/produits"><ArrowLeft size={16} /> Retour au catalogue</Link>
    <div className="admin-v2-page-heading"><div><span className="admin-v2-eyebrow">NOUVELLE FICHE</span><h1>Créer un produit</h1><p>La fiche commence en brouillon. Elle ne sera pas publiée par cette étape.</p></div></div>
    <form className="admin-v2-editor-form" onSubmit={submit}>
      <section className="admin-v2-form-section"><div><h2>Identité du produit</h2><p>Utilisez le nom du fabricant et un SKU unique, puis complétez la fiche.</p></div>
        <div className="admin-v2-form-grid">
          <label>Nom du produit<input required minLength={2} maxLength={300} value={form.name} onChange={(event) => update('name', event.target.value)} /></label>
          <label>SKU<input required maxLength={80} value={form.sku} onChange={(event) => update('sku', event.target.value)} /></label>
          <label>Adresse produit<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(event) => update('slug', event.target.value)} /><small>Minuscules, chiffres et tirets.</small></label>
          <label>Format affiché<input value={form.size} onChange={(event) => update('size', event.target.value)} placeholder="Ex. 100 ml" /></label>
          <label>Marque<select required value={form.brand_slug} onChange={(event) => update('brand_slug', event.target.value)}><option value="">Choisir une marque…</option>{brands.data?.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
          <label>Type de soin<select required value={form.category_slug} onChange={(event) => update('category_slug', event.target.value)}><option value="">Choisir un type…</option>{types.data?.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
        </div>
      </section>
      <section className="admin-v2-form-section"><div><h2>Premières données commerciales</h2><p>Un prix à zéro garde la fiche en brouillon. La publication exige un prix positif et une fiche prête.</p></div>
        <div className="admin-v2-form-grid admin-v2-form-grid--small"><label>Prix public (DH)<input type="number" min="0" step="1" value={form.price_dh} onChange={(event) => update('price_dh', event.target.value)} /></label><label>Stock disponible<input type="number" min="0" step="1" value={form.stock} onChange={(event) => update('stock', event.target.value)} /></label></div>
      </section>
      <div className="admin-v2-sticky-save"><div><strong>Brouillon</strong><span>Complétez les informations avant publication.</span></div><button className="admin-v2-primary" disabled={busy}>{busy ? 'Création…' : 'Créer le brouillon'}</button></div>
      {message && <p className="admin-v2-form-message" role="alert">{message}</p>}
    </form>
  </section>;
}
