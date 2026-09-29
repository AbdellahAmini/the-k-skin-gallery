import { useState, useEffect, useRef, useCallback } from 'react';

export function useHeroCarousel(
  slidesCount = 3,
  dwellTime = 4000,
  transitionDuration = 800
) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(slidesCount - 1);
  const [direction, setDirection] = useState('next');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const touchStartRef = useRef({ x: 0, y: 0 });
  const touchTrackingRef = useRef(false);

  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const isAnimatingRef = useRef(isAnimating);
  isAnimatingRef.current = isAnimating;

  const slidesCountRef = useRef(slidesCount);
  slidesCountRef.current = slidesCount;

  const isMobileRef = useRef(isMobile);
  isMobileRef.current = isMobile;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      const mobile =
        window.innerWidth <= 768 ||
        window.matchMedia('(pointer: coarse)').matches;

      setIsMobile(mobile);
    };

    checkMobile();

    window.addEventListener('resize', checkMobile, { passive: true });

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );

    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener?.('change', handleChange);

    return () => {
      mediaQuery.removeEventListener?.('change', handleChange);
    };
  }, []);

  const goTo = useCallback(
    (nextIdx, dir = 'next') => {
      if (
        isAnimatingRef.current ||
        slidesCountRef.current <= 1
      ) {
        return;
      }

      const currentIdx = activeIndexRef.current;

      if (nextIdx === currentIdx) {
        return;
      }

      setPrevIndex(currentIdx);
      setDirection(dir);
      setActiveIndex(nextIdx);
      setIsAnimating(true);

      window.setTimeout(() => {
        setIsAnimating(false);
      }, transitionDuration);
    },
    [transitionDuration]
  );

  const next = useCallback(() => {
    const total = slidesCountRef.current;

    if (total <= 1) return;

    const targetIndex =
      (activeIndexRef.current + 1) % total;

    goTo(targetIndex, 'next');
  }, [goTo]);

  const prev = useCallback(() => {
    const total = slidesCountRef.current;

    if (total <= 1) return;

    const targetIndex =
      (activeIndexRef.current - 1 + total) % total;

    goTo(targetIndex, 'prev');
  }, [goTo]);

  const getDirection = useCallback((from, to) => {
    const total = slidesCountRef.current;

    if (total <= 1 || from === to) {
      return 'next';
    }

    const forwardDistance =
      (to - from + total) % total;

    const backwardDistance =
      (from - to + total) % total;

    return forwardDistance <= backwardDistance
      ? 'next'
      : 'prev';
  }, []);

  const goToIndex = useCallback(
    (nextIdx) => {
      const currentIdx = activeIndexRef.current;

      if (
        nextIdx === currentIdx ||
        isAnimatingRef.current
      ) {
        return;
      }

      const dir =
        getDirection(currentIdx, nextIdx);

      goTo(nextIdx, dir);
    },
    [getDirection, goTo]
  );

  /*
   * AUTOPLAY
   *
   * Important behavior:
   *
   * Every time activeIndex changes,
   * this timeout is recreated.
   *
   * Therefore:
   *
   * manual slide change
   * → timer resets
   * → selected slide remains visible for dwellTime
   * → automatic sliding continues afterward
   */
  useEffect(() => {
    if (
      prefersReducedMotion ||
      slidesCount <= 1 ||
      isMobile
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (
        !isAnimatingRef.current &&
        !document.hidden &&
        !isMobileRef.current
      ) {
        next();
      }
    }, dwellTime);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    activeIndex,
    prefersReducedMotion,
    slidesCount,
    dwellTime,
    isMobile,
    next,
  ]);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };

    touchTrackingRef.current = true;
  };

  const handleTouchEnd = (e) => {
    if (!touchTrackingRef.current) return;

    touchTrackingRef.current = false;

    const touch = e.changedTouches[0];

    const deltaX =
      touch.clientX - touchStartRef.current.x;

    const deltaY =
      touch.clientY - touchStartRef.current.y;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX >= 45 && absX > absY * 1.5) {
      if (deltaX < 0) {
        next();
      } else {
        prev();
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    }
  };

  return {
    activeIndex,
    prevIndex,
    direction,
    isAnimating,

    isPaused:
      isMobile ||
      prefersReducedMotion,

    prefersReducedMotion,
    isMobile,

    goTo,
    goToIndex,
    next,
    prev,

    handleTouchStart,
    handleTouchEnd,
    handleKeyDown,
  };
}