import { ArrowRight, Bag, MapPin, ShieldCheck, Sparkle, Truck } from '@phosphor-icons/react';
import { Link } from 'react-router';
import ProductCard from '../components/ProductCard';
import HeroCarousel from '../components/HeroCarousel';
import HomeBrandsSection from '../components/HomeBrandsSection';
import { useStore } from '../state/StoreContext';

function ProductSection({ title, path, products, eyebrow }) {
  if (!products.length) return null;
  return <section className="selection-section"><div className="section-heading"><div><p className="eyebrow section-eyebrow">{eyebrow}</p><h2>{title}</h2></div>
    <Link className="text-link" to={path}>Voir toute la sélection <ArrowRight size={16} /></Link></div>
    <div className="product-grid">{products.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>;
}

function PromotionsSection({ products }) {
  return <section className="selection-section home-promotions" aria-labelledby="home-promotions-title">
    <div className="section-heading"><div><p className="eyebrow section-eyebrow">Les offres de la Gallery</p><h2 id="home-promotions-title">Promotions</h2></div>
      <Link className="text-link" to="/promotions">Voir toutes les promos <ArrowRight size={16} /></Link></div>
    {products.length
      ? <div className="product-grid">{products.map((item) => <ProductCard key={item.id} product={item} />)}</div>
      : <div className="home-promotions-empty"><Sparkle size={22} /><p>De nouvelles offres arrivent bientôt dans la Gallery.</p></div>}
  </section>;
}

export default function Home() {
  const { products, brands, routines, bundles, content } = useStore();
  const home = content.homepage || {};
  const promotionProducts = products.filter((item) => item.price_dh > 0 && item.compare_at_dh > item.price_dh).slice(0, 10);
  const newProducts = products.filter((item) => item.new_arrival && !(item.compare_at_dh > item.price_dh)).slice(0, 5);
  const selectedBrands = (home.featured_brand_slugs || []).map((slug) => brands.find((item) => item.slug === slug)).filter(Boolean);
  const homeBrands = selectedBrands.length ? selectedBrands : brands.slice(0, 8);
  const fallbackEntries = [
    ['01', 'Je cherche un soin', 'Nettoyants, sérums, crèmes, SPF…', '/soins', 'Explorer les soins'],
    ['02', 'Je pars de ma peau', 'Type de peau et besoins', '/peau', 'Trouver mes soins'],
    ['03', 'Je connais ma marque', 'ANUA, COSRX, SKIN1004…', '/marques', 'Voir les marques'],
  ];
  const entries = home.entry_cards?.length === 3 ? home.entry_cards.map((card, index) => [String(index + 1).padStart(2, '0'), card.title, card.description, card.path, card.action]) : fallbackEntries;
  return <main id="top">
    <HeroCarousel slides={home.slides} home={home} />

    <HomeBrandsSection brands={homeBrands} />

    <section className="gallery-entry" aria-labelledby="entry-title"><div className="section-heading"><div><p className="eyebrow">Trois façons de commencer</p><h2 id="entry-title">{home.entry_title || 'Entrez dans la Gallery'}</h2></div></div>
      <div className="gallery-entry-grid">{entries.map(([number, title, description, path, action]) => <Link key={number} className="gallery-entry-card" to={path}><span className="entry-number">{number}</span><div><h3>{title}</h3><p>{description}</p></div><span className="entry-action">{action} <ArrowRight size={17} /></span></Link>)}</div></section>

    <PromotionsSection products={promotionProducts} />
    <ProductSection title="Nouveautés dans la Gallery" path="/nouveautes" eyebrow="À découvrir" products={newProducts} />

    <section className="home-guided"><div className="section-heading"><div><p className="eyebrow">Le bon geste, simplement</p><h2>Routines & Packs</h2></div><Link className="text-link" to="/routines">Voir toutes les routines <ArrowRight size={16} /></Link></div>
      <div className="home-guided-grid">{routines.filter((item) => (home.featured_routine_slugs || ['simple', 'matin', 'soir']).includes(item.slug)).map((item) => <Link key={item.slug} to={`/routines/${item.slug}`} className="home-guided-card"><Sparkle size={22} /><h3>{item.name}</h3><p>{item.description}</p><span>Découvrir <ArrowRight size={16} /></span></Link>)}{bundles.slice(0, 1).map((item) => <Link key={item.slug} to={`/packs/${item.slug}`} className="home-guided-card home-pack-card"><Bag size={22} /><h3>{item.name}</h3><p>{item.items.length} soins réunis dans un pack.</p><span>Voir le pack <ArrowRight size={16} /></span></Link>)}</div>
    </section>
    <section className="bottom-trust" aria-label="Vos achats en confiance">{(home.trust_messages || ['Produits authentiques', 'Livraison partout au Maroc', 'Paiement à la livraison', 'Assistance 7j/7']).map((message, index) => { const Icon = [ShieldCheck, Truck, Bag, MapPin][index]; return <div key={index}><Icon size={20} /><span>{message}</span></div>; })}</section>
  </main>;
}
