import { Fragment, useEffect, useState } from 'react';
import { ArrowRight, Bag, Check, Heart, List as Menu, MagnifyingGlass, Minus, Package, Phone, Plus, ShieldCheck, Sparkle, Trash, Truck, User, X } from '@phosphor-icons/react';
import { Link, NavLink, useLocation } from 'react-router';
import SearchBox from './SearchBox';
import ProductImage from './ProductImage';
import FreeShippingProgress from './FreeShippingProgress';
import { money } from '../lib/api';
import { useStore } from '../state/StoreContext';
import { buildNavigation, MobileNavigationDrawer, PrimaryNavigation } from './Navigation';

const trustMessages = [
  [Truck, 'Livraison 24–48h partout au Maroc', 'Livraison 24–48h'],
  [Bag, 'Paiement à la livraison', 'COD'],
  [ShieldCheck, 'Produits authentiques', 'Produits authentiques'],
  [Phone, 'Assistance 7j/7', 'Assistance 7j/7'],
];

function TrustTrack({ duplicate = false }) {
  return <div className="trust-track" aria-hidden={duplicate ? 'true' : undefined}>
    {trustMessages.map(([Icon, desktop, mobile]) => <Fragment key={desktop}>
      <span className="trust-item"><Icon size={16} weight="regular" /><span className="trust-desktop-copy">{desktop}</span><span className="trust-mobile-copy">{mobile}</span></span>
      <span className="trust-sparkle" aria-hidden="true">✦</span>
    </Fragment>)}
  </div>;
}

export function Header() {
  const { brands, categories, skinTypes, concerns, routines, bundles, content, settings, cartCount, wishlist, user, setCartOpen } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  useEffect(() => { setMenuOpen(false); setSearchOpen(false); }, [location.pathname]);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 4);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  const navigation = buildNavigation({ brands, categories, skinTypes, concerns, routines, bundles, content });
  return <><header className={`site-header ${scrolled ? 'is-scrolled' : ''} ${searchPanelOpen ? 'is-searching' : ''}`}><div className="header-main"><button className="icon-button mobile-menu-toggle" onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu"><Menu size={23} /></button>
      <Link className="logo-link" to="/" aria-label="K-Skin Gallery, accueil"><img className="brand-logo" src="/assets/gallery-logo.png" alt="K-Skin Gallery — Korean Skincare" /></Link>
      <SearchBox onSearchStateChange={setSearchPanelOpen} /><div className="header-actions"><button className="icon-button mobile-search-toggle" onClick={() => setSearchOpen(true)} aria-label="Ouvrir la recherche"><MagnifyingGlass size={21} /></button><Link className="header-action" to={user ? '/compte' : '/connexion'} aria-label="Compte" title="Compte"><User size={20} /><span>Compte</span></Link>
        <Link className="header-action" to="/favoris" aria-label="Favoris" title="Favoris"><Heart size={20} weight={wishlist.length ? 'fill' : 'regular'} /><span>Favoris</span>{wishlist.length > 0 && <small>{wishlist.length}</small>}</Link>
        <button className="header-action" onClick={() => setCartOpen(true)} aria-label={`Panier, ${cartCount} article${cartCount > 1 ? 's' : ''}`} title="Panier"><span className="bag-wrap"><Bag size={20} /><small>{cartCount}</small></span><span>Panier</span></button></div></div>
      <SearchBox mobile open={searchOpen} onClose={() => setSearchOpen(false)} />
      <PrimaryNavigation sections={navigation} />
      <div className="trust-marquee" aria-label="Nos engagements"><div className="trust-scroller"><TrustTrack /><TrustTrack duplicate /></div></div>
    </header>
    {menuOpen && <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setMenuOpen(false)}><aside className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Menu mobile"><div className="drawer-head"><span>La Gallery</span><button onClick={() => setMenuOpen(false)} aria-label="Fermer le menu"><X size={22} /></button></div>
      <MobileNavigationDrawer sections={navigation} onNavigate={() => setMenuOpen(false)} />
      <Link className="drawer-divider" to="/favoris" onClick={() => setMenuOpen(false)}>Mes favoris <ArrowRight size={15} /></Link>
      <Link to={user ? '/compte' : '/connexion'} onClick={() => setMenuOpen(false)}>Mon compte <ArrowRight size={15} /></Link>
      <Link to="/contact" onClick={() => setMenuOpen(false)}>Contact <ArrowRight size={15} /></Link>{settings.whatsapp_number && <a href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>WhatsApp <ArrowRight size={15} /></a>}</aside></div>}
  </>;
}

export function CartDrawer() {
  const { cartOpen, setCartOpen, cartLines, cartCount, subtotal, changeQuantity, removeFromCart, clearCart, settings } = useStore();
  useEffect(() => {
    if (!cartOpen) return undefined;
    const key = (e) => e.key === 'Escape' && setCartOpen(false);
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [cartOpen, setCartOpen]);
  if (!cartOpen) return null;
  const threshold = Number(settings.free_shipping_threshold_dh || 0);
  return <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setCartOpen(false)}><aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Mon panier"><div className="drawer-head"><div><span>Mon panier</span><small>{cartCount} article{cartCount > 1 ? 's' : ''}</small></div><button onClick={() => setCartOpen(false)} aria-label="Fermer le panier"><X size={22} /></button></div>
    {cartLines.length ? <><div className="cart-drawer-tools"><button type="button" className="cart-clear-button" onClick={clearCart}><Trash size={15} /> Vider le panier</button></div><div className="cart-lines">{cartLines.map(({ item, kind, path, quantity }) => <div className="cart-line" key={`${kind}-${item.id}`}><Link to={path} onClick={() => setCartOpen(false)}><ProductImage src={item.image_url} alt="" /></Link><div className="cart-line-copy"><strong>{kind === 'bundle' ? 'Pack' : item.brand}</strong><Link to={path} onClick={() => setCartOpen(false)}>{item.name}</Link><small>{kind === 'bundle' ? `${item.items.length} soins` : item.size}</small><div className="quantity-control"><button onClick={() => changeQuantity(item.id, -1, kind)} aria-label="Diminuer la quantité"><Minus size={13} /></button><span>{quantity}</span><button disabled={quantity >= item.stock} onClick={() => changeQuantity(item.id, 1, kind)} aria-label="Augmenter la quantité"><Plus size={13} /></button></div><button className="remove-link" onClick={() => removeFromCart(item.id, kind)}>Retirer</button></div><b>{money(item.price_dh * quantity)}</b></div>)}</div>
      <div className="cart-summary"><p><span>Sous-total</span><strong>{money(subtotal)}</strong></p><FreeShippingProgress subtotal={subtotal} threshold={threshold} /><small>Frais de livraison calculés selon votre ville.</small>
        <Link className="button-primary checkout-button" to="/checkout" onClick={() => setCartOpen(false)}>Continuer ma commande <ArrowRight size={17} /></Link><span className="cod-note"><Bag size={15} /> Paiement à la livraison</span></div></>
      : <div className="cart-empty"><Package size={36} /><h3>Votre panier vous attend</h3><p>Découvrez une sélection de soins coréens choisis avec attention.</p><Link className="button-primary" to="/boutique" onClick={() => setCartOpen(false)}>Explorer la sélection</Link></div>}
  </aside></div>;
}

export function Footer() {
  const { settings, content } = useStore();
  const social = [['Instagram', settings.instagram_url], ['TikTok', settings.tiktok_url]].filter(([, url]) => !!url);
  return <footer className="site-footer full-footer"><div className="footer-main"><div><Link className="footer-brand" to="/"><img src="/assets/gallery-logo.png" alt="K-Skin Gallery" /></Link><p>{content.footer?.introduction || 'Une sélection coréenne, tout près de vous.'}</p></div><div><h2>La Gallery</h2>{[['Boutique', '/boutique'], ['Nouveautés', '/nouveautes'], ['Promotions', '/promotions'], ['Marques', '/marques'], ['Routines', '/routines'], ['Packs', '/packs'], ['Conseils', '/conseils']].map(([name, path]) => <Link key={path} to={path}>{name}</Link>)}</div><div><h2>Aide</h2>{[['FAQ', '/faq'], ['Livraison', '/livraison'], ['Retours', '/retours'], ['Contact', '/contact']].map(([name, path]) => <Link key={path} to={path}>{name}</Link>)}</div><div><h2>Informations</h2><Link to="/cgv">Conditions de vente</Link><Link to="/confidentialite">Confidentialité</Link>{social.map(([name, url]) => <a key={name} href={url} target="_blank" rel="noreferrer">{name}</a>)}</div></div><div className="footer-bottom"><span>© 2026 K-Skin Gallery</span><span>{content.footer?.closing_line || 'Paiement à la livraison · Livraison au Maroc · Produits authentiques'}</span></div></footer>;
}

export function BottomNav() {
  const { user } = useStore();
  return <nav className="mobile-tabbar" aria-label="Navigation mobile">{[[Sparkle, 'Accueil', '/'], [Bag, 'Boutique', '/boutique'], [MagnifyingGlass, 'Recherche', '/recherche'], [Heart, 'Favoris', '/favoris'], [User, 'Compte', user ? '/compte' : '/connexion']].map(([Icon, label, path]) => <NavLink key={label} to={path}><Icon size={19} /><span>{label}</span></NavLink>)}</nav>;
}

export function Notice() {
  const { notice, setNotice } = useStore();
  return notice && <div className="toast" role="status"><Check size={17} />{notice}<button onClick={() => setNotice('')} aria-label="Fermer"><X size={15} /></button></div>;
}
