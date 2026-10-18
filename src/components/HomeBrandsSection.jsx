import { useState } from 'react';
import { Link } from 'react-router';
import useMarqueeSpeed from '../hooks/useMarqueeSpeed';
import HomeSectionHeading from './HomeSectionHeading';

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
      <span className="home-brands__name">{brand.name}</span>
    </Link>
  );
}

export function BrandsMarquee({ brands }) {
  const marqueeRef = useMarqueeSpeed({ durationSeconds: 31 });
  return (
    <div className="home-brands__marquee" aria-label="Défilement des marques">
      <div ref={marqueeRef} className="home-brands__marquee-track">
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
  const normalizedBrands = brands
    .filter((brand) => brand.active !== false)
    .map((b, idx) => {
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

  if (!normalizedBrands.length) return null;

  return (
    <section className="home-brands home-section" aria-labelledby="home-brands-title">
      <HomeSectionHeading id="home-brands-title" eyebrow="La sélection de la Gallery" title="Nos marques coréennes"
        href="/marques" linkLabel="Voir toutes les marques" compactLabel="Voir tout"
        className="home-brands__header" titleClassName="home-brands__heading" eyebrowClassName="home-brands__eyebrow" linkClassName="home-brands__cta" />

      <BrandsMarquee brands={normalizedBrands} />
    </section>
  );
}
