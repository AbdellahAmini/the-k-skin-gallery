import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bag, Sparkle } from '@phosphor-icons/react';
import { Link } from 'react-router';
import Button from './ui/Button';

export default function HomeGuidedRail({ items }) {
  const railRef = useRef(null);
  const pointerStartRef = useRef(null);
  const didSwipeRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;

    let frame = 0;
    const updateActiveIndex = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const railLeft = rail.getBoundingClientRect().left;
        const cards = [...rail.querySelectorAll('.home-guided-card')];
        let nearestIndex = 0;
        let nearestDistance = Number.POSITIVE_INFINITY;

        cards.forEach((card, index) => {
          const distance = Math.abs(card.getBoundingClientRect().left - railLeft);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        });

        setActiveIndex((current) => current === nearestIndex ? current : nearestIndex);
      });
    };

    rail.addEventListener('scroll', updateActiveIndex, { passive: true });
    window.addEventListener('resize', updateActiveIndex, { passive: true });
    const resizeObserver = new ResizeObserver(updateActiveIndex);
    resizeObserver.observe(rail);
    updateActiveIndex();

    return () => {
      window.cancelAnimationFrame(frame);
      rail.removeEventListener('scroll', updateActiveIndex);
      window.removeEventListener('resize', updateActiveIndex);
      resizeObserver.disconnect();
    };
  }, [items.length]);

  const scrollToItem = (index) => {
    railRef.current?.querySelectorAll('.home-guided-card')[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start',
    });
  };

  const handlePointerDown = (event) => {
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    didSwipeRef.current = false;
  };

  const handlePointerMove = (event) => {
    if (!pointerStartRef.current) return;
    const deltaX = Math.abs(event.clientX - pointerStartRef.current.x);
    const deltaY = Math.abs(event.clientY - pointerStartRef.current.y);
    if (deltaX > 8 && deltaX > deltaY) didSwipeRef.current = true;
  };

  const preventNavigationAfterSwipe = (event) => {
    if (!didSwipeRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    didSwipeRef.current = false;
    pointerStartRef.current = null;
  };

  return <>
    <p className="home-guided-hint">
      <span>{items.length} choix</span>
      <span aria-hidden="true">·</span>
      <span>Faites glisser</span>
      <ArrowRight size={13} aria-hidden="true" />
    </p>
    <div
      className="home-guided-grid"
      ref={railRef}
      role="list"
      aria-label="Routines et packs à découvrir"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={() => { pointerStartRef.current = null; }}
      onPointerCancel={() => { pointerStartRef.current = null; }}
    >
      {items.map((item, index) => {
        const Icon = item.kind === 'pack' ? Bag : Sparkle;
        return <Link key={item.slug} to={item.href} onClickCapture={preventNavigationAfterSwipe} className={`home-guided-card${item.kind === 'pack' ? ' home-pack-card' : ''}`} data-guided-index={index} role="listitem">
          <Icon size={22} aria-hidden="true" />
          <h3>{item.name}</h3>
          <p>{item.description}</p>
          <span>{item.kind === 'pack' ? 'Voir le pack' : 'Découvrir'} <ArrowRight size={16} aria-hidden="true" /></span>
        </Link>;
      })}
    </div>
    {items.length > 1 && <div className="home-guided-indicators" role="group" aria-label="Position dans les routines et packs">
      {items.map((item, index) => <Button
        key={item.slug}
        type="button"
        variant="ghost"
        size="icon"
        className={`home-guided-indicator${index === activeIndex ? ' is-active' : ''}`}
        aria-label={`Afficher ${item.name}, choix ${index + 1} sur ${items.length}`}
        aria-current={index === activeIndex ? 'true' : undefined}
        onClick={() => scrollToItem(index)}
      ><span aria-hidden="true" /></Button>)}
    </div>}
  </>;
}
