import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Лёгкий параллакс. Именно лёгкий: смысл в том, чтобы фон шёл чуть
 * медленнее содержимого, а не в аттракционе.
 *
 * При prefers-reduced-motion эффект не включается вовсе.
 */
export function useParallax(ref, distancePercent = 7) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const tween = gsap.fromTo(
      element,
      { yPercent: -distancePercent },
      {
        yPercent: distancePercent,
        ease: 'none',
        scrollTrigger: {
          trigger: element,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [ref, distancePercent]);
}
