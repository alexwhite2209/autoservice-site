import { useEffect, useState } from 'react';

/**
 * Условия, при которых scroll-scrubbing отключается.
 *
 * Мобильные устройства здесь НЕ отключаются:
 * видео должно работать и на телефоне, и на планшете.
 *
 * Единственное автоматическое ограничение —
 * prefers-reduced-motion.
 */

export const HERO_GATES = [
  '(prefers-reduced-motion: reduce)',
];

const gatesBlockScrub = () =>
  HERO_GATES.some((query) =>
    window.matchMedia(query).matches
  );

export function useScrubGate() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return !gatesBlockScrub();
  });

  useEffect(() => {
    const lists = HERO_GATES.map((query) =>
      window.matchMedia(query)
    );

    const apply = () => {
      setEnabled(!gatesBlockScrub());
    };

    lists.forEach((list) =>
      list.addEventListener('change', apply)
    );

    window.addEventListener(
      'resize',
      apply,
      { passive: true }
    );

    window.addEventListener(
      'orientationchange',
      apply
    );

    apply();

    return () => {
      lists.forEach((list) =>
        list.removeEventListener(
          'change',
          apply
        )
      );

      window.removeEventListener(
        'resize',
        apply
      );

      window.removeEventListener(
        'orientationchange',
        apply
      );
    };
  }, []);

  return enabled;
}