import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, MagnifyingGlass, SlidersHorizontal, X } from '@phosphor-icons/react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { api, slugLabel } from '../lib/api';
import ProductCard from '../components/ProductCard';
import { useStore } from '../state/StoreContext';

const filterFields = [
  ['category', 'Type de soin', 'type'], ['brand', 'Marque', 'brand'],
  ['skin_type', 'Type de peau', 'skin'], ['concern', 'Besoin', 'need'],
  ['ingredient', 'Ingrédient clé', 'ingredient'],
  ['usage', 'Utilisation', 'usage'], ['availability', 'Disponibilité', 'availability'],
];
const labels = {
  relevance: 'Pertinence', newest: 'Nouveautés',
  price_asc: 'Prix croissant', price_desc: 'Prix décroissant', best_sellers: 'Meilleures ventes'
};

function Crumbs({ nodes }) {
  return <nav className="breadcrumbs" aria-label="Fil d’Ariane"><Link to="/">Accueil</Link>
    {nodes.map(([label, path]) => <span key={label}> / {path ? <Link to={path}>{label}</Link> : label}</span>)}
  </nav>;
}

export function DirectoryPage({ kind }) {
  const { brands, categories, skinTypes, concerns, routines, bundles } = useStore();

  const careCategoryMap = [
    ['Nettoyer', ['huiles-baumes', 'nettoyants', 'exfoliants']],
    ['Préparer & Traiter', ['toners-essences', 'serums-ampoules', 'masques', 'contour-des-yeux']],
    ['Hydrater & Protéger', ['cremes', 'protection-solaire']],
  ];

  const careGroups = careCategoryMap.map(([heading, slugs]) => [
    heading,
    slugs.map((slug) => {
      const cat = categories.find((c) => c.slug === slug);
      if (cat) return { ...cat, path: `/soins/${cat.slug}` };
      const fallbackNames = {
        'huiles-baumes': 'Huiles & Baumes',
        'nettoyants': 'Nettoyants',
        'exfoliants': 'Exfoliants',
        'toners-essences': 'Toners & Essences',
        'serums-ampoules': 'Sérums & Ampoules',
        'masques': 'Masques',
        'contour-des-yeux': 'Contour des yeux',
        'cremes': 'Crèmes',
        'protection-solaire': 'Protection solaire'
      };
      return { name: fallbackNames[slug] || slug, slug, path: `/soins/${slug}`, count: 0 };
    })
  ]);

  const groups = kind === 'marques' ? [['Nos marques', brands.map((item) => ({ ...item, path: `/marques/${item.slug}` }))]]
    : kind === 'soins' ? careGroups
      : kind === 'routines' ? [['Routines', routines.map((item) => ({ ...item, path: `/routines/${item.slug}` }))],
      ['Packs', bundles.map((item) => ({ ...item, path: `/packs/${item.slug}` }))]]
        : kind === 'packs' ? [['Nos packs', bundles.map((item) => ({ ...item, path: `/packs/${item.slug}` }))]]
          : kind === 'besoins' ? [['Besoins', concerns.map((item) => ({ ...item, path: `/besoins/${item.slug}` }))]]
            : kind === 'type-de-peau' ? [['Type de peau', skinTypes.map((item) => ({ ...item, path: `/type-de-peau/${item.slug}` }))]]
              : [['Type de peau', skinTypes.map((item) => ({ ...item, path: `/type-de-peau/${item.slug}` }))],
              ['Besoins', concerns.map((item) => ({ ...item, path: `/besoins/${item.slug}` }))]];

  const title = {
    marques: 'Nos marques', soins: 'Les soins', peau: 'Votre peau, votre point de départ',
    'type-de-peau': 'Choisir selon votre type de peau', besoins: 'Choisir selon vos besoins',
    routines: 'Routines & Packs', packs: 'Nos packs'
  }[kind];
  const intro = kind === 'peau' || kind === 'type-de-peau' || kind === 'besoins'
    ? 'Choisissez votre type de peau ou ce que vous souhaitez cibler.'
    : kind === 'routines' ? 'Des gestes simples et des sélections prêtes à découvrir.'
      : kind === 'soins' ? 'Nettoyer, préparer, traiter, hydrater et protéger : commencez par le type de soin souhaité.'
        : 'Explorez notre sélection à votre rythme.';

  return <main className="inner-page"><Crumbs nodes={[[title]]} /><div className="page-heading"><p className="eyebrow">La Gallery</p><h1>{title}</h1><p>{intro}</p></div>
    {groups.map(([heading, entries]) => <section className="directory-section" key={heading}><h2>{heading}</h2>
      {entries.length ? <div className="directory-grid">{entries.map((item) => <Link key={item.path} to={item.path} className="directory-card"><span>{item.name}</span>{typeof item.count === 'number' && item.count > 0 && <small>{item.count} produit{item.count > 1 ? 's' : ''} sélectionné{item.count > 1 ? 's' : ''}</small>}<ArrowRight size={18} /></Link>)}</div>
        : <p className="quiet-note">Une sélection arrive bientôt.</p>}</section>)}
    {kind === 'soins' && <div className="directory-all-cta" style={{ marginTop: '36px', textAlign: 'center' }}>
      <Link to="/boutique" className="button-primary">Voir tous les produits <ArrowRight size={16} /></Link>
    </div>}
  </main>;
}

function initialRows(products, mode, slug, query) {
  const term = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return products.filter((p) => {
    if (mode === 'brand' && p.brand_slug !== slug) return false;
    if (mode === 'category' && p.category_slug !== slug) return false;
    if (mode === 'skin' && !p.skin_types?.some((s) => s.slug === slug)) return false;
    if (mode === 'concern' && !p.concerns?.some((s) => s.slug === slug)) return false;
    if (mode === 'new' && (!p.new_arrival || p.compare_at_dh > p.price_dh)) return false;
    if (mode === 'promo' && !(p.compare_at_dh > p.price_dh)) return false;
    if (mode === 'featured' && !p.featured) return false;
    if (mode === 'search' && term && !`${p.name} ${p.brand} ${p.category}`
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(term)) return false;
    return true;
  });
}

function collectionContext(mode, slug, brands, categories, skinTypes, concerns, query) {
  const brand = brands.find((b) => b.slug === slug);
  const category = categories.find((c) => c.slug === slug);
  const skin = skinTypes.find((s) => s.slug === slug);
  const concern = concerns.find((c) => c.slug === slug);
  if (mode === 'brand') return { title: brand?.name || slugLabel(slug), parent: ['Marques', '/marques'], description: `Découvrez les soins ${brand?.name || slugLabel(slug)} de la Gallery.` };
  if (mode === 'category') return { title: category?.name || slugLabel(slug), parent: ['Soins', '/soins'], description: 'Explorez les produits de cette catégorie.' };
  if (mode === 'skin') return { title: skin?.name || slugLabel(slug), parent: ['Type de peau', '/type-de-peau'], description: 'Une sélection attribuée après vérification des informations produit.' };
  if (mode === 'concern') return { title: concern?.name || slugLabel(slug), parent: ['Besoins', '/besoins'], description: 'Des soins sélectionnés pour ce besoin, sans promesse médicale.' };
  if (mode === 'new') return { title: 'Nouveautés dans la Gallery', description: 'Les arrivées récentes de notre sélection.' };
  if (mode === 'promo') return { title: 'Promotions', description: 'Les offres actuellement disponibles dans la Gallery.' };
  if (mode === 'featured') return { title: 'Nos incontournables', description: 'Les choix de la Gallery.' };
  if (mode === 'search') return { title: query ? `Résultats pour « ${query} »` : 'Recherche', description: query ? '' : 'Saisissez un produit, une marque ou un type de soin.' };
  if (mode === 'care') return { title: 'Tous les soins', description: 'Nettoyer, traiter, hydrater et protéger : commencez par le type de soin souhaité.' };
  return { title: 'Toute la boutique', description: 'Découvrez les soins coréens sélectionnés par la Gallery.' };
}

export function CollectionPage({ mode = 'all' }) {
  const { slug } = useParams();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const { products, brands, categories, skinTypes, concerns, ready, mergeProducts, initialCollectionResult, initialCollectionPath } = useStore();
  const [result, setResult] = useState(() => {
    if (initialCollectionPath === location.pathname && initialCollectionResult) return initialCollectionResult;
    const rows = initialRows(products, mode, slug, query);
    return { products: rows.slice(0, 24), total: rows.length, page: 1, pages: Math.max(1, Math.ceil(rows.length / 24)), available_facets: {}, available_sorts: ['relevance', 'newest', 'price_asc', 'price_desc'] };
  });
  const [loading, setLoading] = useState(!ready);
  const [error, setError] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [draftParams, setDraftParams] = useState(() => new URLSearchParams(params));
  const [searchValue, setSearchValue] = useState(query);
  const [priceMin, setPriceMin] = useState(params.get('min') || '');
  const [priceMax, setPriceMax] = useState(params.get('max') || '');
  const filterPanelRef = useRef(null);
  const filterToggleRef = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const sync = () => setMobileFilters(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    if (!mobileFilters || !filterOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const panel = filterPanelRef.current;
    panel?.querySelector('.filter-head button')?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); setFilterOpen(false); return; }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = [...panel.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), summary, a[href]')]
        .filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      filterToggleRef.current?.focus();
    };
  }, [mobileFilters, filterOpen]);
  useEffect(() => setFilterOpen(false), [mode, slug]);
  useEffect(() => setSearchValue(query), [query]);
  useEffect(() => { setPriceMin(params.get('min') || ''); setPriceMax(params.get('max') || ''); }, [params]);
  const context = collectionContext(mode, slug, brands, categories, skinTypes, concerns, query);
  const contextField = { brand: 'brand', category: 'category', skin: 'skin_type', concern: 'concern' }[mode];
  const facets = result.available_facets || {};
  const page = Math.max(1, Number(params.get('page') || 1));
  const sort = params.get('sort') || (mode === 'new' ? 'newest' : 'relevance');

  function update(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  }
  function updateFilter(key, value) {
    if (!mobileFilters || !filterOpen) { update(key, value); return; }
    setDraftParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(key, value); else next.delete(key);
      next.delete('page');
      return next;
    });
  }
  function openFilters() {
    setDraftParams(new URLSearchParams(params));
    setPriceMin(params.get('min') || '');
    setPriceMax(params.get('max') || '');
    setFilterOpen(true);
  }
  function applyFilters() {
    if (mobileFilters) {
      const next = new URLSearchParams(draftParams);
      if (priceMin) next.set('min', priceMin); else next.delete('min');
      if (priceMax) next.set('max', priceMax); else next.delete('max');
      next.delete('page');
      setParams(next);
    }
    setFilterOpen(false);
  }
  function clear() {
    const next = new URLSearchParams();
    if (query && mode === 'search') next.set('q', query);
    setParams(next);
    setPriceMin(''); setPriceMax('');
  }
  function clearFilterPanel() {
    if (!mobileFilters || !filterOpen) { clear(); return; }
    const next = new URLSearchParams();
    if (query && mode === 'search') next.set('q', query);
    setDraftParams(next);
    setPriceMin(''); setPriceMax('');
  }
  useEffect(() => {
    let alive = true;
    const next = new URLSearchParams();
    if (mode === 'search' && query) next.set('q', query);
    if (mode === 'brand') next.set('brand', slug);
    if (mode === 'category') next.set('category', slug);
    if (mode === 'skin') next.set('skin_type', slug);
    if (mode === 'concern') next.set('concern', slug);
    if (mode === 'new') { next.set('new', 'true'); next.set('exclude_promotion', 'true'); }
    if (mode === 'promo') next.set('promotion', 'true');
    if (mode === 'featured') next.set('featured', 'true');
    if (mode === 'all' && params.get('promotion') === 'true') next.set('promotion', 'true');
    for (const [field, , key] of filterFields) {
      const value = params.get(key);
      if (value && field !== contextField) next.set(field, value);
    }
    if (params.get('min')) next.set('min_price', params.get('min'));
    if (params.get('max')) next.set('max_price', params.get('max'));
    next.set('sort', sort);
    next.set('page', String(page));
    setLoading(true);
    api(`/products?${next}`).then((data) => { if (alive) { setResult(data); mergeProducts(data.products); setError(''); setLoading(false); } })
      .catch((cause) => { if (alive) { setError(cause.message); setLoading(false); } });
    return () => { alive = false; };
  }, [mode, slug, params.toString()]);

  const promotionActive = params.get('promotion') === 'true';
  const filterParams = mobileFilters && filterOpen ? draftParams : params;
  const filterPromotionActive = filterParams.get('promotion') === 'true';
  const filters = <div className="filters"><div className="filter-head"><h2>Filtres</h2><button type="button" onClick={() => setFilterOpen(false)} aria-label="Fermer les filtres"><X size={20} /></button></div>
    {mode === 'all' && <button type="button" className={`promotion-filter-card${filterPromotionActive ? ' is-active' : ''}`} aria-pressed={filterPromotionActive} onClick={() => updateFilter('promotion', filterPromotionActive ? '' : 'true')}>
      <img src="/assets/icons/promo-tag.png" alt="" aria-hidden="true" />
      <span className="promotion-filter-copy"><strong>Promotions uniquement</strong><small>Afficher les offres en cours</small></span>
      <span className="promotion-filter-state">{filterPromotionActive ? 'Actif' : 'Voir'}</span>
    </button>}
    {filterFields.filter(([field, , key]) => field !== contextField && (facets[field]?.length || filterParams.has(key)))
      .filter(([field]) => field !== 'category' || (facets.category?.length || 0) > 1)
      .map(([field, label, key]) => <details className="filter-section" key={field} open><summary>{label}</summary>
        <div className="facet-options">{facets[field]?.map((option) => <button type="button" key={option.slug} className={filterParams.get(key) === option.slug ? 'selected' : ''} onClick={() => updateFilter(key, filterParams.get(key) === option.slug ? '' : option.slug)}><span>{option.name}</span><small>{option.count}</small></button>)}</div>
      </details>)}
    <details className="filter-section" open><summary>Prix</summary><form className="price-filter" onSubmit={(event) => { event.preventDefault(); if (mobileFilters && filterOpen) return; const next = new URLSearchParams(params); if (priceMin) next.set('min', priceMin); else next.delete('min'); if (priceMax) next.set('max', priceMax); else next.delete('max'); next.delete('page'); setParams(next); }}><label>Min. DH<input type="number" min="0" value={priceMin} onChange={(event) => setPriceMin(event.target.value)} /></label><label>Max. DH<input type="number" min="0" value={priceMax} onChange={(event) => setPriceMax(event.target.value)} /></label><button type="submit">Appliquer</button></form></details>
    <button className="text-link filter-clear" type="button" onClick={clearFilterPanel}>Tout effacer</button>
    <button className="button-primary filter-apply" type="button" onClick={applyFilters}>Afficher les résultats</button>
  </div>;

  const selected = filterFields.filter(([field]) => field !== contextField).map(([field, , key]) => {
    const value = params.get(key);
    return value ? { key, value, label: facets[field]?.find((f) => f.slug === value)?.name || slugLabel(value) } : null;
  }).filter(Boolean);
  if (mode === 'all' && promotionActive) selected.push({ key: 'promotion', label: 'Promotions' });
  if (params.get('min') || params.get('max')) selected.push({ key: 'price', label: `${params.get('min') || '0'}–${params.get('max') || '∞'} DH` });
  const quick = facets.category?.filter((option) => option.count > 0) || [];
  const showQuick = mode !== 'category' && quick.length > 1;
  const paramUrl = (targetPage) => { const next = new URLSearchParams(params); next.set('page', String(targetPage)); return `?${next}`; };

  return <main className="inner-page collection-page"><Crumbs nodes={context.parent ? [context.parent, [context.title]] : [[context.title]]} />
    <div className="page-heading"><p className="eyebrow">The K-Skin Gallery</p>{mode === 'promo' ? <h1 className="promotion-page-title"><img src="/assets/icons/promo-tag.png" alt="" aria-hidden="true" />{context.title}</h1> : <h1>{context.title}</h1>}{context.description && <p>{context.description}</p>}</div>
    {mode === 'search' && <form className="search-page-form" onSubmit={(event) => { event.preventDefault(); navigate(`/recherche?q=${encodeURIComponent(searchValue.trim())}`); }}><input aria-label="Votre recherche" value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Rechercher un produit ou une marque" /><button className="button-primary"><MagnifyingGlass size={17} /> Rechercher</button></form>}
    {showQuick && <nav className="quick-pills" aria-label="Types de soin disponibles"><button className={!params.get('type') ? 'active' : ''} onClick={() => update('type', '')}>Tous</button>{quick.map((item) => <button key={item.slug} className={params.get('type') === item.slug ? 'active' : ''} onClick={() => update('type', item.slug)}>{item.name}</button>)}</nav>}
    <div className="collection-toolbar">
      <div className="collection-toolbar-summary">
        <span className="collection-result-count">{loading ? 'Chargement…' : `${result.total} produit${result.total > 1 ? 's' : ''}`}</span>
        {selected.length > 0 && <div className="selected-filters" aria-label="Filtres sélectionnés">{selected.map((item) => <button key={item.key} title={`Retirer le filtre ${item.label}`} onClick={() => { if (item.key === 'price') { const next = new URLSearchParams(params); next.delete('min'); next.delete('max'); next.delete('page'); setParams(next); } else update(item.key, ''); }}>{item.label} <X size={13} /></button>)}<button className="clear-all" onClick={clear}>Tout effacer</button></div>}
      </div>
      <div className="collection-toolbar-controls"><button ref={filterToggleRef} className="filter-toggle" onClick={openFilters}><SlidersHorizontal size={17} /> Filtrer</button><label>Trier <select value={sort} onChange={(event) => update('sort', event.target.value)}>{(result.available_sorts || Object.keys(labels)).map((value) => <option value={value} key={value}>{labels[value]}</option>)}</select></label></div>
    </div>
    <div className="collection-layout"><aside ref={filterPanelRef} className={`filter-panel ${filterOpen ? 'open' : ''}`} role={mobileFilters && filterOpen ? 'dialog' : undefined} aria-modal={mobileFilters && filterOpen ? 'true' : undefined} aria-label={mobileFilters && filterOpen ? 'Filtres des produits' : undefined}>{filters}</aside><div className="collection-results">
      {error && <div className="state-panel" role="alert"><h2>Chargement impossible</h2><p>{error}</p><button onClick={() => window.location.reload()} className="button-primary">Réessayer</button></div>}
      {!error && loading && <div className="skeleton-grid">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton-card" />)}</div>}
      {!error && !loading && result.products.length > 0 && <div className="product-grid collection-grid">{result.products.map((item) => <ProductCard key={item.id} product={item} />)}</div>}
      {!error && !loading && result.products.length === 0 && <div className="state-panel"><MagnifyingGlass size={28} /><h2>{mode === 'promo' ? 'Aucune promotion en cours' : mode === 'search' ? `Aucun résultat pour « ${query} »` : 'Aucun produit dans cette sélection'}</h2><p>{mode === 'skin' || mode === 'concern' ? 'Les correspondances sont ajoutées après vérification des informations officielles.' : 'Essayez d’autres filtres ou explorez la boutique.'}</p><Link className="button-primary" to="/boutique">Parcourir les produits <ArrowRight size={16} /></Link></div>}
      {!error && result.pages > 1 && <nav className="pagination" aria-label="Pages de résultats">{page > 1 && <Link to={paramUrl(page - 1)}>Précédent</Link>}<span>Page {page} sur {result.pages}</span>{page < result.pages && <Link to={paramUrl(page + 1)}>Suivant</Link>}</nav>}
    </div></div>
  </main>;
}

export function FavoritesPage() {
  const { products, wishlist } = useStore();
  const saved = useMemo(() => products.filter((item) => wishlist.includes(item.id)), [products, wishlist]);
  return <main className="inner-page"><Crumbs nodes={[["Mes favoris"]]} /><div className="page-heading"><p className="eyebrow">Votre sélection</p><h1>Mes favoris</h1><p>Retrouvez les soins que vous aimez.</p></div>
    {saved.length ? <div className="product-grid collection-grid">{saved.map((item) => <ProductCard key={item.id} product={item} />)}</div>
      : <div className="state-panel"><h2>Aucun favori pour le moment</h2><p>Ajoutez des produits avec le cœur pour les retrouver ici.</p><Link to="/boutique" className="button-primary">Explorer la boutique</Link></div>}
  </main>;
}
