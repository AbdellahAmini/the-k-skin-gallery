import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, MagnifyingGlass, X } from '@phosphor-icons/react';
import { useNavigate } from 'react-router';
import { api } from '../lib/api';

export default function SearchBox({ mobile = false, open = true, onClose = () => {} }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState({ products: [], brands: [], categories: [] });
  const [focused, setFocused] = useState(false);
  useEffect(() => { if (mobile && open) inputRef.current?.focus(); }, [mobile, open]);
  useEffect(() => {
    if (!mobile || !open) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobile, open, onClose]);
  useEffect(() => {
    if (!value.trim()) { setSuggestions({ products: [], brands: [], categories: [] }); return; }
    let alive = true;
    const timer = setTimeout(() => api(`/search?q=${encodeURIComponent(value.trim())}`)
      .then((result) => alive && setSuggestions(result))
      .catch(() => alive && setSuggestions({ products: [], brands: [], categories: [] })), 180);
    return () => { alive = false; clearTimeout(timer); };
  }, [value]);
  function submit(event) {
    event.preventDefault();
    navigate(`/recherche?q=${encodeURIComponent(value.trim())}`);
    setFocused(false);
    onClose();
  }
  if (mobile && !open) return null;
  return <form className={`search-wrap ${mobile ? 'mobile-search' : ''}`} role="search" onSubmit={submit}>
    {mobile && <div className="mobile-search-head"><button type="button" onClick={onClose} aria-label="Retour"><ArrowLeft size={22} /></button><strong>Rechercher dans la Gallery</strong></div>}
    <MagnifyingGlass className="search-icon" size={20} /><input ref={inputRef} aria-label="Rechercher un produit, une marque ou un soin"
      placeholder={mobile ? 'Rechercher un produit ou une marque…' : 'Rechercher un produit, une marque, un soin…'}
      value={value} onChange={(e) => setValue(e.target.value)} onFocus={() => setFocused(true)}
      onBlur={() => setTimeout(() => setFocused(false), 150)} />
    {value && <button type="button" className="search-clear" onClick={() => setValue('')} aria-label="Effacer la recherche"><X size={16} /></button>}
    {(focused || mobile) && value.trim() && <div className="search-popover">
      {suggestions.products.length > 0 && <><span className="popover-label">Produits</span>{suggestions.products.map((p) => <button type="button" key={p.id} onMouseDown={(e) => e.preventDefault()} onClick={() => { navigate(`/produits/${p.slug}`); setFocused(false); onClose(); }}>{p.brand}<span>{p.name}</span></button>)}</>}
      {suggestions.brands.length > 0 && <><span className="popover-label">Marques</span>{suggestions.brands.map((b) => <button type="button" key={b.slug} onMouseDown={(e) => e.preventDefault()} onClick={() => { navigate(`/marques/${b.slug}`); setFocused(false); onClose(); }}>{b.name}</button>)}</>}
      {suggestions.categories.length > 0 && <><span className="popover-label">Catégories</span>{suggestions.categories.map((c) => <button type="button" key={c.slug} onMouseDown={(e) => e.preventDefault()} onClick={() => { navigate(`/soins/${c.slug}`); setFocused(false); onClose(); }}>{c.name}</button>)}</>}
      {!suggestions.products.length && !suggestions.brands.length && !suggestions.categories.length && <p>Aucun résultat. Essayez un autre mot.</p>}
      <button type="submit" className="search-all-results" onMouseDown={(e) => e.preventDefault()}>Voir tous les résultats <ArrowRight size={15} /></button>
    </div>}
  </form>;
}
