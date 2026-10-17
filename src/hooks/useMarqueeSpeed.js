import { useEffect, useRef } from 'react';

const PIXELS_PER_SECOND = 100;

export default function useMarqueeSpeed() {
  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    const repeat = track?.firstElementChild;
    if (!repeat) return undefined;

    const updateDuration = () => {
      const distance = repeat.getBoundingClientRect().width;
      if (distance > 0) track.style.setProperty('--marquee-duration', `${distance / PIXELS_PER_SECOND}s`);
    };

    updateDuration();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateDuration);
      return () => window.removeEventListener('resize', updateDuration);
    }

    const observer = new ResizeObserver(updateDuration);
    observer.observe(repeat);
    return () => observer.disconnect();
  }, []);

  return trackRef;
}
