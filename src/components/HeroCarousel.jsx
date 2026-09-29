import React, { useEffect, useRef } from 'react';
import { useHeroCarousel } from './useHeroCarousel';
import HeroSlide from './HeroSlide';
import HeroIndicators from './HeroIndicators';
import HeroCopy from './HeroCopy';
import { DEFAULT_HERO_SLIDES } from './heroSlidesData';

export { DEFAULT_HERO_SLIDES };


export default function HeroCarousel({ slides = DEFAULT_HERO_SLIDES, home = {} }) {
  const carouselSlides = slides && slides.length > 0 ? slides : DEFAULT_HERO_SLIDES;
  const {
    activeIndex,
    prevIndex,
    direction,
    isAnimating,
    isPaused,
    prefersReducedMotion,
    goToIndex,
    handleTouchStart,
    handleTouchEnd,
    handleKeyDown,
  } = useHeroCarousel(carouselSlides.length, 4000, 650);

  const containerRef = useRef(null);

  // Preload non-active slides
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
      className={`hero-carousel-container dir-${direction} ${isAnimating ? 'is-animating' : ''} ${isPaused ? 'is-paused' : ''} pos-${activeSlide.mobileTextPosition || 'bottom-left'}`}
      aria-label="Sélections de la Gallery"
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background slide images */}
      <div className="hero-slides-viewport">
        {carouselSlides.map((slide, index) => (
          <HeroSlide
            key={slide.id || index}
            slide={slide}
            index={index}
            isActive={index === activeIndex}
            isPrev={index === prevIndex && isAnimating}
          />
        ))}
      </div>

      {/* Readability gradient */}
      <div className="hero-gradient-overlay" aria-hidden="true" />

      {/* HTML Copy overlay */}
      <div className="hero-copy-overlay">
        <HeroCopy
          key={activeSlide.id || activeIndex}
          slide={activeSlide}
          active={true}
        />
      </div>

      {/* Minimal centered dot/pill indicators inside hero */}
      <HeroIndicators
        count={carouselSlides.length}
        activeIndex={activeIndex}
        onChange={goToIndex}
      />
    </section>
  );
}
