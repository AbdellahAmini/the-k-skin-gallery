import React, { useState } from 'react';
import { useHeroCarousel } from './useHeroCarousel';
import HeroSlide from './HeroSlide';
import HeroIndicators from './HeroIndicators';
import HeroCopy from './HeroCopy';
import { DEFAULT_HERO_SLIDES } from './heroSlidesData';

export { DEFAULT_HERO_SLIDES };


export default function HeroCarousel({ slides = DEFAULT_HERO_SLIDES }) {
  const carouselSlides = slides && slides.length > 0 ? slides : DEFAULT_HERO_SLIDES;
  const [pointerInside, setPointerInside] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const autoplayPaused = pointerInside || focusInside;
  const {
    activeIndex,
    prevIndex,
    direction,
    isAnimating,
    goToIndex,
    handleTouchStart,
    handleTouchEnd,
    handleKeyDown,
  } = useHeroCarousel(carouselSlides.length, 4000, 650, autoplayPaused);

  const activeSlide = carouselSlides[activeIndex];

  return (
    <section
      className={`hero-carousel-container dir-${direction} ${isAnimating ? 'is-animating' : ''} campaign-${activeSlide.id || activeIndex}`}
      aria-label="Sélections de la Gallery"
      aria-roledescription="carousel"
      tabIndex={0}
      onMouseEnter={() => setPointerInside(true)}
      onMouseLeave={() => setPointerInside(false)}
      onFocusCapture={() => setFocusInside(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocusInside(false);
      }}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
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

      <div className="hero-gradient-overlay" aria-hidden="true" />

      <div className="hero-copy-overlay">
        <HeroCopy
          key={activeSlide.id || activeIndex}
          slide={activeSlide}
          active={true}
        />
      </div>

      <HeroIndicators
        count={carouselSlides.length}
        activeIndex={activeIndex}
        onChange={goToIndex}
      />
    </section>
  );
}
