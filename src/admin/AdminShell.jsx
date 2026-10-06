import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Link, useLocation } from 'react-router';
import { ArrowSquareOut, Bell, ChartBar, CheckCircle, ClipboardText, Cube, GearSix, House, List, ListChecks, Package, SidebarSimple, SquaresFour, Tag, Truck, Users, X } from '@phosphor-icons/react';

const navigation = [
  { label: 'Vue générale', items: [
    { label: 'Tableau de bord', path: '/admin', icon: House },
    { label: 'Commandes', path: '/admin/commandes', icon: ClipboardText },
  ] },
  { label: 'Catalogue', items: [
    { label: 'Produits', path: '/admin/catalogue/produits', icon: Package },
    { label: 'Marques', path: '/admin/catalogue/marques', icon: Tag },
    { label: 'Types de soin', path: '/admin/catalogue/types-de-soin', icon: SquaresFour },
    { label: 'Sous-types', path: '/admin/catalogue/sous-types-de-soin', icon: SquaresFour },
    { label: 'Types de peau', path: '/admin/catalogue/types-de-peau', icon: CheckCircle },
    { label: 'Besoins', path: '/admin/catalogue/besoins', icon: CheckCircle },
    { label: 'Ingrédients', path: '/admin/catalogue/ingredients', icon: Tag },
    { label: 'Routines', path: '/admin/catalogue/routines', icon: ListChecks },
    { label: 'Packs', path: '/admin/catalogue/packs', icon: Cube },
  ] },
  { label: 'Gestion', items: [
    { label: 'Stock', path: '/admin/stock', icon: ChartBar },
    { label: 'Promotions', path: '/admin/promotions', icon: Tag },
    { label: 'Livraison', path: '/admin/livraison', icon: Truck },
    { label: 'Clients', path: '/admin/clients', icon: Users },
    { label: 'Avis', path: '/admin/avis', icon: CheckCircle },
    { label: 'Alertes stock', path: '/admin/alertes-stock', icon: Bell },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell },
  ] },
  { label: 'Contenu', items: [
    { label: 'Homepage', path: '/admin/contenu/homepage', icon: House },
    { label: 'FAQ', path: '/admin/contenu/faq', icon: ClipboardText },
    { label: 'Conseils', path: '/admin/contenu/conseils', icon: ClipboardText },
    { label: 'Menus', path: '/admin/contenu/menus', icon: ListChecks },
    { label: 'Footer', path: '/admin/contenu/footer', icon: ClipboardText },
  ] },
  { label: 'Configuration', items: [ { label: 'Paramètres', path: '/admin/parametres', icon: GearSix } ] },
];

function NavItems({ collapsed, onNavigate }) {
  const { pathname } = useLocation();
  return <nav className="admin-v2-nav" aria-label="Navigation administration">
    {navigation.map((group) => <section className="admin-v2-nav-group" key={group.label}>
      {!collapsed && <h2>{group.label}</h2>}
      {group.items.map(({ label, path, icon: Icon }) => {
        const active = path === '/admin' ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
        const link = <Link key={path} to={path} onClick={onNavigate} className={`admin-v2-nav-link${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
          <Icon size={19} weight={active ? 'fill' : 'regular'} /><span>{label}</span>
        </Link>;
        return collapsed ? <Tooltip.Root key={path} delayDuration={250}><Tooltip.Trigger asChild>{link}</Tooltip.Trigger><Tooltip.Portal><Tooltip.Content className="admin-v2-tooltip" side="right" sideOffset={9}>{label}<Tooltip.Arrow className="admin-v2-tooltip-arrow" /></Tooltip.Content></Tooltip.Portal></Tooltip.Root> : link;
      })}
    </section>)}
  </nav>;
}

function SidebarContent({ collapsed, mobile = false, onNavigate }) {
  return <>
    <Link className={`admin-v2-brand${collapsed ? ' is-collapsed' : ''}`} to="/admin" onClick={onNavigate} aria-label="The K-Skin Gallery admin">
      <span className="admin-v2-brand-mark">G</span>{!collapsed && <span><strong>THE K-SKIN</strong><b>GALLERY</b><small>ADMINISTRATION</small></span>}
    </Link>
    <NavItems collapsed={collapsed} onNavigate={onNavigate} />
    <Link className="admin-v2-store-link" to="/" onClick={onNavigate}><ArrowSquareOut size={17} />{!collapsed && <span>Voir la boutique</span>}</Link>
  </>;
}

export function AdminShell({ children, user }) {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('gallery-admin-sidebar') === 'collapsed');
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    localStorage.setItem('gallery-admin-sidebar', collapsed ? 'collapsed' : 'expanded');
  }, [collapsed]);
  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b' && !event.target.closest('input,textarea,[contenteditable="true"]')) {
        event.preventDefault();
        setCollapsed((current) => !current);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  const currentTitle = navigation.flatMap((group) => group.items).find(({ path }) => path === '/admin' ? pathname === path : pathname === path || pathname.startsWith(`${path}/`))?.label || 'Administration';
  return <Tooltip.Provider delayDuration={250}>
    <div className={`admin-v2-shell${collapsed ? ' is-collapsed' : ''}`}>
      <aside className="admin-v2-sidebar"><SidebarContent collapsed={collapsed} /></aside>
      <div className="admin-v2-workspace">
        <header className="admin-v2-topbar">
          <button type="button" className="admin-v2-mobile-trigger" aria-label="Ouvrir la navigation" onClick={() => setMobileOpen(true)}><List size={21} /></button>
          <button type="button" className="admin-v2-collapse-trigger" title="Réduire ou développer la navigation (Ctrl/Cmd+B)" aria-label="Réduire ou développer la navigation" onClick={() => setCollapsed((value) => !value)}><SidebarSimple size={20} /></button>
          <div className="admin-v2-top-title"><span>ADMINISTRATION</span><strong>{currentTitle}</strong></div>
          <div className="admin-v2-top-actions"><Link to="/" className="admin-v2-view-store"><ArrowSquareOut size={16} /> Boutique</Link><div className="admin-v2-user"><span className="admin-v2-avatar">{(user?.first_name || user?.email || 'A').slice(0, 1).toUpperCase()}</span><span><strong>{user?.first_name || 'Administrateur'}</strong><small>Accès admin</small></span></div></div>
        </header>
        <main className="admin-v2-scroll" key={pathname}>{children}</main>
      </div>
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal><Dialog.Overlay className="admin-v2-mobile-overlay" /><Dialog.Content className="admin-v2-mobile-sheet">
          <div className="admin-v2-mobile-head"><Dialog.Title>Administration</Dialog.Title><Dialog.Close className="admin-v2-close" aria-label="Fermer la navigation"><X size={20} /></Dialog.Close></div>
          <div className="admin-v2-mobile-nav"><SidebarContent collapsed={false} mobile onNavigate={() => setMobileOpen(false)} /></div>
        </Dialog.Content></Dialog.Portal>
      </Dialog.Root>
    </div>
  </Tooltip.Provider>;
}
