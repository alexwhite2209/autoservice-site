import { BandText } from './BandText.jsx';
import { useReveal } from '../hooks/useReveal.js';
import { CONTACTS, HERO_SLOGAN } from '../data/site.js';
import '../styles/hero.css';

/**
 * Первый экран. Своего видео у него больше нет: фильм лежит под всей
 * страницей отдельным закреплённым слоем, а здесь живёт только слоган.
 */
export function Hero({ scrubEnabled }) {
  const revealRef = useReveal({ threshold: 0.05, settleMs: 2200 });

  return (
    <section id="hero" className="hero" data-section="hero">
      <div className="hero__inner reveal is-open" ref={revealRef}>
        <h1 className="hero__title">
          <BandText
            lines={HERO_SLOGAN.title}
            entrance="rise"
            accentLine={HERO_SLOGAN.accentLine}
            seed={11}
          />
        </h1>

        <p className="hero__subtitle">
          <BandText lines={HERO_SLOGAN.subtitle} entrance="rise" seed={53} />
        </p>

        {/* На статичном экране без фильма звонок должен быть тут же. */}
        {!scrubEnabled ? (
          <a className="btn btn--primary hero__cta" href={CONTACTS.phoneHref}>
            ПОЗВОНИТЬ
          </a>
        ) : null}
      </div>

      <a className="hero__cue" href="#services">
        <span className="hero__cue-mouse" aria-hidden="true">
          <span className="hero__cue-wheel" />
        </span>
        <span className="hero__cue-text">ПРОКРУТИТЕ ВНИЗ</span>
      </a>
    </section>
  );
}
