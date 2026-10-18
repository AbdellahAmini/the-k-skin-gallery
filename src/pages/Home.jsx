import { ArrowRight, Bag, MapPin, ShieldCheck, Truck } from '@phosphor-icons/react';
import { Link } from 'react-router';
import ProductCard from '../components/ProductCard';
import HeroCarousel from '../components/HeroCarousel';
import HomeBrandsSection from '../components/HomeBrandsSection';
import HomeSectionHeading from '../components/HomeSectionHeading';
import HomeGuidedRail from '../components/HomeGuidedRail';
import { useStore } from '../state/StoreContext';

const isOffer = (product) => product.price_dh > 0 && product.compare_at_dh > product.price_dh;

function ProductSection({ id, title, path, products, eyebrow, className = '', linkLabel }) {
  if (!products.length) return null;
  return <section className={`home-section home-products ${className}`} aria-labelledby={id}>
    <div className="home-section__inner">
      <HomeSectionHeading id={id} eyebrow={eyebrow} title={title} href={path} linkLabel={linkLabel} compactLabel="Voir tout" />
      <div className="product-grid">{products.map((item) => <ProductCard key={item.id} product={item} />)}</div>
    </div>
  </section>;
}

export default function Home() {
  const { products, brands, routines, bundles, content } = useStore();
  const home = content.homepage || {};
  const curatedIds = home.featured_product_ids || [];
  const curated = curatedIds.map((id) => products.find((item) => String(item.id) === String(id))).filter(Boolean);
  const featuredFallback = products.filter((item) => item.featured && item.price_dh > 0);
  const favorites = [...new Map([...curated, ...featuredFallback].filter((item) => item.price_dh > 0).map((item) => [item.id, item])).values()].slice(0, 6);
  const favoriteIds = new Set(favorites.map((item) => item.id));
  const offers = products.filter((item) => isOffer(item) && !favoriteIds.has(item.id)).slice(0, 5);
  const selectedBrands = (home.featured_brand_slugs || []).map((slug) => brands.find((item) => item.slug === slug && item.active !== false)).filter(Boolean);
  const homeBrands = selectedBrands.length ? selectedBrands : brands.filter((item) => item.active !== false).slice(0, 10);
  const entries = [
    ['01', 'Je cherche un soin', 'Nettoyants, sérums, crèmes, SPF...', '/soins', 'Explorer les soins'],
    ['02', 'Je pars de ma peau', 'Type de peau et besoins', '/peau', 'Trouver mes soins'],
    ['03', 'Je connais ma marque', 'ANUA, COSRX, SKIN1004...', '/marques', 'Voir les marques'],
  ];
  const featuredPack = bundles.find((item) => item.slug === 'ksg-pack-01') || bundles[0];
  const routineCards = routines
    .filter((item) => (home.featured_routine_slugs || ['simple', 'matin', 'soir']).includes(item.slug))
    .map((item) => ({ ...item, href: `/routines/${item.slug}`, kind: 'routine' }));
  if (featuredPack) routineCards.push({
    slug: featuredPack.slug,
    name: featuredPack.name,
    description: `${featuredPack.items.length} soins réunis dans un pack.`,
    href: `/packs/${featuredPack.slug}`,
    kind: 'pack',
  });

  return <main id="top">
    <HeroCarousel slides={home.slides} />
    <HomeBrandsSection brands={homeBrands} />

    <section className="gallery-entry home-section" aria-labelledby="entry-title">
      <div className="home-section__inner">
        <HomeSectionHeading id="entry-title" eyebrow="Trois façons de commencer" title="Entrez dans la Gallery" />
        <div className="gallery-entry-grid">{entries.map(([number, title, description, path, action]) => <Link key={number} className="gallery-entry-card" to={path} aria-label={`${title}. ${description} ${action}`}>
          <span className="entry-number">{number}</span>
          <div><h3>{title}</h3><p>{description}</p></div>
          <span className="entry-action">{action}<ArrowRight size={17} aria-hidden="true" /></span>
        </Link>)}</div>
      </div>
    </section>

    <ProductSection id="home-favorites-title" title="Les favoris de la Gallery" path="/boutique" eyebrow="La sélection de la Gallery" products={favorites} className="home-favorites" linkLabel="Voir toute la sélection" />
    <ProductSection id="home-offers-title" title="Offres de lancement" path="/promotions" eyebrow="Les offres de la Gallery" products={offers} className="home-offers" linkLabel="Voir toutes les offres" />

    {routineCards.length > 0 && <section className="home-guided home-section" aria-labelledby="home-routines-title">
      <div className="home-section__inner">
        <HomeSectionHeading id="home-routines-title" eyebrow="Le bon geste, simplement" title="Routines & Packs" href="/routines" linkLabel="Voir tout" compactLabel="Voir tout" />
        <HomeGuidedRail items={routineCards} />
      </div>
    </section>}
    <section className="bottom-trust" aria-label="Vos achats en confiance"><div className="bottom-trust__inner">{['Produits authentiques', 'Livraison partout au Maroc', 'Paiement à la livraison', 'Assistance 7j/7'].map((message, index) => { const Icon = [ShieldCheck, Truck, Bag, MapPin][index]; return <div key={message}><Icon size={20} /><span>{message}</span></div>; })}</div></section>
  </main>;
}
