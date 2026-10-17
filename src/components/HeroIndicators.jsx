import React from 'react';
import Button from './ui/Button';

export default function HeroIndicators({ count, activeIndex, onChange }) {
  if (count <= 1) return null;

  return (
    <nav className="hero-indicators" aria-label="Sélection des diapositives">
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === activeIndex;
        return (
          <Button
            key={index}
            type="button"
            variant="ghost"
            size="icon"
            className={`hero-dot-btn ${isActive ? 'active' : ''}`}
            onClick={() => onChange(index)}
            aria-label={`Afficher la diapositive ${index + 1}`}
            aria-current={isActive ? 'true' : undefined}
          >
            <span className="hero-dot-pill" aria-hidden="true" />
          </Button>
        );
      })}
    </nav>
  );
}
