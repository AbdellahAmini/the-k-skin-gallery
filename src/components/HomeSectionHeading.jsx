import { ArrowRight } from '@phosphor-icons/react';
import { Link } from 'react-router';

export default function HomeSectionHeading({
  id,
  eyebrow,
  title,
  href,
  linkLabel,
  compactLabel = linkLabel,
  className = '',
  titleClassName = '',
  eyebrowClassName = '',
  linkClassName = '',
  accent = false,
}) {
  return <div className={`section-heading home-section-header ${className}`}>
    <div className="home-section-header__copy">
      {eyebrow && <p className={`eyebrow home-section-eyebrow ${eyebrowClassName}`}>{eyebrow}</p>}
      <h2 id={id} className={`home-section-title ${titleClassName}`}>
        {accent && <span className="home-section-title__accent" aria-hidden="true" />}
        {title}
      </h2>
    </div>
    {href && linkLabel && <Link className={`text-link home-section-link ${linkClassName}`} to={href} aria-label={linkLabel}>
      <span className="home-section-link__full">{linkLabel}</span>
      <span className="home-section-link__short">{compactLabel}</span>
      <ArrowRight size={16} aria-hidden="true" />
    </Link>}
  </div>;
}
