import React from 'react';
import { Link } from 'react-router';
import { ArrowRight } from '@phosphor-icons/react';
import Button from './ui/Button';

export default function HeroCopy({ slide, active = true }) {
  if (!slide) return null;

  return (
    <div
      className={`hero-copy-content ${active ? 'animate-copy' : ''}`}
      aria-hidden={!active}
    >
      {slide.eyebrow && (
        <p className="eyebrow">{slide.eyebrow}</p>
      )}

      <h1 id={active ? 'hero-title' : undefined} aria-label={slide.title.replace(/\n/g, ' ')}>
        <span className="hero-title-desktop" aria-hidden="true">
          {slide.title.split('\n').map((line, idx) => (
          <span key={idx}>
            {line}
            <br />
          </span>
          ))}
        </span>
        <span className="hero-title-mobile" aria-hidden="true">{slide.mobileTitle || slide.title.replace(/\n/g, ' ')}</span>
      </h1>

      {slide.description && (
        <p className="hero-intro">{slide.description}</p>
      )}

      <div className="hero-actions">
        <Button asChild variant="primary" size="lg" className="hero-cta">
          <Link to={slide.primaryHref || '/boutique'} tabIndex={active ? 0 : -1}>
            <span>{slide.primaryLabel || 'Explorer la boutique'}</span>
            <ArrowRight size={18} />
          </Link>
        </Button>

        {slide.secondaryLabel && slide.secondaryHref && (
          <Button asChild variant="outline" size="lg" className="hero-cta-secondary">
            <Link to={slide.secondaryHref} tabIndex={active ? 0 : -1}>
              <span>{slide.secondaryLabel}</span>
              <ArrowRight size={16} />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
