import { useEffect, useState } from 'react';

/**
 * Пять условий, при которых вместо скролл-видео показывается статичный
 * первый экран.
 *
 * Строки обязаны совпадать символ в символ с медиазапросами в hero.css,
 * иначе одна сторона прячет то, что другая грузит.
 *
 * Решение живое, а не одноразовое: планшет поворачивают, окно
 * разворачивают, reduced-motion переключают прямо во время сессии.
 */
export const HERO_GATES = [
  '(max-width: 720px)',
  '(orientation: portrait) and (max-width: 1024px)',
  '(orientation: portrait) and (pointer: coarse)',
  '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
  '(prefers-reduced-motion: reduce)',
];

const gatesBlockScrub = () =>
  HERO_GATES.some((query) => window.matchMedia(query).matches);

export function useScrubGate() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !gatesBlockScrub();
  });

  useEffect(() => {
    // Списки держатся в переменной намеренно: несохранённые matchMedia
    // исторически теряли своих слушателей.
    const lists = HERO_GATES.map((query) => window.matchMedia(query));
    const apply = () => setEnabled(!gatesBlockScrub());

    lists.forEach((list) => list.addEventListener('change', apply));
    // Подстраховка поверх change: встречаются окружения, где изменение
    // размера не рождает событие у медиазапроса, и тогда первый экран
    // застревал бы в статичном виде после разворачивания окна.
    window.addEventListener('resize', apply, { passive: true });
    window.addEventListener('orientationchange', apply);
    apply();

    return () => {
      lists.forEach((list) => list.removeEventListener('change', apply));
      window.removeEventListener('resize', apply);
      window.removeEventListener('orientationchange', apply);
    };
  }, []);

  return enabled;
}
