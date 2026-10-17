import { useEffect } from 'react';

const MAIN_SELECTOR = 'main:not([aria-label="Chargement de la page"])';
const REVEAL_ANIMATION_NAMES = new Set(['gallery-section-reveal', 'gallery-card-reveal']);

// Keep logical sections together, but never transform the collection layout:
// its filter panel is a full-screen dialog on mobile.
function pageBlocks(main) {
  return [...main.children].flatMap((child) => {
    if (child.matches('.collection-layout')) {
      return [...child.querySelectorAll(':scope > .collection-results')]
        .map((element) => ({ element, variant: 'collection' }));
    }
    if (child.matches('.product-details, .info-grid')) {
      return [...child.children].map((element) => ({ element, variant: 'standard' }));
    }
    if (child.matches('.checkout-layout')) {
      return [...child.querySelectorAll(':scope > form > section, :scope > aside')]
        .map((element) => ({ element, variant: 'utility' }));
    }
    return [{ element: child, variant: main.matches('.admin-v2-scroll') ? 'utility' : 'standard' }];
  }).filter(({ element }) => !element.matches('script, style'));
}

function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < window.innerHeight;
}

export default function SectionReveal({ routeKey, rootSelector = '.site-shell' }) {
  useEffect(() => {
    const root = document.querySelector(rootSelector);
    if (!root) return undefined;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const seen = new WeakSet();
    const pending = new Set();
    const timers = new Map();
    const queuedMains = new Set();
    let observer = null;
    let frame = 0;

    const finish = (element) => {
      observer?.unobserve(element);
      element.classList.remove('section-reveal-pending', 'section-reveal-visible', 'section-reveal-collection', 'section-reveal-utility');
      pending.delete(element);
      window.clearTimeout(timers.get(element));
      timers.delete(element);
    };

    const finishAll = () => {
      for (const element of pending) finish(element);
    };

    const finishWhenAnimationsSettle = (element) => {
      window.requestAnimationFrame(() => {
        if (!pending.has(element)) return;
        const activeReveal = typeof element.getAnimations === 'function'
          && element.getAnimations({ subtree: true }).some((animation) =>
            REVEAL_ANIMATION_NAMES.has(animation.animationName)
            && (animation.playState === 'running' || animation.playState === 'pending'));
        if (!activeReveal) finish(element);
      });
    };

    const scheduleDiscovery = (mains) => {
      if (motionPreference.matches) return;
      mains.forEach((main) => queuedMains.add(main));
      if (frame || !queuedMains.size) return;
      frame = window.requestAnimationFrame(discover);
    };

    const discover = () => {
      frame = 0;
      if (motionPreference.matches || !observer) {
        queuedMains.clear();
        return;
      }

      const candidates = [];
      for (const main of queuedMains) {
        if (!root.contains(main)) continue;
        for (const block of pageBlocks(main)) {
          if (!seen.has(block.element)) candidates.push(block);
        }
      }
      queuedMains.clear();

      // Read geometry before writing classes so discovery does not force a
      // layout between sections. Anything already visible is never hidden.
      const offscreen = [];
      for (const block of candidates) {
        seen.add(block.element);
        if (!isInViewport(block.element)) offscreen.push(block);
      }
      for (const { element, variant } of offscreen) {
        pending.add(element);
        element.classList.add('section-reveal-pending', `section-reveal-${variant}`);
        observer.observe(element);
      }
    };

    const addMainsWithin = (node, mains) => {
      if (!(node instanceof Element)) return;
      const ownMain = node.matches(MAIN_SELECTOR) ? node : node.closest(MAIN_SELECTOR);
      if (ownMain && root.contains(ownMain)) mains.add(ownMain);
      node.querySelectorAll(MAIN_SELECTOR).forEach((main) => mains.add(main));
    };

    const cleanRemovedBlocks = (node) => {
      if (!(node instanceof Element)) return;
      const removed = [];
      if (node.matches('.section-reveal-pending')) removed.push(node);
      node.querySelectorAll('.section-reveal-pending').forEach((element) => removed.push(element));
      for (const element of removed) {
        if (!root.contains(element)) finish(element);
      }
    };

    const createObserver = () => {
      if (motionPreference.matches || !('IntersectionObserver' in window)) return null;
      return new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || !pending.has(entry.target)) continue;
          observer.unobserve(entry.target);
          entry.target.classList.add('section-reveal-visible');
          // Animation events normally clean up sooner; this is only a safety
          // net for interrupted or unsupported animations.
          timers.set(entry.target, window.setTimeout(() => finish(entry.target), 1800));
        }
      }, { rootMargin: '0px 0px 16px 0px', threshold: 0 });
    };

    const onAnimationEnd = (event) => {
      if (!REVEAL_ANIMATION_NAMES.has(event.animationName)) return;
      const block = pending.has(event.target) ? event.target : event.target.closest?.('.section-reveal-pending');
      if (block && pending.has(block)) finishWhenAnimationsSettle(block);
    };

    const onMotionPreferenceChange = () => {
      if (motionPreference.matches) {
        observer?.disconnect();
        observer = null;
        queuedMains.clear();
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        finishAll();
        return;
      }
      observer = createObserver();
      scheduleDiscovery(root.querySelectorAll(MAIN_SELECTOR));
    };

    const mutations = new MutationObserver((records) => {
      const mains = new Set();
      for (const record of records) {
        record.removedNodes.forEach(cleanRemovedBlocks);
        record.addedNodes.forEach((node) => addMainsWithin(node, mains));
      }
      scheduleDiscovery(mains);
    });

    root.addEventListener('animationend', onAnimationEnd);
    root.addEventListener('animationcancel', onAnimationEnd);
    mutations.observe(root, { childList: true, subtree: true });
    observer = createObserver();
    if (!motionPreference.matches && observer) {
      scheduleDiscovery(root.querySelectorAll(MAIN_SELECTOR));
    }
    motionPreference.addEventListener('change', onMotionPreferenceChange);

    return () => {
      mutations.disconnect();
      motionPreference.removeEventListener('change', onMotionPreferenceChange);
      observer?.disconnect();
      root.removeEventListener('animationend', onAnimationEnd);
      root.removeEventListener('animationcancel', onAnimationEnd);
      if (frame) window.cancelAnimationFrame(frame);
      finishAll();
      queuedMains.clear();
    };
  }, [routeKey, rootSelector]);

  return null;
}
