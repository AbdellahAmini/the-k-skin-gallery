import { useEffect, useState } from 'react';
import { ArrowRight, Bag, Check } from '@phosphor-icons/react';
import { Link, useParams } from 'react-router';
import ProductCard from '../components/ProductCard';
import { api } from '../lib/api';
import { useStore } from '../state/StoreContext';

function Breadcrumb({ parent, parentPath, name }) {
  return <nav className="breadcrumbs" aria-label="Fil d’Ariane"><Link to="/">Accueil</Link> / <Link to={parentPath}>{parent}</Link> / {name}</nav>;
}

export function RoutinePage() {
  const { slug } = useParams();
  const { routines, addToCart, flash } = useStore();
  const [routine, setRoutine] = useState(routines.find((item) => item.slug === slug) || null);
  const [selected, setSelected] = useState({});
  useEffect(() => {
    setRoutine(routines.find((item) => item.slug === slug) || null);
    setSelected({});
    if (!routines.some((item) => item.slug === slug)) api(`/routines/${slug}`).then(setRoutine).catch(() => setRoutine(null));
  }, [slug, routines]);
  if (!routine) return <main className="inner-page"><div className="state-panel"><h1>Routine introuvable</h1><Link to="/routines" className="button-primary">Voir les routines</Link></div></main>;
  const chosen = routine.steps.map((step) => step.products.find((item) => item.id === selected[step.id])).filter(Boolean);
  function addSelection() {
    if (!chosen.length) return;
    for (const product of chosen) addToCart(product);
    flash(`${chosen.length} soin${chosen.length > 1 ? 's' : ''} ajouté${chosen.length > 1 ? 's' : ''} au panier`);
  }
  return <main className="inner-page guided-page"><Breadcrumb parent="Routines" parentPath="/routines" name={routine.name} />
    <div className="page-heading"><p className="eyebrow">Routines & Packs</p><h1>{routine.name}</h1><p>{routine.description}</p></div>
    <div className="routine-steps" data-step-count={routine.steps.length} style={{ '--routine-columns': Math.min(routine.steps.length, 4) }}>{routine.steps.map((step) => <section className="guided-step" key={step.id}>
      <div className="guided-step-head"><span>{String(step.position).padStart(2, '0')}</span><div><h2>{step.name}</h2><p>{step.description}</p><Link className="text-link" to={`/soins/${step.category_slug}`}>Voir tous les produits de cette étape <ArrowRight size={15} /></Link></div></div>
      {step.products.length ? <div className="guided-products">{step.products.map((product) => <div key={product.id}><button type="button" className={`routine-select ${selected[step.id] === product.id ? 'selected' : ''}`} onClick={() => setSelected((current) => ({ ...current, [step.id]: current[step.id] === product.id ? null : product.id }))} aria-pressed={selected[step.id] === product.id}><Check size={16} /> {selected[step.id] === product.id ? 'Sélectionné' : 'Choisir ce soin'}</button><ProductCard product={product} /></div>)}</div>
        : <p className="quiet-note">La sélection de cette étape est en cours de préparation.</p>}
    </section>)}</div>
    <div className="routine-selection-bar"><span>{chosen.length} soin{chosen.length > 1 ? 's' : ''} choisi{chosen.length > 1 ? 's' : ''}</span><button type="button" className="button-primary" disabled={!chosen.length} onClick={addSelection}><Bag size={17} /> Ajouter ma sélection au panier</button></div>
  </main>;
}
