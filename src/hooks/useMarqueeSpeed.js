import { useEffect, useRef } from 'react';

const PIXELS_PER_SECOND = 100;

export default function useMarqueeSpeed({ mobilePixelsPerSecond = PIXELS_PER_SECOND, mobileMinDuration = null, mobileMaxDuration = null } = {}) {
  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    const repeat = track?.firstElementChild;
    if (!repeat) return undefined;

    const updateDuration = () => {
      const distance = repeat.getBoundingClientRect().width;
      if (distance <= 0) return;
      const isMobile = window.matchMedia('(max-width: 760px)').matches;
      let duration = distance / (isMobile ? mobilePixelsPerSecond : PIXELS_PER_SECOND);
      if (isMobile && mobileMinDuration != null) duration = Math.max(mobileMinDuration, duration);
      if (isMobile && mobileMaxDuration != null) duration = Math.min(mobileMaxDuration, duration);
      track.style.setProperty('--marquee-duration', `${duration}s`);
    };

    updateDuration();
    window.addEventListener('resize', updateDuration, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateDuration);
    observer?.observe(repeat);
    return () => {
      window.removeEventListener('resize', updateDuration);
      observer?.disconnect();
    };
  }, [mobilePixelsPerSecond, mobileMinDuration, mobileMaxDuration]);

  return trackRef;
}
