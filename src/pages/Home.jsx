import { ArrowRight, Bag, MapPin, ShieldCheck, Sparkle, Truck } from '@phosphor-icons/react';
import { Link } from 'react-router';
import ProductCard from '../components/ProductCard';
import HeroCarousel from '../components/HeroCarousel';
import HomeBrandsSection from '../components/HomeBrandsSection';
import HomeSectionHeading from '../components/HomeSectionHeading';
import { useStore } from '../state/StoreContext';

function ProductSection({ id, title, path, products, eyebrow, className = '', linkLabel = 'Voir toute la sélection' }) {
  if (!products.length) return null;
  return <section className={`selection-section home-section home-products ${className}`} aria-labelledby={id}>
    <HomeSectionHeading id={id} eyebrow={eyebrow} title={title} href={path} linkLabel={linkLabel} compactLabel="Voir tout" />
    <div className="product-grid">{products.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>;
}

function PromotionsSection({ products }) {
  return <section className="selection-section home-section home-products home-promotions" aria-labelledby="home-promotions-title">
    <HomeSectionHeading id="home-promotions-title" eyebrow="Les offres de la Gallery" title="Promotions" href="/promotions" linkLabel="Voir toutes les promos" compactLabel="Voir tout" />
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
  const selectedFeaturedProducts = (home.featured_product_ids || [])
    .map((id) => products.find((item) => String(item.id) === String(id)))
    .filter((item) => item && !(item.compare_at_dh > item.price_dh));
  const featuredProducts = (selectedFeaturedProducts.length
    ? selectedFeaturedProducts
    : products.filter((item) => item.featured && !(item.compare_at_dh > item.price_dh))).slice(0, 4);
  const selectedBrands = (home.featured_brand_slugs || []).map((slug) => brands.find((item) => item.slug === slug)).filter(Boolean);
  const homeBrands = selectedBrands.length ? selectedBrands : brands.slice(0, 8);
  const fallbackEntries = [
    ['01', 'Je cherche un soin', 'Nettoyants, sérums, crèmes, SPF…', '/soins', 'Explorer les soins'],
    ['02', 'Je pars de ma peau', 'Type de peau et besoins', '/peau', 'Trouver mes soins'],
    ['03', 'Je connais ma marque', 'ANUA, COSRX, SKIN1004…', '/marques', 'Voir les marques'],
  ];
  const entries = home.entry_cards?.length === 3 ? home.entry_cards.map((card, index) => [String(index + 1).padStart(2, '0'), card.title, card.description, card.path, card.action]) : fallbackEntries;
  const featuredPack = bundles.find((item) => item.slug === 'ksg-pack-01') || bundles[0];
  return <main id="top">
    <HeroCarousel slides={home.slides} home={home} />

    <HomeBrandsSection brands={homeBrands} />

    <section className="gallery-entry home-section" aria-labelledby="entry-title"><HomeSectionHeading id="entry-title" eyebrow="Trois façons de commencer" title={home.entry_title || 'Entrez dans la Gallery'} />
      <div className="gallery-entry-grid">{entries.map(([number, title, description, path, action]) => <Link key={number} className="gallery-entry-card" to={path}><span className="entry-number">{number}</span><div><h3>{title}</h3><p>{description}</p></div><span className="entry-action">{action} <ArrowRight size={17} /></span></Link>)}</div></section>

    <ProductSection id="home-featured-title" title="Nos incontournables" path="/boutique" eyebrow="La sélection de la Gallery" products={featuredProducts} className="home-mobile-featured" linkLabel="Voir toute la boutique" />
    <PromotionsSection products={promotionProducts} />
    <ProductSection id="home-new-title" title="Nouveautés dans la Gallery" path="/nouveautes" eyebrow="À découvrir" products={newProducts} className="home-new-arrivals" />

    <section className="home-guided home-section"><HomeSectionHeading id="home-routines-title" eyebrow="Le bon geste, simplement" title="Routines & Packs" href="/packs" linkLabel="Voir tous les packs" compactLabel="Voir tout" />
      <div className="home-guided-grid">{routines.filter((item) => (home.featured_routine_slugs || ['simple', 'matin', 'soir']).includes(item.slug)).map((item) => <Link key={item.slug} to={`/routines/${item.slug}`} className="home-guided-card"><Sparkle size={22} /><h3>{item.name}</h3><p>{item.description}</p><span>Découvrir <ArrowRight size={16} /></span></Link>)}{featuredPack && <Link to={`/packs/${featuredPack.slug}`} className="home-guided-card home-pack-card"><Bag size={22} /><h3>{featuredPack.name}</h3><p>{featuredPack.items.length} soins réunis dans un pack.</p><span>Voir le pack <ArrowRight size={16} /></span></Link>}</div>
    </section>
    <section className="bottom-trust" aria-label="Vos achats en confiance">{(home.trust_messages || ['Produits authentiques', 'Livraison partout au Maroc', 'Paiement à la livraison', 'Assistance 7j/7']).map((message, index) => { const Icon = [ShieldCheck, Truck, Bag, MapPin][index]; return <div key={index}><Icon size={20} /><span>{message}</span></div>; })}</section>
  </main>;
}
