import React from 'react';

export default function HeroSlide({ slide, index, isActive, isPrev }) {
  let slideClass = 'hero-slide';
  if (isActive) slideClass += ' active';
  if (isPrev) slideClass += ' exiting';

  return (
    <div
      className={slideClass}
      aria-hidden={!isActive}
      aria-label={`Diapositive ${index + 1}`}
    >
      <picture className="hero-picture-wrap">
        {slide.imageMobile && (
          <source media="(max-width: 768px)" srcSet={slide.imageMobile} />
        )}
        <img
          className="hero-slide-image"
          src={slide.imageDesktop}
          alt={slide.alt || slide.title?.replace(/\n/g, ' ')}
          loading={index === 0 ? 'eager' : 'lazy'}
          fetchPriority={index === 0 ? 'high' : 'auto'}
          style={{
            '--focal-desktop': slide.focalPointDesktop || '68% 50%',
            '--focal-mobile': slide.focalPointMobile || '72% 45%',
          }}
        />
      </picture>
    </div>
  );
}
