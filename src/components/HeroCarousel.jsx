import React, { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Bag, MapPin, ShieldCheck, Truck } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { useHeroCarousel } from './useHeroCarousel';

export const DEFAULT_HERO_SLIDES = [
  {
    id: 'hero-1',
    imageDesktop: '/assets/wallpapers/gallery-hero2.png',
    imageMobile: '/assets/wallpapers/gallery-hero2.png',
    alt: 'Sélection complète de soins coréens pour une peau éclatante',
    eyebrow: 'BEAUTÉ CORÉENNE · SÉLECTION EXCLUSIVE',
    title: 'Vos essentiels\nK-Beauty, réunis\nau Maroc.',
    subtitle: 'Une sélection haut de gamme de soins coréens authentiques pour révéler l’éclat naturel de votre peau.',
    primaryCTA: 'Explorer la boutique',
    primaryHref: '/boutique',
    secondaryCTA: 'Découvrir les soins',
    secondaryHref: '/soins',
    focalPointDesktop: '50% 55%',
    focalPointMobile: '59% center'
  },
  {
    id: 'hero-2',
    imageDesktop: '/assets/wallpapers/melange.png',
    imageMobile: '/assets/wallpapers/melange.png',
    alt: 'Routines et coffrets de soins pour le visage',
    eyebrow: 'ROUTINES & PACKS HYDRATANTS',
    title: 'Routines ciblées\npour un teint\nradiant & unifié.',
    subtitle: 'Des soins complémentaires soigneusement associés pour réparer, apaiser et hydrater durablement votre peau.',
    primaryCTA: 'Découvrir les routines',
    primaryHref: '/routines',
    secondaryCTA: 'Voir les coffrets',
    secondaryHref: '/packs',
    focalPointDesktop: '50% 50%',
    focalPointMobile: '50% 50%'
  },
  {
    id: 'hero-3',
    imageDesktop: '/assets/wallpapers/anua-wallpaper.png',
    imageMobile: '/assets/wallpapers/anua-wallpaper.png',
    alt: 'Sérums et élixirs apaisants pour le visage',
    eyebrow: 'SÉRUMS & SOINS CONCENTRÉS',
    title: 'Des formules d’exception\npour apaiser &\nilluminer la peau.',
    subtitle: 'Des soins hautement concentrés en actifs botaniques pour régénérer et renforcer la barrière cutanée.',
    primaryCTA: 'Voir les sérums',
    primaryHref: '/soins/serums',
    secondaryCTA: 'Explorer la boutique',
    secondaryHref: '/boutique',
    focalPointDesktop: '50% 50%',
    focalPointMobile: '50% 50%'
  }
];

export default function HeroCarousel({ slides = DEFAULT_HERO_SLIDES, home = {} }) {
  const carouselSlides = slides && slides.length > 0 ? slides : DEFAULT_HERO_SLIDES;
  const {
    activeIndex,
    prevIndex,
    direction,
    isAnimating,
    isPaused,
    prefersReducedMotion,
    goTo,
    next,
    prev,
    triggerPause,
    setIsPaused,
    handleTouchStart,
    handleTouchEnd,
    handleKeyDown,
  } = useHeroCarousel(carouselSlides.length, 5000, 3500);

  const containerRef = useRef(null);

  // Preload images for non-active slides
  useEffect(() => {
    carouselSlides.forEach((slide) => {
      if (slide.imageDesktop) {
        const img = new Image();
        img.src = slide.imageDesktop;
      }
    });
  }, [carouselSlides]);

  const activeSlide = carouselSlides[activeIndex];

  return (
    <section
      ref={containerRef}
      className="hero-carousel-container"
      aria-label="Galerie des sélections hero"
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="hero-slides-viewport">
        {carouselSlides.map((slide, index) => {
          const isActive = index === activeIndex;
          const isPrev = index === prevIndex && isAnimating;
          const isHidden = !isActive && !isPrev;

          let slideClass = 'hero-slide';
          if (isActive) slideClass += ' active';
          if (isPrev) slideClass += ' exiting';

          return (
            <div
              key={slide.id || index}
              className={slideClass}
              aria-hidden={!isActive}
              aria-label={`Diapositive ${index + 1} sur ${carouselSlides.length}`}
            >
              <picture className="hero-picture-wrap">
                {slide.imageMobile && (
                  <source media="(max-width: 760px)" srcSet={slide.imageMobile} />
                )}
                <img
                  className="hero-slide-image"
                  src={slide.imageDesktop}
                  alt={slide.alt || slide.title}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  style={{
                    objectPosition:
                      typeof window !== 'undefined' && window.innerWidth <= 760
                        ? slide.focalPointMobile || 'center'
                        : slide.focalPointDesktop || 'center',
                  }}
                />
              </picture>
            </div>
          );
        })}
      </div>

      {/* HTML Copy overlay */}
      <div className="hero-copy-overlay">
        <div key={activeSlide.id || activeIndex} className="hero-copy-content animate-copy">
          <p className="eyebrow">{activeSlide.eyebrow || home.hero_eyebrow || 'Beauté coréenne · sélectionnée pour le Maroc'}</p>
          <h1 id="hero-title">
            {(activeSlide.title || home.hero_title || 'Vos essentiels\nK-Beauty, réunis\nau Maroc.')
              .split('\n')
              .map((line, idx) => (
                <span key={idx}>
                  {line}
                  <br />
                </span>
              ))}
          </h1>
          <p className="hero-intro">
            {activeSlide.subtitle || home.hero_intro || 'Des marques coréennes authentiques pour une peau éclatante, au quotidien.'}
          </p>

          <div className="hero-actions">
            <Link className="button-primary hero-cta" to={activeSlide.primaryHref || home.hero_cta_path || '/boutique'}>
              {activeSlide.primaryCTA || home.hero_cta_label || 'Explorer la sélection'} <ArrowRight size={18} />
            </Link>
            {activeSlide.secondaryCTA && (
              <Link className="button-outline hero-cta-secondary" to={activeSlide.secondaryHref || '/marques'}>
                {activeSlide.secondaryCTA} <ArrowRight size={16} />
              </Link>
            )}
          </div>

          <div className="hero-promises">
            <div>
              <Truck size={22} />
              <span>
                <b>Livraison 24–48h</b>
                <small>partout au Maroc</small>
              </span>
            </div>
            <i />
            <div>
              <Bag size={21} />
              <span>
                <b>Paiement à la livraison</b>
                <small>simple et sécurisé</small>
              </span>
            </div>
            <i />
            <div>
              <ShieldCheck size={22} />
              <span>
                <b>Produits authentiques</b>
                <small>marques officielles</small>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Editorial Controls & Progress Bar */}
      <div className="hero-controls-bar">
        <div className="hero-indicator">
          <span className="hero-badge-tag">GALLERY / {String(activeIndex + 1).padStart(2, '0')}</span>
          <div className="hero-progress-track">
            <div
              key={activeIndex + '-' + (isPaused ? 'paused' : 'active')}
              className={`hero-progress-fill ${isPaused || prefersReducedMotion ? 'paused' : 'running'}`}
            />
          </div>
          <span className="hero-total-count">{String(carouselSlides.length).padStart(2, '0')}</span>
        </div>

        <div className="hero-arrows">
          <button
            className="hero-arrow-btn"
            onClick={() => {
              triggerPause();
              prev();
            }}
            aria-label="Image précédente"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            className="hero-arrow-btn"
            onClick={() => {
              triggerPause();
              next();
            }}
            aria-label="Image suivante"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <span className="hero-caption">Une peau plus heureuse, chaque jour</span>
    </section>
  );
}
