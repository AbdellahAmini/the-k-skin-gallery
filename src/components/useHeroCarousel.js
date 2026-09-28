import { useState, useEffect, useRef, useCallback } from 'react';

export function useHeroCarousel(slidesCount = 3, dwellTime = 5000, resumeDelay = 3500) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(slidesCount - 1);
  const [direction, setDirection] = useState('next'); // 'next' | 'prev'
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const pauseTimerRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });

  // Refs for stable timer callback without constantly restarting the interval
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const isAnimatingRef = useRef(isAnimating);
  isAnimatingRef.current = isAnimating;

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const slidesCountRef = useRef(slidesCount);
  slidesCountRef.current = slidesCount;

  // Detect reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener?.('change', handleChange);
    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, []);

  const goTo = useCallback((nextIdx, dir = 'next') => {
    if (isAnimatingRef.current || slidesCountRef.current <= 1) return;
    const currentIdx = activeIndexRef.current;
    if (nextIdx === currentIdx) return;

    setPrevIndex(currentIdx);
    setDirection(dir);
    setActiveIndex(nextIdx);
    setIsAnimating(true);

    setTimeout(() => {
      setIsAnimating(false);
    }, 820);
  }, []);

  const next = useCallback(() => {
    const total = slidesCountRef.current;
    if (total <= 1) return;
    const targetIndex = (activeIndexRef.current + 1) % total;
    goTo(targetIndex, 'next');
  }, [goTo]);

  const prev = useCallback(() => {
    const total = slidesCountRef.current;
    if (total <= 1) return;
    const targetIndex = (activeIndexRef.current - 1 + total) % total;
    goTo(targetIndex, 'prev');
  }, [goTo]);

  // Handle user interaction pause & resume
  const triggerPause = useCallback(() => {
    setIsPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, resumeDelay);
  }, [resumeDelay]);

  // Robust Autoplay Interval using stable refs
  useEffect(() => {
    if (prefersReducedMotion || slidesCount <= 1) return;

    const timer = setInterval(() => {
      if (!isPausedRef.current && !isAnimatingRef.current) {
        const total = slidesCountRef.current;
        if (total > 1) {
          const targetIndex = (activeIndexRef.current + 1) % total;
          goTo(targetIndex, 'next');
        }
      }
    }, dwellTime);

    return () => clearInterval(timer);
  }, [prefersReducedMotion, slidesCount, dwellTime, goTo]);

  // Page visibility listener
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        triggerPause();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [triggerPause]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    triggerPause();
  };

  const handleTouchEnd = (e) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) >= 45) {
      if (deltaX < 0) {
        next();
      } else {
        prev();
      }
    }
  };

  // Keyboard navigation handler
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      triggerPause();
      next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      triggerPause();
      prev();
    }
  };

  return {
    activeIndex,
    prevIndex,
    direction,
    isAnimating,
    isPaused,
    prefersReducedMotion,
    goTo,
    next,
    prev,
    triggerPause,
    setIsPaused,
    handleTouchStart,
    handleTouchEnd,
    handleKeyDown,
  };
}
