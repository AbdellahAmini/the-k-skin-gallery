import React from 'react';
import { Link } from 'react-router';
import { ArrowRight } from '@phosphor-icons/react';

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

      <h1 id={active ? 'hero-title' : undefined}>
        {slide.title.split('\n').map((line, idx) => (
          <span key={idx}>
            {line}
            <br />
          </span>
        ))}
      </h1>

      {slide.description && (
        <p className="hero-intro">{slide.description}</p>
      )}

      <div className="hero-actions">
        <Link
          className="hero-cta"
          to={slide.primaryHref || '/boutique'}
          tabIndex={active ? 0 : -1}
        >
          <span>{slide.primaryLabel || 'Explorer la boutique'}</span>
          <ArrowRight size={18} />
        </Link>

        {slide.secondaryLabel && slide.secondaryHref && (
          <Link
            className="hero-cta-secondary"
            to={slide.secondaryHref}
            tabIndex={active ? 0 : -1}
          >
            <span>{slide.secondaryLabel}</span>
            <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}
