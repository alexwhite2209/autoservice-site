import { useEffect, useRef } from 'react';

/**
 * Добавляет класс .in, когда элемент входит в экран, и .revealed, когда
 * хореография отыграла.
 *
 * Второй класс важнее, чем кажется: он снимает transition-delay стаггера.
 * Без него каждый hover на поздних соседях потом опаздывает ровно на
 * величину задержки, и это выглядит как тормоза.
 */
export function useReveal({ threshold = 0.15, settleMs = 1400 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('in', 'revealed');
      return undefined;
    }

    let settleTimer = 0;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          el.classList.add('in');
          settleTimer = window.setTimeout(
            () => el.classList.add('revealed'),
            settleMs
          );
          io.unobserve(el);
        });
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    );

    io.observe(el);
    return () => {
      window.clearTimeout(settleTimer);
      io.disconnect();
    };
  }, [threshold, settleMs]);

  return ref;
}
