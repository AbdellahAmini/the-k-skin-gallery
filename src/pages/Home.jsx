import { ArrowRight, Bag, MapPin, ShieldCheck, Sparkle, Truck } from '@phosphor-icons/react';
import { Link } from 'react-router';
import ProductCard from '../components/ProductCard';
import HeroCarousel from '../components/HeroCarousel';
import { useStore } from '../state/StoreContext';

function ProductSection({ title, path, products, eyebrow }) {
  if (!products.length) return null;
  return <section className="selection-section"><div className="section-heading"><div><p className="eyebrow section-eyebrow">{eyebrow}</p><h2>{title}</h2></div>
    <Link className="text-link" to={path}>Voir toute la sélection <ArrowRight size={16} /></Link></div>
    <div className="product-grid">{products.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>;
}

export default function Home() {
  const { products, brands, skinTypes, routines, bundles, settings, content } = useStore();
  const home = content.homepage || {};
  const preferredProducts = (home.featured_product_ids || []).map((id) => products.find((item) => item.id === id)).filter(Boolean);
  const featured = (preferredProducts.length ? preferredProducts : products.filter((item) => item.featured)).slice(0, 5);
  const newProducts = products.filter((item) => item.new_arrival).slice(0, 5);
  const selectedBrands = (home.featured_brand_slugs || []).map((slug) => brands.find((item) => item.slug === slug)).filter(Boolean);
  const homeBrands = selectedBrands.length ? selectedBrands : brands.slice(0, 8);
  const threshold = Number(settings.free_shipping_threshold_dh || 0);
  const fallbackEntries = [
    ['01', 'Je cherche un soin', 'Nettoyants, sérums, crèmes, SPF…', '/soins', 'Explorer les soins'],
    ['02', 'Je pars de ma peau', 'Type de peau et besoins', '/peau', 'Trouver mes soins'],
    ['03', 'Je connais ma marque', 'ANUA, COSRX, SKIN1004…', '/marques', 'Voir les marques'],
  ];
  const entries = home.entry_cards?.length === 3 ? home.entry_cards.map((card, index) => [String(index + 1).padStart(2, '0'), card.title, card.description, card.path, card.action]) : fallbackEntries;
  return <main id="top">
    <HeroCarousel slides={home.slides} home={home} />

    <section className="gallery-entry" aria-labelledby="entry-title"><div className="section-heading"><div><p className="eyebrow">Trois façons de commencer</p><h2 id="entry-title">{home.entry_title || 'Entrez dans la Gallery'}</h2></div></div>
      <div className="gallery-entry-grid">{entries.map(([number, title, description, path, action]) => <Link key={number} className="gallery-entry-card" to={path}><span className="entry-number">{number}</span><div><h3>{title}</h3><p>{description}</p></div><span className="entry-action">{action} <ArrowRight size={17} /></span></Link>)}</div></section>

    <ProductSection title="Nos incontournables" path="/incontournables" eyebrow="La sélection de la Gallery" products={featured} />
    <section className="brand-strip" aria-label="Marques coréennes"><p>Nos marques<br />coréennes</p><div className="brand-list">{homeBrands.slice(0, 8).map((brand, index) => <Link key={brand.slug} to={`/marques/${brand.slug}`} className={`brand-name brand-${index}`}>{brand.name}</Link>)}</div><Link className="text-link brand-more" to="/marques">Voir toutes les marques <ArrowRight size={16} /></Link></section>
    <ProductSection title="Nouveautés dans la Gallery" path="/nouveautes" eyebrow="À découvrir" products={newProducts} />

    <section className="home-guided"><div className="section-heading"><div><p className="eyebrow">Le bon geste, simplement</p><h2>Routines & Packs</h2></div><Link className="text-link" to="/routines">Voir toutes les routines <ArrowRight size={16} /></Link></div>
      <div className="home-guided-grid">{routines.filter((item) => (home.featured_routine_slugs || ['simple', 'matin', 'soir']).includes(item.slug)).map((item) => <Link key={item.slug} to={`/routines/${item.slug}`} className="home-guided-card"><Sparkle size={22} /><h3>{item.name}</h3><p>{item.description}</p><span>Découvrir <ArrowRight size={16} /></span></Link>)}{bundles.slice(0, 1).map((item) => <Link key={item.slug} to={`/packs/${item.slug}`} className="home-guided-card home-pack-card"><Bag size={22} /><h3>{item.name}</h3><p>{item.items.length} soins réunis dans un pack.</p><span>Voir le pack <ArrowRight size={16} /></span></Link>)}</div>
    </section>
    <section className="home-discovery skin-discovery"><div className="section-heading"><h2>Choisir selon sa peau</h2><Link className="text-link" to="/peau">Types de peau & besoins <ArrowRight size={16} /></Link></div><div className="discovery-grid">{skinTypes.filter((item) => item.slug !== 'peau-normale').map((item) => <Link key={item.slug} className="discovery-tile" to={`/type-de-peau/${item.slug}`}><span>{item.name}</span><ArrowRight size={17} /></Link>)}</div></section>
    <section className="promo-band"><div><p className="eyebrow">Une attention pour votre routine</p><h2>{home.promotion_title || (threshold ? `Livraison offerte dès ${threshold} DH.` : 'De belles découvertes, à votre rythme.')}</h2></div><Link className="button-primary" to={home.promotion_title ? home.promotion_cta_path : threshold ? '/boutique' : '/promotions'}>{home.promotion_title ? home.promotion_cta_label : threshold ? 'Explorer la sélection' : 'Voir les promotions'} <ArrowRight size={17} /></Link></section>
    <section className="bottom-trust" aria-label="Vos achats en confiance">{(home.trust_messages || ['Produits authentiques', 'Livraison partout au Maroc', 'Paiement à la livraison', 'Assistance 7j/7']).map((message, index) => { const Icon = [ShieldCheck, Truck, Bag, MapPin][index]; return <div key={index}><Icon size={20} /><span>{message}</span></div>; })}</section>
  </main>;
}
