import { useEffect } from 'react';

// Observe page blocks rather than individual cards so each section moves together.
function pageBlocks(main) {
  return [...main.children].flatMap((child) => {
    if (child.matches('.collection-layout')) {
      // Keep the full-screen mobile filter panel outside transformed ancestors.
      return [...child.querySelectorAll(':scope > .collection-results')];
    }
    if (child.matches('.product-details, .info-grid')) return [...child.children];
    if (child.matches('.checkout-layout')) {
      return [...child.querySelectorAll(':scope > form > section, :scope > aside')];
    }
    return [child];
  }).filter((child) => !child.matches('script, style'));
}

export default function SectionReveal({ routeKey, rootSelector = '.site-shell' }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const root = document.querySelector(rootSelector);
    if (!root || !('IntersectionObserver' in window)) return undefined;

    const seen = new WeakSet();
    const pending = new Set();
    const timers = new Map();
    let frame = 0;
    const finish = (element) => {
      element.classList.remove('section-reveal-pending', 'section-reveal-visible');
      pending.delete(element);
      window.clearTimeout(timers.get(element));
      timers.delete(element);
    };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        entry.target.classList.add('section-reveal-visible');
        timers.set(entry.target, window.setTimeout(() => finish(entry.target), 1400));
      }
    }, { rootMargin: '0px 0px -22% 0px', threshold: 0 });
    const onAnimationEnd = (event) => {
      if (event.animationName === 'gallery-section-reveal' && pending.has(event.target)) finish(event.target);
    };
    const discover = () => {
      frame = 0;
      root.querySelectorAll('main:not([aria-label="Chargement de la page"])').forEach((main) => {
        for (const element of pageBlocks(main)) {
          if (seen.has(element)) continue;
          seen.add(element);
          pending.add(element);
          element.classList.add('section-reveal-pending');
          observer.observe(element);
        }
      });
    };
    const mutations = new MutationObserver(() => {
      if (!frame) frame = window.requestAnimationFrame(discover);
    });
    root.addEventListener('animationend', onAnimationEnd);
    mutations.observe(root, { childList: true, subtree: true });
    discover();

    return () => {
      mutations.disconnect();
      observer.disconnect();
      root.removeEventListener('animationend', onAnimationEnd);
      if (frame) window.cancelAnimationFrame(frame);
      for (const element of pending) finish(element);
    };
  }, [routeKey, rootSelector]);

  return null;
}
