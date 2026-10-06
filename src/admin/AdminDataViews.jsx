import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowsDownUp, MagnifyingGlass, SlidersHorizontal, X } from '@phosphor-icons/react';
import ProductImage from '../components/ProductImage';
import { api, money } from '../lib/api';

const column = createColumnHelper();
const productColumnIds = ['name', 'brand', 'price_dh', 'stock', 'publication_status', 'verification_status'];
const stockColumnIds = ['name', 'brand', 'stock'];
const productRequiredColumnIds = ['name'];
const stockRequiredColumnIds = ['name', 'stock'];
const statusLabels = { a_confirmer: 'À confirmer', appel_en_cours: 'Appel en cours', confirmee: 'Confirmée',
  preparation: 'Préparation', expediee: 'Expédiée', livree: 'Livrée', injoignable: 'Injoignable',
  annulee: 'Annulée', refusee: 'Refusée à la livraison', retournee: 'Retournée' };
const filtersFrom = (params) => Object.fromEntries(['q','publication_status','verification_status','inventory_status','brand_slug','product_type_slug','skin_type_slug','concern_slug','readiness']
  .map((key) => [key, params.get(key) || '']).filter(([, value]) => value));

function useAdminSearchParams() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useState(() => new URLSearchParams(location.search));
  useEffect(() => { setParams(new URLSearchParams(location.search)); }, [location.search]);
  const setParam = (name, next) => {
    const copy = new URLSearchParams(params);
    if (next) copy.set(name, next); else copy.delete(name);
    setParams(copy);
    const search = copy.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true, preventScrollReset: true });
  };
  return [params, setParam];
}

function useAdminInfiniteList(kind, params, sort) {
  const scope = params.toString();
  return useInfiniteQuery({
    queryKey: ['admin', kind, scope, sort],
    initialPageParam: '',
    queryFn: ({ pageParam }) => {
      const query = new URLSearchParams(scope);
      query.set('limit', '30');
      query.set('sort', sort);
      if (pageParam) query.set('cursor', pageParam);
      return api(`/admin/${kind}?${query}`);
    },
    getNextPageParam: (last) => last.has_more ? last.next_cursor : undefined,
    staleTime: 20_000,
  });
}

function ErrorState({ error }) { return error ? <div className="admin-v2-state admin-v2-error" role="alert">{error.message || String(error)}</div> : null; }

function readColumnVisibility(key, allowedIds, requiredIds = ['name']) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    return Object.fromEntries(allowedIds.filter((id) => !requiredIds.includes(id) && saved?.[id] === false).map((id) => [id, false]));
  } catch {
    return {};
  }
}

function FilterSelect({ label, value, onChange, children }) {
  return <label className={value ? 'admin-v2-filter-chip is-active' : 'admin-v2-filter-chip'}>
    <span>{label}</span>
    <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>
  </label>;
}

function ColumnVisibilityMenu({ columns, visibility, onChange, requiredIds = ['name'] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);
  const available = columns.filter((item) => item.id !== 'select' && item.id !== 'edit');
  return <div className="admin-v2-columns" ref={rootRef}>
    <button ref={triggerRef} type="button" className="admin-v2-columns-trigger" aria-label="Afficher ou masquer les colonnes"
      aria-expanded={open} aria-controls="admin-v2-columns-panel" onClick={() => setOpen((current) => !current)}>
      <SlidersHorizontal size={17} /> <span>Colonnes</span>
    </button>
    {open && <div id="admin-v2-columns-panel" className="admin-v2-columns-panel" role="group" aria-label="Colonnes visibles">
      {available.map((item) => {
        const required = requiredIds.includes(item.id);
        const title = typeof item.columnDef.header === 'string' ? item.columnDef.header : item.id;
        return <label key={item.id} className={required ? 'is-required' : ''}>
          <input type="checkbox" checked={visibility[item.id] !== false} disabled={required}
            onChange={(event) => onChange(item.id, event.target.checked)} />
          <span>{title}</span>{required && <small>Toujours visible</small>}
        </label>;
      })}
    </div>}
  </div>;
}

function AdminListSkeleton({ label }) {
  return <div className="admin-v2-loading-surface" role="status" aria-label={label} aria-busy="true">
    <span className="admin-v2-sr-only">{label}</span>
    <div className="admin-v2-skeleton-heading" aria-hidden="true"><i /><i /></div>
    <div className="admin-v2-skeleton-rows" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => <div className="admin-v2-skeleton-row" key={index}>
        <i className="admin-v2-skeleton-check" /><i className="admin-v2-skeleton-product" />
        <i /><i /><i /><i />
      </div>)}
    </div>
  </div>;
}

function GridScroll({ rows, isFetchingNextPage, hasNextPage, fetchNextPage, queryKey, children }) {
  const rootRef = useRef(null);
  const sentinelRef = useRef(null);
  useEffect(() => {
    const root = rootRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) fetchNextPage();
    }, { root, rootMargin: '160px 0px', threshold: 0 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, queryKey]);
  useEffect(() => {
    if (!rootRef.current) return;
    const stored = sessionStorage.getItem(`admin-grid:${queryKey}`);
    if (!stored) { rootRef.current.scrollTop = 0; return; }
    try { rootRef.current.scrollTop = JSON.parse(stored).scrollTop || 0; } catch { rootRef.current.scrollTop = 0; }
  }, [queryKey, rows.length]);
  const savePosition = () => sessionStorage.setItem(`admin-grid:${queryKey}`, JSON.stringify({ scrollTop: rootRef.current?.scrollTop || 0 }));
  return <div className="admin-v2-grid-scroll" ref={rootRef} onScroll={savePosition}>
    {children}
    {hasNextPage && <div className="admin-v2-sentinel" ref={sentinelRef} aria-hidden="true" />}
    {isFetchingNextPage && <div className="admin-v2-loading-row" role="status">Chargement de 30 éléments…</div>}
    {!hasNextPage && rows.length > 0 && <div className="admin-v2-grid-end">Tous les résultats affichés</div>}
  </div>;
}

export function ProductsPage({ stockOnly = false }) {
  const [params, setParam] = useAdminSearchParams();
  const search = params.get('q') || '';
  const publication = params.get('publication_status') || '';
  const verification = params.get('verification_status') || '';
  const inventory = params.get('inventory_status') || '';
  const brand = params.get('brand_slug') || '';
  const productType = params.get('product_type_slug') || '';
  const skinType = params.get('skin_type_slug') || '';
  const concern = params.get('concern_slug') || '';
  const readiness = params.get('readiness') || '';
  const sort = params.get('sort') || '';
  const activeSort = sort || 'id';
  const queryScope = useMemo(() => {
    const current = new URLSearchParams(params);
    current.delete('sort');
    return current.toString();
  }, [params]);
  const filters = useMemo(() => filtersFrom(params), [queryScope]);
  const { data, error, isPending, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } = useAdminInfiniteList('products', params, activeSort);
  const rows = useMemo(() => data?.pages.flatMap((page) => page.products) || [], [data?.pages]);
  const total = data?.pages[0]?.total || 0;
  const [selection, setSelection] = useState({ mode: 'explicit', ids: [], excluded_ids: [] });
  const [bulkAction, setBulkAction] = useState('');
  const [bulkValue, setBulkValue] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [editingStock, setEditingStock] = useState(null);
  const [stockValue, setStockValue] = useState('');
  const [savingStockId, setSavingStockId] = useState(null);
  const [stockFeedback, setStockFeedback] = useState('');
  const visibilityKey = stockOnly ? 'admin-stock-columns' : 'admin-products-columns';
  const visibilityColumnIds = stockOnly ? stockColumnIds : productColumnIds;
  const requiredColumnIds = stockOnly ? stockRequiredColumnIds : productRequiredColumnIds;
  const [columnVisibility, setColumnVisibility] = useState(() => readColumnVisibility(visibilityKey, visibilityColumnIds, requiredColumnIds));
  useEffect(() => { setSelection({ mode: 'explicit', ids: [], excluded_ids: [] }); setBulkMessage(''); }, [queryScope]);
  useEffect(() => {
    const hiddenColumns = Object.fromEntries(visibilityColumnIds
      .filter((id) => !requiredColumnIds.includes(id) && columnVisibility[id] === false)
      .map((id) => [id, false]));
    localStorage.setItem(visibilityKey, JSON.stringify(hiddenColumns));
  }, [columnVisibility, requiredColumnIds, visibilityColumnIds, visibilityKey]);
  const updateColumnVisibility = useCallback((id, visible) => {
    if (requiredColumnIds.includes(id)) return;
    setColumnVisibility((current) => ({ ...current, [id]: visible }));
  }, [requiredColumnIds]);
  const selectedCount = selection.mode === 'all_matching' ? Math.max(0, total - selection.excluded_ids.length) : selection.ids.length;
  const isSelected = (id) => selection.mode === 'all_matching' ? !selection.excluded_ids.includes(id) : selection.ids.includes(id);
  const toggleRow = (id) => setSelection((current) => {
    if (current.mode === 'all_matching') return { ...current, excluded_ids: current.excluded_ids.includes(id) ? current.excluded_ids.filter((value) => value !== id) : [...current.excluded_ids, id] };
    return { ...current, ids: current.ids.includes(id) ? current.ids.filter((value) => value !== id) : [...current.ids, id] };
  });
  const togglePage = (checked) => setSelection((current) => {
    const visible = rows.map((row) => row.id);
    if (current.mode === 'all_matching') return { ...current, excluded_ids: checked ? current.excluded_ids.filter((id) => !visible.includes(id)) : [...new Set([...current.excluded_ids, ...visible])] };
    return { ...current, ids: checked ? [...new Set([...current.ids, ...visible])] : current.ids.filter((id) => !visible.includes(id)) };
  });
  const visibleChecked = rows.length > 0 && rows.every((row) => isSelected(row.id));
  const brands = useQuery({ queryKey: ['admin', 'taxonomy', 'brands'], queryFn: () => api('/admin/taxonomy/brands'), staleTime: 60_000 });
  const types = useQuery({ queryKey: ['admin', 'taxonomy', 'product-types'], queryFn: () => api('/admin/taxonomy/product-types'), staleTime: 60_000 });
  const skinTypes = useQuery({ queryKey: ['admin', 'taxonomy', 'skin-types'], queryFn: () => api('/admin/taxonomy/skin-types'), staleTime: 60_000, enabled: !stockOnly });
  const concerns = useQuery({ queryKey: ['admin', 'taxonomy', 'concerns'], queryFn: () => api('/admin/taxonomy/concerns'), staleTime: 60_000, enabled: !stockOnly });
  const columns = useMemo(() => [
    column.display({ id: 'select', header: () => <input aria-label="Sélectionner les éléments chargés" type="checkbox" checked={visibleChecked} onChange={(event) => togglePage(event.target.checked)} />, cell: ({ row }) => <input aria-label={`Sélectionner ${row.original.name}`} type="checkbox" checked={isSelected(row.original.id)} onChange={() => toggleRow(row.original.id)} /> }),
    column.accessor('name', { header: 'Produit', cell: ({ row }) => <div className="admin-v2-product-cell"><ProductImage src={row.original.image_url} alt="" /><span><strong>{row.original.name}</strong><small>{row.original.sku} · {row.original.size || 'Format à renseigner'}</small></span></div> }),
    column.accessor('brand', { header: 'Marque' }),
    ...(stockOnly ? [] : [column.accessor('price_dh', { header: 'Prix', cell: ({ getValue }) => getValue() > 0 ? money(getValue()) : <span className="admin-v2-muted">À confirmer</span> })]),
    column.accessor('stock', { header: stockOnly ? 'Disponible' : 'Stock', cell: ({ row }) => <span className={`admin-v2-stock admin-v2-stock--${row.original.inventory_status}`}>{row.original.stock} · {row.original.inventory_status === 'out_of_stock' ? 'Rupture' : row.original.inventory_status === 'low_stock' ? 'Faible' : 'Disponible'}</span> }),
    ...(!stockOnly ? [column.accessor('publication_status', { header: 'Publication', cell: ({ getValue }) => <span className={`admin-v2-badge admin-v2-badge--${getValue()}`}>{({ draft: 'Brouillon', published: 'Publié', archived: 'Archivé' })[getValue()]}</span> }),
      column.accessor('verification_status', { header: 'Vérification', cell: ({ getValue }) => <span className="admin-v2-muted">{({ VERIFIED: 'Vérifié', PARTIAL: 'Partiel', NEEDS_REVIEW: 'À vérifier', UNVERIFIED: 'Non vérifié' })[getValue()] || getValue()}</span> })] : []),
    column.display({ id: 'edit', header: '', cell: ({ row }) => stockOnly ? <div className="admin-v2-stock-edit">{editingStock === row.original.id ? <><input aria-label={`Nouveau stock pour ${row.original.name}`} type="number" min="0" value={stockValue} onChange={(event) => setStockValue(event.target.value)} /><button type="button" disabled={savingStockId === row.original.id} onClick={async () => { setSavingStockId(row.original.id); setStockFeedback(''); try { await api(`/admin/products/${row.original.id}`, { method: 'PATCH', body: { stock: Number(stockValue) } }); setEditingStock(null); setStockFeedback('Stock mis à jour.'); await refetch(); } catch (cause) { setStockFeedback(cause.message); } finally { setSavingStockId(null); } }}>Enregistrer</button><button type="button" className="admin-v2-quiet-button" onClick={() => setEditingStock(null)}>Annuler</button></> : <button type="button" className="admin-v2-row-link" onClick={() => { setEditingStock(row.original.id); setStockValue(String(row.original.stock)); }}>Ajuster</button>}{stockFeedback && <small role="status">{stockFeedback}</small>}</div> : <Link className="admin-v2-row-link" to={`/admin/catalogue/produits/${row.original.id}`}>Ouvrir</Link> }),
  ], [visibleChecked, selection, rows, stockOnly, editingStock, stockValue, savingStockId, stockFeedback, refetch]);
  const rowSelection = useMemo(() => Object.fromEntries(rows.filter((row) => isSelected(row.id)).map((row) => [row.id, true])), [rows, selection]);
  const table = useReactTable({ data: rows, columns, getRowId: (row) => String(row.id), getCoreRowModel: getCoreRowModel(), enableRowSelection: true,
    state: { columnVisibility, rowSelection }, onColumnVisibilityChange: setColumnVisibility });
  const queryKey = `${stockOnly ? 'stock' : 'products'}:${queryScope}:${activeSort}`;
  async function applyBulk(event) {
    event.preventDefault();
    if (!selectedCount || !bulkAction || !bulkValue) return;
    const body = { selection: selection.mode === 'all_matching' ? { mode: 'all_matching', filters, excluded_ids: selection.excluded_ids } : { mode: 'explicit', ids: selection.ids } };
    if (bulkAction === 'publication') body.publication_status = bulkValue;
    if (bulkAction === 'featured') body.featured = bulkValue === 'true';
    if (bulkAction === 'threshold') body.low_stock_threshold = Number(bulkValue);
    if (bulkAction === 'type') body.category_slug = bulkValue;
    try {
      const result = await api('/admin/products/bulk', { method: 'POST', body });
      setBulkMessage(`${result.updated} mis à jour${result.skipped?.length ? ` · ${result.skipped.length} ignoré(s) avec motif` : ''}.`);
      setSelection({ mode: 'explicit', ids: [], excluded_ids: [] });
      await refetch();
    } catch (cause) { setBulkMessage(cause.message); }
  }
  return <section className="admin-v2-page admin-v2-list-page">
    <div className="admin-v2-page-heading"><div><span className="admin-v2-eyebrow">{stockOnly ? 'OPÉRATIONS' : 'CATALOGUE'}</span><h1>{stockOnly ? 'Stock & disponibilité' : 'Produits'}</h1><p>{stockOnly ? 'Quantités disponibles et seuils de réapprovisionnement.' : 'Recherche, qualité des fiches et publication du catalogue.'}</p></div>
      {!stockOnly && <Link className="admin-v2-primary" to="/admin/catalogue/produits/nouveau">+ Nouveau produit</Link>}
    </div>
    <div className="admin-v2-toolbar">
      <div className="admin-v2-search-row">
        <label className="admin-v2-search"><MagnifyingGlass size={18} /><input aria-label="Rechercher un produit" placeholder="Nom, SKU, code-barres ou marque" value={search} onChange={(event) => setParam('q', event.target.value)} />{search && <button type="button" aria-label="Effacer la recherche" onClick={() => setParam('q', '')}><X size={15} /></button>}</label>
      </div>
      <div className="admin-v2-filter-row">
        <div className="admin-v2-filter-list" role="group" aria-label={stockOnly ? 'Filtres de stock' : 'Filtres produits'}>
          {!stockOnly && <>
            <FilterSelect label="Publication" value={publication} onChange={(value) => setParam('publication_status', value)}><option value="">Toutes</option><option value="draft">Brouillon</option><option value="published">Publié</option><option value="archived">Archivé</option></FilterSelect>
            <FilterSelect label="Vérification" value={verification} onChange={(value) => setParam('verification_status', value)}><option value="">Toutes</option><option value="VERIFIED">Vérifié</option><option value="PARTIAL">Partiel</option><option value="NEEDS_REVIEW">À vérifier</option><option value="UNVERIFIED">Non vérifié</option></FilterSelect>
          </>}
          <FilterSelect label="Stock" value={inventory} onChange={(value) => setParam('inventory_status', value)}><option value="">Tous</option><option value="in_stock">Disponible</option><option value="low_stock">Faible</option><option value="out_of_stock">Rupture</option></FilterSelect>
          {!stockOnly && <>
            <FilterSelect label="Marque" value={brand} onChange={(value) => setParam('brand_slug', value)}><option value="">Toutes</option>{brands.data?.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</FilterSelect>
            <FilterSelect label="Type de soin" value={productType} onChange={(value) => setParam('product_type_slug', value)}><option value="">Tous</option>{types.data?.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</FilterSelect>
            <FilterSelect label="Type de peau" value={skinType} onChange={(value) => setParam('skin_type_slug', value)}><option value="">Tous</option>{skinTypes.data?.filter((item) => item.active !== false || item.slug === skinType).map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</FilterSelect>
            <FilterSelect label="Besoin" value={concern} onChange={(value) => setParam('concern_slug', value)}><option value="">Tous</option>{concerns.data?.filter((item) => item.active !== false || item.slug === concern).map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</FilterSelect>
            <FilterSelect label="Préparation" value={readiness} onChange={(value) => setParam('readiness', value)}><option value="">Toute</option><option value="ready">Prêt à publier</option><option value="blocked">À compléter</option></FilterSelect>
          </>}
        </div>
        <div className="admin-v2-filter-actions">
          <label className="admin-v2-sort"><ArrowsDownUp size={16} /><select aria-label="Trier les produits" value={activeSort} onChange={(event) => setParam('sort', event.target.value)}><option value="id">Plus récents</option><option value="name">Nom A–Z</option><option value="price">Prix décroissant</option><option value="stock">Stock décroissant</option><option value="updated">Modification récente</option></select></label>
          <ColumnVisibilityMenu columns={table.getAllLeafColumns()} visibility={columnVisibility} onChange={updateColumnVisibility} requiredIds={requiredColumnIds} />
        </div>
      </div>
    </div>
    <div className="admin-v2-result-line"><span>{isPending ? 'Chargement…' : `${total} produit${total > 1 ? 's' : ''}`}{rows.length < total ? ` · ${rows.length} affichés` : ''}</span>{stockOnly && <span>Le système ne conserve pas encore d’historique de mouvements de stock.</span>}{stockFeedback && <span role="status">{stockFeedback}</span>}<button type="button" className="admin-v2-text-button" onClick={() => refetch()}>Actualiser</button></div>
    {selectedCount > 0 && <form className="admin-v2-bulk" onSubmit={applyBulk}>
      <div className="admin-v2-bulk-summary"><strong>{selectedCount.toLocaleString('fr-FR')} sélectionné(s)</strong>{selection.mode === 'explicit' && total > rows.length && <button type="button" onClick={() => setSelection({ mode: 'all_matching', ids: [], excluded_ids: [] })}>Sélectionner les {total.toLocaleString('fr-FR')} résultats</button>}{selection.mode === 'all_matching' && <button type="button" onClick={() => setSelection({ mode: 'explicit', ids: [], excluded_ids: [] })}>Annuler la sélection globale</button>}</div>
      <select aria-label="Action groupée" value={bulkAction} onChange={(event) => { setBulkAction(event.target.value); setBulkValue(''); }}><option value="">Action groupée…</option>{stockOnly ? <option value="threshold">Seuil de stock faible</option> : <><option value="publication">Publication</option><option value="featured">Mise en avant</option><option value="threshold">Seuil de stock faible</option><option value="type">Type de soin</option></>}</select>
      {!stockOnly && bulkAction === 'publication' && <select required aria-label="Nouvel état de publication" value={bulkValue} onChange={(event) => setBulkValue(event.target.value)}><option value="">Choisir…</option><option value="draft">Brouillon</option><option value="published">Publier</option><option value="archived">Archiver</option></select>}
      {!stockOnly && bulkAction === 'featured' && <select required aria-label="Mise en avant" value={bulkValue} onChange={(event) => setBulkValue(event.target.value)}><option value="">Choisir…</option><option value="true">Mettre à la une</option><option value="false">Retirer de la une</option></select>}
      {bulkAction === 'threshold' && <input aria-label="Seuil de stock faible" type="number" min="0" value={bulkValue} onChange={(event) => setBulkValue(event.target.value)} />}
      {!stockOnly && bulkAction === 'type' && <select aria-label="Type de soin à appliquer" value={bulkValue} onChange={(event) => setBulkValue(event.target.value)}><option value="">Choisir un type…</option>{types.data?.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>}
      <button className="admin-v2-primary" disabled={!bulkAction || !bulkValue}>Appliquer</button>{bulkMessage && <span role="status">{bulkMessage}</span>}
    </form>}
    <ErrorState error={error} />
    <div className="admin-v2-data-surface">
      {isPending ? <AdminListSkeleton label={stockOnly ? 'Chargement du stock' : 'Chargement du catalogue'} /> : !rows.length ? <div className="admin-v2-state"><strong>Aucun produit trouvé</strong><span>Ajustez la recherche ou les filtres.</span></div> :
        <GridScroll rows={rows} queryKey={queryKey} hasNextPage={hasNextPage} isFetchingNextPage={isFetchingNextPage} fetchNextPage={fetchNextPage}>
          <table className="admin-v2-table"><thead><tr>{table.getHeaderGroups().flatMap((group) => group.headers).map((header) => <th key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr></thead>
            <tbody>{table.getRowModel().rows.map((row) => <tr key={row.id}>{row.getVisibleCells().map((cell) => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody>
          </table>
        </GridScroll>}
    </div>
    <div className="admin-v2-grid-footer"><span>Chargement progressif par lots de 30 · {rows.length} / {total}</span><span>La sélection globale suit la recherche et les filtres actuels.</span></div>
  </section>;
}

export function OrdersPage() {
  const [params, setParam] = useAdminSearchParams();
  const search = params.get('q') || '';
  const status = params.get('status') || '';
  const city = params.get('city') || '';
  const createdAfter = params.get('created_after') || '';
  const createdBefore = params.get('created_before') || '';
  const sort = params.get('sort') || '';
  const activeSort = sort || 'id';
  const { data, error, isPending, isFetchingNextPage, hasNextPage, fetchNextPage } = useAdminInfiniteList('orders', params, activeSort);
  const rows = useMemo(() => data?.pages.flatMap((page) => page.orders) || [], [data?.pages]);
  const total = data?.pages[0]?.total || 0;
  const cities = useQuery({ queryKey: ['admin', 'cities'], queryFn: () => api('/admin/cities'), staleTime: 60_000 });
  const queryKey = `orders:${params.toString()}`;
  return <section className="admin-v2-page admin-v2-list-page">
    <div className="admin-v2-page-heading"><div><span className="admin-v2-eyebrow">COMMERCE</span><h1>Commandes</h1><p>Suivez les commandes COD et leur avancement.</p></div></div>
    <div className="admin-v2-toolbar">
      <div className="admin-v2-search-row">
        <label className="admin-v2-search"><MagnifyingGlass size={18} /><input aria-label="Rechercher une commande" placeholder="Numéro, nom ou téléphone" value={search} onChange={(event) => setParam('q', event.target.value)} />{search && <button type="button" aria-label="Effacer la recherche" onClick={() => setParam('q', '')}><X size={15} /></button>}</label>
      </div>
      <div className="admin-v2-filter-row">
        <div className="admin-v2-filter-list" role="group" aria-label="Filtres commandes">
          <FilterSelect label="Statut" value={status} onChange={(value) => setParam('status', value)}><option value="">Tous</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</FilterSelect>
          <FilterSelect label="Ville" value={city} onChange={(value) => setParam('city', value)}><option value="">Toutes</option>{cities.data?.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</FilterSelect>
          <label className="admin-v2-date-filter">Du<input aria-label="Commandes depuis" type="date" value={createdAfter} onChange={(event) => setParam('created_after', event.target.value)} /></label>
          <label className="admin-v2-date-filter">Au<input aria-label="Commandes jusqu’au" type="date" value={createdBefore} onChange={(event) => setParam('created_before', event.target.value)} /></label>
        </div>
        <div className="admin-v2-filter-actions">
          <label className="admin-v2-sort"><ArrowsDownUp size={16} /><select aria-label="Trier les commandes" value={activeSort} onChange={(event) => setParam('sort', event.target.value)}><option value="id">Plus récentes</option><option value="amount">Montant décroissant</option><option value="customer">Client A–Z</option></select></label>
        </div>
      </div>
    </div>
    <div className="admin-v2-result-line"><span>{isPending ? 'Chargement…' : `${total} commande${total > 1 ? 's' : ''}`}{rows.length < total ? ` · ${rows.length} affichées` : ''}</span><span>Les commandes COD ne peuvent pas être confirmées en lot.</span></div>
    <ErrorState error={error} />
    <div className="admin-v2-data-surface">{isPending ? <AdminListSkeleton label="Chargement des commandes" /> : !rows.length ? <div className="admin-v2-state"><strong>Aucune commande trouvée</strong><span>Les commandes correspondantes apparaîtront ici.</span></div> :
      <GridScroll rows={rows} queryKey={queryKey} hasNextPage={hasNextPage} isFetchingNextPage={isFetchingNextPage} fetchNextPage={fetchNextPage}>
        <table className="admin-v2-table"><thead><tr><th>Commande</th><th>Client</th><th>Ville</th><th>Statut</th><th>Montant COD</th><th>Date</th><th></th></tr></thead><tbody>{rows.map((order) => <tr key={order.id}>
          <td><Link className="admin-v2-strong-link" to={`/admin/commandes/${order.id}`}>{order.number}</Link></td><td><strong>{order.first_name} {order.last_name}</strong><small>{order.phone}</small></td><td>{order.city}</td><td><span className={`admin-v2-badge admin-v2-badge--${order.status}`}>{statusLabels[order.status] || order.status}</span></td><td>{money(order.total_dh)}</td><td>{new Date(order.created_at).toLocaleDateString('fr-FR')}</td><td><Link className="admin-v2-row-link" to={`/admin/commandes/${order.id}`}>Ouvrir</Link></td>
        </tr>)}</tbody></table>
      </GridScroll>}
    </div>
    <div className="admin-v2-grid-footer"><span>Chargement progressif par lots de 30 · {rows.length} / {total}</span><span>Chaque changement de statut doit garder une note dans l’historique.</span></div>
  </section>;
}

