import { BRAND } from '../data/site.js';
import '../styles/logo.css';

/**
 * Знак бренда.
 *
 * Пока в BRAND.logoSrc пусто, на его месте стоит нейтральный контейнер
 * того же размера. Подстановка настоящего файла ничего в вёрстке
 * не двигает: место под знак зарезервировано заранее.
 */
export function Logo({ className = '' }) {
  if (BRAND.logoSrc) {
    return (
      <img
        className={`logo logo--image ${className}`}
        src={BRAND.logoSrc}
        alt={BRAND.logoAlt}
        width={BRAND.logoWidth}
        height={BRAND.logoHeight}
      />
    );
  }

  return (
    <span className={`logo logo--placeholder ${className}`}>
      {BRAND.logoLabel}
    </span>
  );
}
