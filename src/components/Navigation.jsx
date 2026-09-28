import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CaretDown, Sparkle } from '@phosphor-icons/react';
import { Link, NavLink, useLocation } from 'react-router';
import { prefetchRoute } from '../lib/route-prefetch';

const careMap = [
  ['Nettoyer', ['huiles-baumes', 'nettoyants', 'exfoliants']],
  ['Préparer & traiter', ['toners-essences', 'serums-ampoules', 'masques', 'contour-des-yeux']],
  ['Hydrater & protéger', ['cremes', 'protection-solaire']],
];

export function buildNavigation({ brands, categories, skinTypes, concerns, routines, bundles, content }) {
  const activeBrands = [...brands].filter((item) => item.count > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  const featuredSlugs = content.homepage?.featured_brand_slugs || [];
  const dropdownBrands = [...featuredSlugs.map((slug) => activeBrands.find((item) => item.slug === slug)).filter(Boolean),
    ...[...activeBrands].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr'))]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.slug === item.slug) === index)
    .slice(0, 9)
    .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  const careGroups = careMap.map(([title, slugs]) => ({ title, links: slugs
    .map((slug) => categories.find((item) => item.slug === slug && item.count > 0))
    .filter(Boolean).map((item) => ({ label: item.name, href: `/soins/${item.slug}` })) })).filter((group) => group.links.length);
  const linkRows = (items, prefix) => items.map((item) => ({ label: item.name, href: `${prefix}/${item.slug}` }));
  return [
    { id: 'new', label: 'Nouveautés', href: '/nouveautes' },
    { id: 'brands', label: 'Marques', href: '/marques', menuType: 'brands',
      preview: linkRows(dropdownBrands, '/marques') },
    { id: 'care', label: 'Soins', href: '/soins', menuType: 'care', groups: careGroups },
    { id: 'skin', label: 'Peau', href: '/peau', menuType: 'skin', groups: [
      { title: 'Type de peau', links: linkRows(skinTypes, '/type-de-peau') },
      { title: 'Besoins', links: linkRows(concerns, '/besoins') },
    ] },
    { id: 'routines', label: 'Routines & Packs', href: '/routines', menuType: 'routines', groups: [
      { title: 'Routines', links: linkRows(routines, '/routines') },
      { title: 'Packs', links: [...linkRows(bundles, '/packs'), { label: 'Tous les packs', href: '/packs' }] },
    ], feature: routines[0] },
    { id: 'promos', label: 'Promotions', href: '/promotions' },
  ];
}

function MenuLinks({ links, onNavigate }) {
  return links.map((item) => <Link key={item.href} to={item.href} onClick={onNavigate}>{item.label}</Link>);
}

function MenuGroup({ title, links, onNavigate, className = '' }) {
  return <section className={`gallery-mega-group ${className}`}>
    <h2>{title}</h2><div className="gallery-mega-links"><MenuLinks links={links} onNavigate={onNavigate} /></div>
  </section>;
}

function BrandsMegaMenu({ section, onNavigate }) {
  return <div className="gallery-brands-grid">
    <div className="gallery-mega-links gallery-brand-columns" style={{ '--brand-rows-desktop': Math.ceil(section.preview.length / 3), '--brand-rows-compact': Math.ceil(section.preview.length / 2) }}>
      <MenuLinks links={section.preview} onNavigate={onNavigate} /></div>
  </div>;
}

function CareMegaMenu({ section, onNavigate }) {
  return <><div className="gallery-care-grid">{section.groups.map((group) =>
    <MenuGroup key={group.title} {...group} onNavigate={onNavigate} />)}</div>
    <div className="gallery-mega-quick"><span>À explorer</span><MenuLinks onNavigate={onNavigate} links={[
      { label: 'Les incontournables', href: '/incontournables' },
      { label: 'Nouveautés', href: '/nouveautes' },
      { label: 'Packs', href: '/packs' },
    ]} /></div></>;
}

function SkinMegaMenu({ section, onNavigate }) {
  return <div className="gallery-skin-grid">{section.groups.map((group, index) =>
    <MenuGroup key={group.title} {...group} onNavigate={onNavigate} className={index ? 'gallery-skin-needs' : ''} />)}</div>;
}

function RoutineMegaMenu({ section, onNavigate }) {
  return <div className="gallery-routine-grid">{section.groups.map((group) =>
    <MenuGroup key={group.title} {...group} onNavigate={onNavigate} />)}
    {section.feature && <Link className="gallery-mega-feature" to={`/routines/${section.feature.slug}`} onClick={onNavigate}>
      <Sparkle size={15} weight="fill" /><span>Commencer simplement</span>
      <strong>{section.feature.name}</strong><small>{section.feature.description || 'Des gestes essentiels, à votre rythme.'}</small>
      <b>Découvrir <ArrowRight size={15} /></b></Link>}
  </div>;
}

function MegaMenuShell({ section, visible, fading, onNavigate, onEnter, onLeave }) {
  return <div id="gallery-primary-menu" className={`gallery-mega gallery-mega--${section?.menuType || 'brands'} ${visible ? 'is-open' : ''} ${fading ? 'is-switching' : ''}`}
    role="region" aria-label={section ? `Explorer ${section.label}` : 'Navigation'} aria-hidden={!visible}
    onMouseEnter={onEnter} onMouseLeave={onLeave} inert={!visible}>
    {section && <div className="gallery-mega-inner" key={section.id}>
      <div className="gallery-mega-heading"><span>{section.label}</span>
        <Link to={section.href} onClick={onNavigate}>{section.id === 'brands' ? 'Toutes les marques' : `Voir ${section.id === 'care' ? 'tous les soins' : section.id === 'skin' ? 'tout' : 'toutes les routines'}`} <ArrowRight size={15} /></Link></div>
      {section.id === 'brands' && <BrandsMegaMenu section={section} onNavigate={onNavigate} />}
      {section.id === 'care' && <CareMegaMenu section={section} onNavigate={onNavigate} />}
      {section.id === 'skin' && <SkinMegaMenu section={section} onNavigate={onNavigate} />}
      {section.id === 'routines' && <RoutineMegaMenu section={section} onNavigate={onNavigate} />}
    </div>}
  </div>;
}

export function PrimaryNavigation({ sections }) {
  const [openId, setOpenId] = useState('');
  const [renderId, setRenderId] = useState('');
  const [fading, setFading] = useState(false);
  const timers = useRef({ open: null, close: null, switch: null });
  const root = useRef(null);
  const location = useLocation();
  const clear = (kind) => { window.clearTimeout(timers.current[kind]); timers.current[kind] = null; };
  const close = () => { clear('open'); clear('close'); clear('switch'); setFading(false); setOpenId(''); };
  const show = (id) => {
    clear('open'); clear('close'); clear('switch');
    if (!id) { close(); return; }
    if (renderId && renderId !== id && openId) {
      setFading(true);
      timers.current.switch = window.setTimeout(() => { setRenderId(id); setOpenId(id); setFading(false); }, 45);
    } else { setRenderId(id); setOpenId(id); setFading(false); }
  };
  const intent = (id) => {
    clear('open'); clear('close');
    if (!id) { close(); return; }
    if (openId === id) return;
    if (openId) { show(id); return; }
    timers.current.open = window.setTimeout(() => show(id), 90);
  };
  const leave = () => { clear('open'); clear('close'); timers.current.close = window.setTimeout(close, 110); };
  useEffect(() => close(), [location.pathname]);
  useEffect(() => {
    const outside = (event) => { if (!root.current?.contains(event.target)) close(); };
    const escape = (event) => { if (event.key === 'Escape') close(); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); Object.values(timers.current).forEach(window.clearTimeout); };
  }, []);
  const section = sections.find((item) => item.id === renderId);
  return <div className="gallery-nav-system" ref={root} onMouseLeave={leave} onMouseEnter={() => clear('close')}
    onKeyDown={(event) => { if (event.key === 'Escape') { close(); root.current?.querySelector(`[data-nav-id="${openId}"]`)?.focus(); } }}>
    <nav className="primary-nav gallery-nav" aria-label="Navigation principale">
      {sections.map((item) => <div className={`gallery-nav-item ${openId === item.id ? 'is-open' : ''}`} key={item.id}
        onMouseEnter={() => { prefetchRoute(item.href).catch(() => {}); intent(item.menuType ? item.id : ''); }}>
        <NavLink data-nav-id={item.id} to={item.href}
          className={({ isActive }) => `${isActive ? 'active ' : ''}${item.id === 'promos' ? 'promo-link' : ''}`}>{item.label}</NavLink>
        {item.menuType && <button type="button" className="gallery-nav-chevron" aria-label={`Afficher le menu ${item.label}`}
          aria-expanded={openId === item.id} aria-controls="gallery-primary-menu"
          onClick={() => openId === item.id ? close() : show(item.id)}><CaretDown size={11} /></button>}
      </div>)}
    </nav>
    <MegaMenuShell section={section} visible={!!openId} fading={fading} onNavigate={close}
      onEnter={() => clear('close')} onLeave={leave} />
  </div>;
}

function MobileNavAccordion({ section, onNavigate }) {
  const [open, setOpen] = useState(false);
  return <div className={`gallery-mobile-accordion gallery-mobile-accordion--${section.id} ${open ? 'is-open' : ''}`}>
    <button type="button" className="gallery-mobile-trigger" aria-expanded={open} aria-controls={`mobile-${section.id}`}
      onClick={() => setOpen((value) => !value)}>{section.label}<CaretDown size={16} /></button>
    <div id={`mobile-${section.id}`} className="gallery-mobile-panel" aria-hidden={!open} inert={!open}><div className="gallery-mobile-panel-inner">
      {section.id === 'brands' ? <><Link className="gallery-mobile-brand-all" to="/marques" onClick={onNavigate}>Toutes les marques <ArrowRight size={14} /></Link>
        <div className="gallery-mobile-brand-links"><MenuLinks links={section.preview} onNavigate={onNavigate} /></div></>
        : section.groups.map((group) => <section key={group.title}><h3>{group.title}</h3><MenuLinks links={group.links} onNavigate={onNavigate} /></section>)}
      {section.id !== 'brands' && <Link className="gallery-mobile-all" to={section.href} onClick={onNavigate}>
        {section.id === 'care' ? 'Tous les soins' : section.id === 'skin' ? 'Voir tout' : 'Toutes les routines'} <ArrowRight size={15} /></Link>}
    </div></div>
  </div>;
}

export function MobileNavigationDrawer({ sections, onNavigate }) {
  return <><Link className="gallery-mobile-link" to="/" onClick={onNavigate}>Accueil <ArrowRight size={16} /></Link>
    {sections.map((section) => section.menuType
      ? <MobileNavAccordion key={section.id} section={section} onNavigate={onNavigate} />
      : <Link key={section.id} className="gallery-mobile-link" to={section.href} onClick={onNavigate}>{section.label}<ArrowRight size={16} /></Link>)}
  </>;
}
