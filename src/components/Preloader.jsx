import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { BRAND } from '../data/site.js';
import '../styles/preloader.css';

/** Столько клубов дыма летит из-под колёс. */
const PUFFS = 16;

/**
 * Силуэт машины, повторяющий обводку из логотипа: низкое купе, длинный
 * капот, быстрая линия крыши. Нос смотрит влево, потому что машина
 * приезжает справа и уходит к центру.
 */
const CAR_BODY = `
  M 10 70
  C 4 62 8 53 22 49
  C 40 45 58 41 74 37
  C 92 23 116 13 152 13
  C 190 13 216 21 238 33
  C 260 39 286 45 302 51
  C 314 55 316 65 310 71
  L 272 71
  A 24 24 0 0 0 224 71
  L 102 71
  A 24 24 0 0 0 54 71
  Z
`;

/** Линия остекления: отдельным штрихом, как в знаке. */
const CAR_GLASS = `
  M 86 36
  C 102 25 122 19 151 19
  C 177 19 197 25 214 33
  Z
`;

export function Preloader({ onFinish }) {
  const rootRef = useRef(null);
  const carRef = useRef(null);
  const logoRef = useRef(null);
  const sheenRef = useRef(null);
  const roadRef = useRef(null);
  const smokeRef = useRef(null);
  const timelineRef = useRef(null);
  const [hidden, setHidden] = useState(false);

  const finish = useCallback(() => {
    if (hidden) return;
    setHidden(true);
    onFinish?.();
  }, [hidden, onFinish]);

  const skip = useCallback(() => {
    timelineRef.current?.progress(1).kill();
    finish();
  }, [finish]);

  useEffect(() => {
    // Пока идёт заставка, страница под ней не должна прокручиваться.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.scrollTo(0, 0);

    const unlock = () => {
      document.body.style.overflow = previousOverflow;
    };

    // При включённом reduced-motion заставку не крутим вовсе.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      unlock();
      finish();
      return unlock;
    }

    const puffs = smokeRef.current
      ? Array.from(smokeRef.current.children)
      : [];

    const timeline = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => {
        unlock();
        finish();
      },
    });
    timelineRef.current = timeline;

    timeline
      // Дорожка прочерчивается первой: машине нужно по чему ехать.
      .fromTo(
        roadRef.current,
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 0.5, ease: 'power2.out' }
      )
      // Разгон справа к центру: замедление в конце делает въезд весомым.
      .fromTo(
        carRef.current,
        { xPercent: 160, opacity: 0 },
        { xPercent: 0, opacity: 1, duration: 1.15, ease: 'power3.out' },
        0.1
      )
      // Дым из-под колёс: клубы стартуют вдоль днища и тянутся назад,
      // поэтому след читается шлейфом, а не одним пятном.
      .fromTo(
        puffs,
        {
          xPercent: (i) => -40 + i * 12,
          yPercent: 0,
          scale: 0.22,
          opacity: 0,
        },
        {
          xPercent: (i) => 60 + i * 12 + Math.random() * 150,
          yPercent: () => -14 - Math.random() * 46,
          scale: () => 0.8 + Math.random() * 0.9,
          opacity: 0.32,
          duration: 1.05,
          ease: 'power2.out',
          stagger: 0.035,
        },
        0.35
      )
      .to(puffs, { opacity: 0, duration: 0.8, ease: 'power1.in' }, 1.05)
      // Машина растворяется, на её месте проявляется знак.
      .to(carRef.current, { opacity: 0, duration: 0.4 }, 1.35)
      .to(roadRef.current, { opacity: 0, duration: 0.5 }, 1.35)
      .fromTo(
        logoRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out' },
        1.45
      )
      // Перелив по знаку.
      .fromTo(
        sheenRef.current,
        { xPercent: -130 },
        { xPercent: 130, duration: 0.9, ease: 'power2.inOut' },
        2.05
      )
      // Заставка уходит, сайт открывается.
      .to(rootRef.current, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, 2.85);

    return () => {
      timeline.kill();
      unlock();
    };
  }, [finish]);

  if (hidden) return null;

  return (
    <div className="preloader" ref={rootRef}>
      <p className="visually-hidden" role="status">
        Загрузка сайта
      </p>

      <div className="preloader__stage" aria-hidden="true">
        <span className="preloader__road" ref={roadRef} />

        <div className="preloader__smoke" ref={smokeRef}>
          {Array.from({ length: PUFFS }, (_, index) => (
            <span className="preloader__puff" key={index} />
          ))}
        </div>

        <svg
          className="preloader__car"
          viewBox="0 0 320 96"
          fill="none"
          ref={carRef}
        >
          <defs>
            <linearGradient id="preloader-car" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FF3A28" />
              <stop offset="55%" stopColor="#D01206" />
              <stop offset="100%" stopColor="#8E0B03" />
            </linearGradient>
          </defs>
          <path
            d={CAR_BODY}
            stroke="url(#preloader-car)"
            strokeWidth="3.4"
            strokeLinejoin="round"
          />
          <path
            d={CAR_GLASS}
            stroke="url(#preloader-car)"
            strokeWidth="2.4"
            strokeLinejoin="round"
            opacity="0.75"
          />
        </svg>

        <div className="preloader__logo-wrap">
          <img
            className="preloader__logo"
            src={BRAND.logoSrc}
            alt=""
            width={BRAND.logoWidth}
            height={BRAND.logoHeight}
            ref={logoRef}
          />
          <span className="preloader__sheen" ref={sheenRef} />
        </div>
      </div>

      <button className="preloader__skip" type="button" onClick={skip}>
        ПРОПУСТИТЬ
      </button>
    </div>
  );
}
