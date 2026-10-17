import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowCounterClockwise, ArrowLeft, ArrowRight, Bag, CaretDown, MagnifyingGlass, Package, SlidersHorizontal, X } from '@phosphor-icons/react';
import { Link, useParams, useSearchParams } from 'react-router';
import PackImage from '../components/PackImage';
import Button from '../components/ui/Button';
import { api, money } from '../lib/api';
import { useStore } from '../state/StoreContext';

const labels = {
  fr: {
    home: 'Accueil', packs: 'Packs', collection: 'Les packs de la Gallery', intro: 'Des soins réunis pour une routine simple. Choisissez selon votre peau et découvrez chaque étape avant de commencer.',
    available: 'Disponible', out: 'Rupture de stock', discover: 'Découvrir ce pack', included: 'soins inclus', photo: 'Photo du pack à venir',
    filterTitle: 'Filtres', clearAll: 'Tout effacer', categoryFilter: 'Type de soin', brandFilter: 'Marque', skinFilter: 'Type de peau', availabilityFilter: 'Disponibilité', inStock: 'En stock', outOfStock: 'Rupture de stock', priceFilter: 'Prix', minimum: 'Min. DH', maximum: 'Max. DH', apply: 'Appliquer', filterButton: 'Filtrer', sortTitle: 'Trier', noMatches: 'Aucun pack dans cette sélection', noMatchesHint: 'Modifiez un filtre ou effacez votre recherche pour retrouver les packs.', searchPlaceholder: 'Rechercher un pack, une marque ou un produit…', save: 'Économisez', packPrice: 'le pack', separately: 'au total séparément', allLinked: 'packs liés',
    pack: 'Pack de la Gallery', stockNote: 'La disponibilité dépend de chaque soin du pack.', quantity: 'Quantité', add: 'Ajouter le pack au panier', unavailable: 'Pack actuellement indisponible',
    contents: 'Dans ce pack',
    details: 'À savoir sur ce pack', who: 'Pour qui ?', suitable: 'Types de peau', avoid: 'À savoir avant de commencer', why: 'Pourquoi ces soins ensemble ?', benefits: 'Ce que ce pack apporte',
    expect: 'Résultat à attendre', use: 'Comment utiliser ce pack', morning: 'Le matin', evening: 'Le soir', weekly: 'Dans la semaine', precautions: 'Conseils importants',
    each: 'Voir la fiche produit', back: 'Tous les packs', count: 'packs', loadingPacks: 'Chargement des packs…', notFound: 'Pack introuvable', loading: 'Chargement du pack…', pieces: 'unité',
  },
  ar: {
    home: 'الرئيسية', packs: 'الباكات', collection: 'باكات ديال غاليري', intro: 'جمعنا ليك منتجات كيكملو بعضياتهم مع طريقة استعمال واضحة. اختاري اللي يناسب بشرتك.',
    available: 'متوفر', out: 'غير متوفر دابا', discover: 'شوفي هاد الباك', included: 'منتجات داخلة', photo: 'تصويرة الباك غادي تتزاد قريباً',
    filterTitle: 'الفلاتر', clearAll: 'مسح الكل', categoryFilter: 'نوع العناية', brandFilter: 'الماركة', skinFilter: 'نوع البشرة', availabilityFilter: 'التوفر', inStock: 'متوفر', outOfStock: 'غير متوفر', priceFilter: 'الثمن', minimum: 'أقل ثمن', maximum: 'أعلى ثمن', apply: 'تطبيق', filterButton: 'فلتر', sortTitle: 'ترتيب', noMatches: 'ما لقيناش باك بهاد الاختيارات', noMatchesHint: 'بدلي الفلاتر ولا مسحي البحث باش تشوفي الباكات.', searchPlaceholder: 'قلبي على باك، ماركة ولا منتج…', save: 'كتوفري', packPrice: 'الباك', separately: 'المجموع إلا تشراو بوحدهم', allLinked: 'باكات مرتبطة',
    pack: 'باك من غاليري', stockNote: 'توفر الباك مرتبط بتوفر كل منتج فيه.', quantity: 'العدد', add: 'زيدي الباك للسلة', unavailable: 'هاد الباك غير متوفر دابا',
    contents: 'شنو كاين فهاد الباك',
    details: 'تفاصيل الباك', who: 'لمن مناسب؟', suitable: 'أنواع البشرة', avoid: 'شنو خاصك تعرفي قبل ما تبداي', why: 'علاش جمعنا هاد المنتجات؟', benefits: 'شنو يقدر يعطيك هاد الباك',
    expect: 'شنو تتوقعي', use: 'كيفاش تستعملي هاد الباك', morning: 'فالصباح', evening: 'فالليل', weekly: 'خلال الأسبوع', precautions: 'نصائح مهمة',
    each: 'شوفي المنتج', back: 'كل الباكات', count: 'باك', loadingPacks: 'كنحمّلو الباكات…', notFound: 'ما لقيناش هاد الباك', loading: 'كنحمّلو الباك…', pieces: 'قطعة',
  },
};

function copy(bundle, lang) {
  return bundle.content?.[lang] || bundle.content?.fr || {};
}

function textItems(value) {
  return Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
}

function LanguageToggle({ lang, onChange }) {
  return <div className="pack-language-toggle" role="group" aria-label="Langue du guide / لغة الدليل">
    <Button variant="ghost" size="sm" type="button" aria-pressed={lang === 'fr'} className={lang === 'fr' ? 'is-active' : ''} onClick={() => onChange('fr')}>Français</Button>
    <Button variant="ghost" size="sm" type="button" aria-pressed={lang === 'ar'} className={lang === 'ar' ? 'is-active' : ''} onClick={() => onChange('ar')}>الدارجة</Button>
  </div>;
}

function StockLabel({ bundle, lang }) {
  const t = labels[lang];
  return <span className={`pack-stock ${bundle.stock > 0 ? 'is-available' : 'is-out'}`}><span aria-hidden="true" />{bundle.stock > 0 ? t.available : t.out}</span>;
}

const packFilterFields = [
  ['category', 'categoryFilter', 'type'],
  ['brand', 'brandFilter', 'brand'],
  ['skin_type', 'skinFilter', 'skin'],
  ['availability', 'availabilityFilter', 'availability'],
];

const packSortLabels = {
  relevance: 'Pertinence', price_asc: 'Prix croissant', price_desc: 'Prix décroissant', components_desc: 'Plus de soins',
};
const packSortLabelsAr = {
  relevance: 'الأنسب', price_asc: 'الثمن من الأقل للأكثر', price_desc: 'الثمن من الأكثر للأقل', components_desc: 'عدد أكبر من المنتجات',
};
const categoryNamesAr = {
  'coffrets-autres': 'علب ومجموعات', cremes: 'كريمات', exfoliants: 'مقشرات', 'huiles-baumes': 'زيوت وبلسم',
  masques: 'أقنعة', nettoyants: 'منظفات', 'protection-solaire': 'حماية من الشمس', 'serums-ampoules': 'سيرومات وأمبولات', 'toners-essences': 'تونرات وخلاصات',
};
const skinNamesAr = { normale: 'عادية', mixte: 'مختلطة', grasse: 'دهنية', seche: 'جافة', 'mixte deshydratee': 'مختلطة وجافة', 'tous types selon tolerance': 'جميع أنواع البشرة حسب التحمّل' };

function facetSlug(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/&/g, ' et ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function valuesFor(bundle, field, lang = 'fr') {
  if (field === 'availability') return [{ slug: bundle.stock > 0 ? 'in_stock' : 'out_of_stock', name: bundle.stock > 0 ? labels[lang].inStock : labels[lang].outOfStock }];
  if (field === 'skin_type') return [...new Set(bundle.content?.fr?.skin_types || [])].map((name) => ({ slug: facetSlug(name), name: lang === 'ar' ? (skinNamesAr[facetSlug(name).replace(/-/g, ' ')] || name) : name }));
  const products = (bundle.items || []).map(({ product }) => product).filter(Boolean);
  if (field === 'brand') return [...new Map(products.map((product) => [product.brand_slug || facetSlug(product.brand), { slug: product.brand_slug || facetSlug(product.brand), name: product.brand }])).values()];
  if (field === 'category') return [...new Map(products.map((product) => { const slug = product.category_slug || facetSlug(product.category); return [slug, { slug, name: lang === 'ar' ? (categoryNamesAr[slug] || product.category) : product.category }]; })).values()];
  return [];
}

function chosenValues(params, key) {
  return [...new Set((params.get(key) || '').split(',').map((value) => value.trim()).filter(Boolean))];
}

function matchesPack(bundle, params, omitted = '') {
  const query = (params.get('q') || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  if (query) {
    const haystack = [bundle.name, bundle.description, bundle.content?.fr?.name, bundle.content?.fr?.summary,
      ...(bundle.items || []).flatMap(({ product }) => [product?.name, product?.brand, product?.category])]
      .filter(Boolean).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  for (const [field, , key] of packFilterFields) {
    if (field === omitted) continue;
    const selected = chosenValues(params, key);
    if (selected.length && !valuesFor(bundle, field).some((option) => selected.includes(option.slug))) return false;
  }
  if (omitted !== 'price') {
    const min = Number(params.get('min')) || 0;
    const max = Number(params.get('max')) || Infinity;
    if (bundle.price_dh < min || bundle.price_dh > max) return false;
  }
  return true;
}

function packSavings(bundle) {
  const individualTotal = (bundle.items || []).reduce((sum, { product, quantity }) => sum + (product?.price_dh || 0) * quantity, 0);
  return { individualTotal, amount: individualTotal - bundle.price_dh };
}

export function PackCard({ bundle, compact = false, lang = 'fr' }) {
  const t = labels[lang] || labels.fr;
  const text = bundle.content?.[lang] || bundle.content?.fr || {};
  const { individualTotal, amount } = packSavings(bundle);
  const pieces = (bundle.items || []).reduce((sum, item) => sum + item.quantity, 0);
  return <article className={`pack-tile${compact ? ' pack-tile--preview' : ''}`}>
    <Link to={`/packs/${bundle.slug}`} className="pack-tile-art" aria-label={`Découvrir ${text.name || bundle.name}`}><PackImage src={bundle.image_url} alt={text.name || bundle.name} placeholder="Photo du pack à venir" /></Link>
    <div className="pack-tile-body"><StockLabel bundle={bundle} lang={lang} />
      <h2><Link to={`/packs/${bundle.slug}`}>{text.name || bundle.name}</Link></h2>
      <p>{text.summary || bundle.description}</p>
      <div className="pack-tile-footer"><span>{pieces} {t.included}</span>
        <div className="pack-tile-price"><strong>{money(bundle.price_dh)}</strong>{amount > 0 && <del>{money(individualTotal)}</del>}</div>
      </div>
      {amount > 0 && <span className="pack-tile-saving">{t.save} {money(amount)}</span>}
      <Link className="pack-tile-link" to={`/packs/${bundle.slug}`}>{t.discover} <ArrowRight size={16} /></Link>
    </div>
  </article>;
}

export function PackDirectoryPage() {
  const { bundles, ready } = useStore();
  const [params, setParams] = useSearchParams();
  const [lang, setLang] = useState('fr');
  const [draftParams, setDraftParams] = useState(() => new URLSearchParams(params));
  const [filterOpen, setFilterOpen] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [priceMin, setPriceMin] = useState(params.get('min') || '');
  const [priceMax, setPriceMax] = useState(params.get('max') || '');
  const panelRef = useRef(null);
  const toggleRef = useRef(null);
  const t = labels[lang];
  const rtl = lang === 'ar';
  const sortLabels = rtl ? packSortLabelsAr : packSortLabels;
  const packs = useMemo(() => [...bundles].sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0) || a.name.localeCompare(b.name, 'fr')), [bundles]);
  const priceDraft = new URLSearchParams(draftParams);
  if (priceMin) priceDraft.set('min', priceMin); else priceDraft.delete('min');
  if (priceMax) priceDraft.set('max', priceMax); else priceDraft.delete('max');
  const activeParams = mobileFilters && filterOpen ? priceDraft : params;
  const invalidPrice = priceMin !== '' && priceMax !== '' && Number(priceMax) < Number(priceMin);
  const filtered = useMemo(() => {
    const rows = packs.filter((bundle) => matchesPack(bundle, params));
    const sort = params.get('sort') || 'relevance';
    if (sort === 'price_asc') rows.sort((a, b) => a.price_dh - b.price_dh);
    else if (sort === 'price_desc') rows.sort((a, b) => b.price_dh - a.price_dh);
    else if (sort === 'components_desc') rows.sort((a, b) => b.items.reduce((sum, item) => sum + item.quantity, 0) - a.items.reduce((sum, item) => sum + item.quantity, 0));
    else rows.sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0) || a.name.localeCompare(b.name, 'fr'));
    return rows;
  }, [packs, params.toString()]);
  const activeCount = packFilterFields.reduce((sum, [, , key]) => sum + chosenValues(activeParams, key).length, 0) + Number(activeParams.has('min') || activeParams.has('max'));
  const selectedFilters = packFilterFields.flatMap(([field, , key]) => chosenValues(params, key).map((value) => ({ key, field, value,
    label: packs.flatMap((bundle) => valuesFor(bundle, field, lang)).find((option) => option.slug === value)?.name || value })));
  if (params.has('min') || params.has('max')) selectedFilters.push({ key: 'price', label: `${params.get('min') || '0'}–${params.get('max') || '∞'} DH` });
  if (params.get('q')) selectedFilters.push({ key: 'q', label: `« ${params.get('q')} »` });

  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const sync = () => setMobileFilters(media.matches);
    sync(); media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    setDraftParams(new URLSearchParams(params));
    setPriceMin(params.get('min') || ''); setPriceMax(params.get('max') || '');
  }, [params.toString()]);
  useEffect(() => {
    if (!mobileFilters || !filterOpen) return undefined;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector('.filter-close')?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); setFilterOpen(false); return; }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), summary, a[href]')].filter((node) => node.getClientRects().length);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panelRef.current.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !panelRef.current.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener('keydown', onKeyDown); toggleRef.current?.focus(); };
  }, [mobileFilters, filterOpen]);

  function openFilters() { setDraftParams(new URLSearchParams(params)); setPriceMin(params.get('min') || ''); setPriceMax(params.get('max') || ''); setFilterOpen(true); }
  function changeParams(key, value, replace = false) {
    const next = new URLSearchParams(mobileFilters && filterOpen ? draftParams : params);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    if (mobileFilters && filterOpen) setDraftParams(next); else setParams(next, { replace });
  }
  function toggleFilter(key, value) {
    const source = new URLSearchParams(mobileFilters && filterOpen ? draftParams : params);
    const values = chosenValues(source, key);
    const nextValues = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
    changeParams(key, nextValues.join(','));
  }
  function resetAll() {
    setPriceMin(''); setPriceMax('');
    if (mobileFilters && filterOpen) setDraftParams(new URLSearchParams()); else setParams(new URLSearchParams());
  }
  function resetSection(key) {
    if (key === 'price') { setPriceMin(''); setPriceMax(''); if (!mobileFilters || !filterOpen) { const next = new URLSearchParams(params); next.delete('min'); next.delete('max'); setParams(next); } }
    else changeParams(key, '');
  }
  function removeSelected(item) {
    if (item.key === 'price') { const next = new URLSearchParams(params); next.delete('min'); next.delete('max'); setParams(next); }
    else if (item.key === 'q') changeParams('q', '');
    else toggleFilter(item.key, item.value);
  }
  function applyMobileFilters() {
    if (invalidPrice) return;
    const next = new URLSearchParams(draftParams);
    if (priceMin) next.set('min', priceMin); else next.delete('min');
    if (priceMax) next.set('max', priceMax); else next.delete('max');
    setParams(next); setFilterOpen(false);
  }

  const filters = <div className="filters">
    <div className="filter-head"><div className="filter-head-copy"><h2>{t.filterTitle}</h2></div><div className="filter-head-actions"><Button variant="link" size="sm" className="filter-reset-all" type="button" onClick={resetAll} disabled={!activeCount && !activeParams.has('q')}><ArrowCounterClockwise size={14} /> {t.clearAll}</Button><Button variant="ghost" size="icon" className="filter-close" type="button" onClick={() => setFilterOpen(false)} aria-label={rtl ? 'سد الفلاتر' : 'Fermer les filtres'}><X size={20} /></Button></div></div>
    {packFilterFields.map(([field, label, key]) => {
      const selected = chosenValues(activeParams, key);
      const options = field === 'availability' ? [{ slug: 'in_stock', name: t.inStock }, { slug: 'out_of_stock', name: t.outOfStock }]
        : [...new Map(packs.flatMap((bundle) => valuesFor(bundle, field, lang)).map((option) => [option.slug, option])).values()].sort((a, b) => a.name.localeCompare(b.name, rtl ? 'ar' : 'fr'));
      const counts = options.map((option) => ({ ...option, count: packs.filter((bundle) => matchesPack(bundle, activeParams, field) && valuesFor(bundle, field).some((value) => value.slug === option.slug)).length }));
      return <details className={`filter-section${selected.length ? ' has-selection' : ''}`} key={field}>
        <summary><span>{t[label]}</span>{selected.length > 0 && <span className="filter-section-count" aria-label={`${selected.length} ${rtl ? 'اختيارات مفعّلة' : 'choix actifs'}`}>{selected.length}</span>}<CaretDown size={15} aria-hidden="true" />{selected.length > 0 && <Button variant="ghost" size="icon" className="filter-section-clear" type="button" aria-label={`${t.clearAll} ${t[label]}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); resetSection(key); }}><X size={14} /></Button>}</summary>
        <div className="facet-options">{counts.filter((option) => option.count > 0 || selected.includes(option.slug) || field === 'availability').map((option) => <Button variant="ghost" size="default" type="button" key={option.slug} disabled={option.count === 0 && !selected.includes(option.slug)} className={selected.includes(option.slug) ? 'selected' : ''} aria-pressed={selected.includes(option.slug)} onClick={() => toggleFilter(key, option.slug)}><span className="facet-option-label"><span className="facet-check" aria-hidden="true">{selected.includes(option.slug) ? '✓' : ''}</span>{option.name}</span><small>{option.count}</small></Button>)}</div>
      </details>;
    })}
    <details className={`filter-section${activeParams.has('min') || activeParams.has('max') ? ' has-selection' : ''}`}>
      <summary><span>{t.priceFilter}</span>{(activeParams.has('min') || activeParams.has('max')) && <span className="filter-section-count" aria-label={rtl ? 'فلتر الثمن مفعّل' : 'Filtre de prix actif'}>1</span>}<CaretDown size={15} aria-hidden="true" />{(activeParams.has('min') || activeParams.has('max')) && <Button variant="ghost" size="icon" className="filter-section-clear" type="button" aria-label={`${t.clearAll} ${t.priceFilter}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); resetSection('price'); }}><X size={14} /></Button>}</summary>
      <form className="price-filter" onSubmit={(event) => { event.preventDefault(); if (invalidPrice) return; if (!mobileFilters || !filterOpen) { const next = new URLSearchParams(params); if (priceMin) next.set('min', priceMin); else next.delete('min'); if (priceMax) next.set('max', priceMax); else next.delete('max'); setParams(next); } }}>
        <label>{t.minimum}<input type="number" min="0" step="1" value={priceMin} onChange={(event) => setPriceMin(event.target.value)} /></label><label>{t.maximum}<input type="number" min="0" step="1" value={priceMax} onChange={(event) => setPriceMax(event.target.value)} /></label>
        {invalidPrice && <p className="price-filter-error" role="alert">{rtl ? 'الحد الأقصى خاصو يكون أكبر من الحد الأدنى.' : 'Le prix maximum doit dépasser le minimum.'}</p>}<Button variant="outline" size="sm" type="submit" disabled={invalidPrice}>{t.apply}</Button>
      </form>
    </details>
    {mobileFilters && filterOpen && <Button variant="primary" size="lg" className="filter-apply" type="button" disabled={invalidPrice} onClick={applyMobileFilters}>{rtl ? `عرض ${packs.filter((bundle) => matchesPack(bundle, priceDraft)).length} باك` : `Afficher ${packs.filter((bundle) => matchesPack(bundle, priceDraft)).length} pack${packs.filter((bundle) => matchesPack(bundle, priceDraft)).length > 1 ? 's' : ''}`}</Button>}
  </div>;

  return <main className="inner-page pack-directory" lang={rtl ? 'ar-MA' : 'fr'} dir={rtl ? 'rtl' : undefined}>
    <nav className="breadcrumbs" aria-label="Fil d’Ariane"><Link to="/">{t.home}</Link> / {t.packs}</nav>
    <div className="pack-directory-heading"><div><p className="eyebrow">THE K-SKIN GALLERY</p><h1>{t.collection}</h1><p>{t.intro}</p></div><LanguageToggle lang={lang} onChange={setLang} /></div>
    <label className="pack-search"><MagnifyingGlass size={18} aria-hidden="true" /><input dir={rtl ? 'rtl' : undefined} type="search" aria-label={rtl ? 'قلبي على باك ولا منتج داخلو' : 'Rechercher un pack ou un produit inclus'} placeholder={t.searchPlaceholder} value={params.get('q') || ''} onChange={(event) => changeParams('q', event.target.value, true)} />{params.get('q') && <Button variant="ghost" size="icon" type="button" onClick={() => changeParams('q', '')} aria-label={rtl ? 'مسح البحث' : 'Effacer la recherche'}><X size={16} /></Button>}</label>
    <div className="collection-toolbar pack-collection-toolbar">
      <div className="collection-toolbar-summary"><span className="collection-result-count">{ready ? (rtl ? `${filtered.length} ${t.count}` : `${filtered.length} pack${filtered.length > 1 ? 's' : ''}`) : t.loadingPacks}</span>
        {selectedFilters.length > 0 && <div className="selected-filters" aria-label={rtl ? 'الفلاتر المختارة' : 'Filtres sélectionnés'}>{selectedFilters.map((item) => <Button variant="outline" size="sm" key={`${item.key}:${item.value || ''}`} type="button" onClick={() => removeSelected(item)} title={`${t.clearAll} ${item.label}`}><span>{item.label}</span><X size={13} /></Button>)}<Button variant="link" size="sm" className="clear-all" type="button" onClick={resetAll}>{t.clearAll}</Button></div>}
      </div>
      <div className="collection-toolbar-controls"><Button ref={toggleRef} variant="outline" size="default" className="filter-toggle" type="button" onClick={openFilters}><SlidersHorizontal size={17} /> {t.filterButton}{activeCount > 0 && <span className="filter-toggle-count">{activeCount}</span>}</Button><label>{t.sortTitle} <select value={params.get('sort') || 'relevance'} onChange={(event) => changeParams('sort', event.target.value)}>{Object.entries(sortLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>
    </div>
    <div className="collection-layout pack-collection-layout">
      <aside ref={panelRef} className={`filter-panel pack-filter-panel${filterOpen ? ' open' : ''}`} role={mobileFilters && filterOpen ? 'dialog' : undefined} aria-modal={mobileFilters && filterOpen ? 'true' : undefined} aria-label={mobileFilters && filterOpen ? (rtl ? 'فلاتر الباكات' : 'Filtres des packs') : undefined}>{filters}</aside>
      <div className="pack-results">
        {filtered.length ? <div className="pack-directory-grid pack-results-grid">{filtered.map((bundle) => <PackCard bundle={bundle} key={bundle.id} lang={lang} />)}</div>
          : <div className="state-panel"><Package size={28} /><h2>{t.noMatches}</h2><p>{t.noMatchesHint}</p><Button type="button" variant="primary" onClick={resetAll}>{t.clearAll}</Button></div>}
      </div>
    </div>
  </main>;
}

export function PackPage() {
  const { slug } = useParams();
  const { bundles, addBundleToCart } = useStore();
  const [fetched, setFetched] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [lang, setLang] = useState('fr');
  const bundle = bundles.find((item) => item.slug === slug) || fetched;
  useEffect(() => {
    let live = true;
    setFetched(null);
    setLoading(true);
    setQuantity(1);
    api(`/bundles/${slug}`).then((result) => { if (live) setFetched(result); }).catch(() => { if (live) setFetched(null); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [slug]);
  const t = labels[lang];
  if (!bundle) return <main className="inner-page"><div className="state-panel"><h1>{loading ? t.loading : t.notFound}</h1><Button asChild variant="primary"><Link to="/packs">{t.back}</Link></Button></div></main>;
  const c = copy(bundle, lang);
  const rtl = lang === 'ar';
  const hasGuide = Boolean(c.who || c.why || c.morning);
  const qtyMax = Math.min(Math.max(bundle.stock, 0), 10);
  const precautions = textItems(c.caution);
  const otherAdvice = textItems(c.not_for).filter((item) => !precautions.includes(item));
  const guideSteps = [['morning', c.morning], ['evening', c.evening], ['weekly', c.weekly]].filter(([, value]) => textItems(value).length);
  return <main className="inner-page pack-detail" lang={rtl ? 'ar-MA' : 'fr'}>
    <nav className="breadcrumbs" aria-label="Fil d’Ariane"><Link to="/">{t.home}</Link> / <Link to="/packs">{t.packs}</Link> / {c.name || bundle.name}</nav>
    <div className="pack-detail-tools"><Link className="pack-back" to="/packs"><ArrowLeft size={17} /> {t.back}</Link><LanguageToggle lang={lang} onChange={setLang} /></div>
    <div className="pack-compact-layout" dir={rtl ? 'rtl' : undefined}>
      <PackImage className="pack-compact-image" src={bundle.image_url} alt={bundle.name} placeholder={t.photo} eager />
      <div className="pack-compact-main">
        <p className="eyebrow">{t.pack}</p><h1>{c.name || bundle.name}</h1><p className="pack-lead">{c.summary || bundle.description}</p>
        <div className="pack-purchase-line"><StockLabel bundle={bundle} lang={lang} /><strong>{money(bundle.price_dh)}</strong></div>
        {bundle.stock > 0 ? <div className="pack-buy"><label>{t.quantity}<select value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}>{Array.from({ length: qtyMax }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label><Button variant="primary" size="default" className="pack-add-button" type="button" onClick={() => addBundleToCart(bundle, quantity)}><Bag size={18} /> {t.add}</Button></div>
          : <Button variant="primary" size="default" className="pack-unavailable" type="button" disabled>{t.unavailable}</Button>}
        <section className="pack-text-block" aria-labelledby="pack-contents-title"><h2 id="pack-contents-title">{t.contents} <small>({bundle.items.length})</small></h2>
          <ol className="pack-text-list pack-component-list">{bundle.items.map(({ product, quantity: count }) => <li key={product.id}>
            <Link to={`/produits/${product.slug}`} dir="ltr">{product.name}</Link><span className="pack-component-quantity">× {count}</span>
          </li>)}</ol>
        </section>
        {hasGuide && <section className="pack-text-block pack-quick-guide" aria-labelledby="pack-guide-title"><h2 id="pack-guide-title">{t.use}</h2>
          <ol className="pack-text-list pack-steps">{guideSteps.map(([key, value]) => <li key={key}><strong>{t[key]}</strong> <span>{textItems(value).join(' ')}</span></li>)}</ol>
        </section>}
      </div>
    </div>
    {hasGuide && <section className="pack-extra-details" dir={rtl ? 'rtl' : undefined} aria-labelledby="pack-details-title">
      <h2 id="pack-details-title">{t.details}</h2>
      <ul className="pack-facts">
        {bundle.items.map(({ product }) => c.component_notes?.[String(product.id)] && <li key={product.id}><strong><bdi dir="ltr">{product.name}</bdi> :</strong> {c.component_notes[String(product.id)]}</li>)}
        {c.who && <li><strong>{t.who}</strong> {c.who}</li>}
        {textItems(c.skin_types).length > 0 && <li><strong>{t.suitable}</strong> {textItems(c.skin_types).join(' · ')}</li>}
        {c.why && <li><strong>{t.why}</strong> {c.why}</li>}
        {textItems(c.benefits).length > 0 && <li><strong>{t.benefits}</strong> {textItems(c.benefits).join(' · ')}</li>}
        {c.expect && <li><strong>{t.expect}</strong> {c.expect}</li>}
        {otherAdvice.length > 0 && <li><strong>{t.avoid}</strong> {otherAdvice.join(' ')}</li>}
        {precautions.length > 0 && <li><strong>{t.precautions}</strong> {precautions.join(' ')}</li>}
      </ul>
    </section>}
  </main>;
}
