import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from '@phosphor-icons/react';

export const BRAND_ASSETS = {
  anua: { logo: '/assets/brands/anua.png', name: 'ANUA', order: 1 },
  cosrx: { logo: '/assets/brands/cosrx.png', name: 'COSRX', order: 2 },
  'beauty-of-joseon': { logo: '/assets/brands/beauty-of-joseon.png', name: 'Beauty of Joseon', order: 3 },
  skin1004: { logo: '/assets/brands/skin1004.png', name: 'SKIN1004', order: 4 },
  medicube: { logo: '/assets/brands/medicube.svg', name: 'Medicube', order: 5 },
  'axis-y': { logo: '/assets/brands/axis-y.png', name: 'AXIS-Y', order: 6 },
  'dr-althea': { logo: '/assets/brands/dr-althea.png', name: 'Dr. Althea', order: 7 },
  torriden: { logo: '/assets/brands/torriden.png', name: 'Torriden', order: 8 },
  biodance: { logo: '/assets/brands/biodance.svg', name: 'Biodance', order: 9 },
  'some-by-mi': { logo: '/assets/brands/some-by-mi.png', name: 'SOME BY MI', order: 10 },
  arencia: { logo: '/assets/brands/arencia.png', name: 'Arencia', order: 11 },
  celimax: { logo: '/assets/brands/celimax.png', name: 'celimax', order: 12 },
  numbuzin: { logo: '/assets/brands/numbuzin.png', name: 'numbuzin', order: 13 },
  'dr-melaxin': { logo: '/assets/brands/dr-melaxin.png', name: 'Dr.Melaxin', order: 14 },
  'mary-may': { logo: '/assets/brands/mary-may.png', name: 'Mary&May', order: 15 },
  innisfree: { logo: '/assets/brands/innisfree.png', name: 'Innisfree', order: 16 },
  laneige: { logo: '/assets/brands/laneige.png', name: 'Laneige', order: 17 },
};

export function BrandLogoLink({ brand, isDuplicate = false }) {
  const [hasError, setHasError] = useState(false);
  const logoUrl = !hasError ? (brand.logoUrl || BRAND_ASSETS[brand.slug]?.logo) : null;

  return (
    <Link
      to={`/marques/${brand.slug}`}
      className="home-brands__logo-item"
      tabIndex={isDuplicate ? -1 : undefined}
      aria-label={brand.name}
    >
      <div className="home-brands__logo-slot">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={brand.name}
            className="home-brands__logo-img"
            loading="eager"
            onError={() => setHasError(true)}
          />
        ) : (
          <span className="home-brands__logo-fallback">{brand.name}</span>
        )}
      </div>
    </Link>
  );
}

export function BrandsMarquee({ brands }) {
  return (
    <div className="home-brands__marquee" aria-label="Défilement des marques">
      <div className="home-brands__marquee-track">
        <div className="home-brands__marquee-group">
          {brands.map((brand) => (
            <BrandLogoLink key={`track-a-${brand.slug}`} brand={brand} isDuplicate={false} />
          ))}
        </div>
        <div className="home-brands__marquee-group" aria-hidden="true">
          {brands.map((brand) => (
            <BrandLogoLink key={`track-b-${brand.slug}`} brand={brand} isDuplicate={true} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomeBrandsSection({ brands = [] }) {
  // Normalize and sort brands data
  const normalizedBrands = (() => {
    if (!brands || brands.length === 0) {
      // Return default curated list from registry
      return Object.entries(BRAND_ASSETS)
        .sort((a, b) => a[1].order - b[1].order)
        .map(([slug, meta]) => ({
          id: slug,
          slug,
          name: meta.name,
          logoUrl: meta.logo,
          featured: true,
          homepageOrder: meta.order,
          active: true,
        }));
    }

    // Map provided brands and merge with asset registry
    const mapped = brands.map((b, idx) => {
      const meta = BRAND_ASSETS[b.slug];
      return {
        id: b.id || b.slug,
        slug: b.slug,
        name: meta?.name || b.name,
        logoUrl: b.logoUrl || meta?.logo || null,
        featured: b.featured !== false,
        homepageOrder: b.homepageOrder ?? meta?.order ?? (idx + 10),
        active: b.active !== false,
      };
    });

    // Make sure we have a generous list of key houses for the infinite track
    const existingSlugs = new Set(mapped.map((b) => b.slug));
    const extraHouses = Object.entries(BRAND_ASSETS)
      .filter(([slug]) => !existingSlugs.has(slug))
      .map(([slug, meta]) => ({
        id: slug,
        slug,
        name: meta.name,
        logoUrl: meta.logo,
        featured: false,
        homepageOrder: meta.order + 20,
        active: true,
      }));

    return [...mapped, ...extraHouses].sort((a, b) => a.homepageOrder - b.homepageOrder);
  })();

  return (
    <section className="home-brands" aria-labelledby="home-brands-title">
      <div className="home-brands__header">
        <div className="home-brands__title-group">
          <span className="home-brands__eyebrow">LA SÉLECTION DE LA GALLERY</span>
          <h2 id="home-brands-title" className="home-brands__heading">
            <span className="home-brands__heading-accent" aria-hidden="true" />
            Nos marques coréennes
          </h2>
        </div>

        <Link to="/marques" className="home-brands__cta">
          <span className="home-brands__cta-text-full">Voir toutes les marques</span>
          <span className="home-brands__cta-text-short">Voir tout</span>
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>

      <BrandsMarquee brands={normalizedBrands} />
    </section>
  );
}
