import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { BRAND, MEDIA } from '../data/site.js';
import '../styles/preloader.css';

/** Столько клубов дыма летит из-под колёс. */
const PUFFS = 16;

/**
 * Силуэт машины.
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

/** Линия остекления. */
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

  const preloadVideoRef = useRef(null);
  const animationDoneRef = useRef(false);
  const videoReadyRef = useRef(false);

  const [hidden, setHidden] = useState(false);

  /*
   * Preloader заканчивается только тогда, когда:
   *
   * 1. закончилась анимация заставки;
   * 2. видео полностью загружено.
   */
  const finishIfReady = useCallback(() => {
    if (hidden) return;

    if (
      !animationDoneRef.current ||
      !videoReadyRef.current
    ) {
      return;
    }

    setHidden(true);
    onFinish?.();
  }, [hidden, onFinish]);

  const skip = useCallback(() => {
    /*
     * «Пропустить» пропускает только анимацию.
     *
     * Видео всё равно должно догрузиться, иначе пользователь
     * попадёт на страницу раньше готовности фильма.
     */
    timelineRef.current?.progress(1).kill();

    animationDoneRef.current = true;

    finishIfReady();
  }, [finishIfReady]);

  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    window.scrollTo(0, 0);

    const unlock = () => {
      document.body.style.overflow =
        previousOverflow;
    };

    /*
     * --------------------------------------------------
     * ПРЕДЗАГРУЗКА ВИДЕО
     * --------------------------------------------------
     *
     * Отдельный video-элемент начинает загрузку сразу,
     * пока пользователь видит заставку.
     */
    const preloadVideo =
      document.createElement('video');

    preloadVideoRef.current = preloadVideo;

    preloadVideo.muted = true;
    preloadVideo.playsInline = true;
    preloadVideo.preload = 'auto';

    /*
     * Тот же URL, который потом использует FilmBackdrop.
     * Браузер сможет использовать уже загруженные данные.
     */
    preloadVideo.src = MEDIA.heroVideo;

    let videoLoaded = false;

    const markVideoReady = () => {
      if (videoLoaded) return;

      videoLoaded = true;
      videoReadyRef.current = true;

      finishIfReady();
    };

    /*
     * loadeddata означает, что браузер уже получил данные
     * для отображения первого кадра.
     *
     * Но нам нужен именно полностью загруженный ролик.
     */
    const checkFullyBuffered = () => {
      if (!preloadVideo.duration) return;

      if (!preloadVideo.buffered.length) return;

      try {
        const bufferedEnd =
          preloadVideo.buffered.end(
            preloadVideo.buffered.length - 1
          );

        /*
         * Допуск 0.05 сек нужен из-за погрешности
         * floating-point и особенностей buffered.
         */
        if (
          bufferedEnd >=
          preloadVideo.duration - 0.05
        ) {
          markVideoReady();
        }
      } catch {
        // Продолжаем ждать progress/canplaythrough.
      }
    };

    preloadVideo.addEventListener(
      'progress',
      checkFullyBuffered
    );

    preloadVideo.addEventListener(
      'canplaythrough',
      checkFullyBuffered
    );

    /*
     * Для небольших файлов некоторые браузеры не всегда
     * дают progress ровно в ожидаемый момент.
     */
    preloadVideo.addEventListener(
      'loadeddata',
      checkFullyBuffered
    );

    preloadVideo.addEventListener(
      'loadedmetadata',
      () => {
        /*
         * Начинаем загрузку сразу после получения metadata.
         */
        preloadVideo.load();
      },
      { once: true }
    );

    preloadVideo.addEventListener(
      'error',
      () => {
        /*
         * Если видео не удалось загрузить, не оставляем
         * пользователя навечно на заставке.
         *
         * FilmBackdrop позже сам покажет fallback.
         */
        videoReadyRef.current = true;
        finishIfReady();
      },
      { once: true }
    );

    /*
     * --------------------------------------------------
     * АНИМАЦИЯ PRELOADER
     * --------------------------------------------------
     */

    if (
      window
        .matchMedia(
          '(prefers-reduced-motion: reduce)'
        )
        .matches
    ) {
      animationDoneRef.current = true;
      unlock();

      /*
       * Видео всё равно продолжает грузиться.
       */
      return () => {
        preloadVideo.pause();
        preloadVideo.removeAttribute('src');
        preloadVideo.load();

        unlock();
      };
    }

    const puffs = smokeRef.current
      ? Array.from(
          smokeRef.current.children
        )
      : [];

    const timeline = gsap.timeline({
      defaults: {
        ease: 'power3.out',
      },

      onComplete: () => {
        animationDoneRef.current = true;
        finishIfReady();
      },
    });

    timelineRef.current = timeline;

    timeline
      .fromTo(
        roadRef.current,
        {
          scaleX: 0,
          opacity: 0,
        },
        {
          scaleX: 1,
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out',
        }
      )

      .fromTo(
        carRef.current,
        {
          xPercent: 160,
          opacity: 0,
        },
        {
          xPercent: 0,
          opacity: 1,
          duration: 1.15,
          ease: 'power3.out',
        },
        0.1
      )

      .fromTo(
        puffs,
        {
          xPercent: (i) =>
            -40 + i * 12,

          yPercent: 0,

          scale: 0.22,

          opacity: 0,
        },
        {
          xPercent: (i) =>
            60 +
            i * 12 +
            Math.random() * 150,

          yPercent: () =>
            -14 -
            Math.random() * 46,

          scale: () =>
            0.8 +
            Math.random() * 0.9,

          opacity: 0.32,

          duration: 1.05,

          ease: 'power2.out',

          stagger: 0.035,
        },
        0.35
      )

      .to(
        puffs,
        {
          opacity: 0,
          duration: 0.8,
          ease: 'power1.in',
        },
        1.05
      )

      .to(
        carRef.current,
        {
          opacity: 0,
          duration: 0.4,
        },
        1.35
      )

      .to(
        roadRef.current,
        {
          opacity: 0,
          duration: 0.5,
        },
        1.35
      )

      .fromTo(
        logoRef.current,
        {
          opacity: 0,
          scale: 0.9,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.7,
          ease: 'power2.out',
        },
        1.45
      )

      .fromTo(
        sheenRef.current,
        {
          xPercent: -130,
        },
        {
          xPercent: 130,
          duration: 0.9,
          ease: 'power2.inOut',
        },
        2.05
      )

      .to(
        rootRef.current,
        {
          opacity: 0,
          duration: 0.6,
          ease: 'power2.inOut',
        },
        2.85
      );

    return () => {
      timeline.kill();

      preloadVideo.pause();
      preloadVideo.removeAttribute('src');
      preloadVideo.load();

      unlock();
    };
  }, [finishIfReady]);

  if (hidden) return null;

  return (
    <div
      className="preloader"
      ref={rootRef}
    >
      <p
        className="visually-hidden"
        role="status"
      >
        Загрузка сайта
      </p>

      <div
        className="preloader__stage"
        aria-hidden="true"
      >
        <span
          className="preloader__road"
          ref={roadRef}
        />

        <div
          className="preloader__smoke"
          ref={smokeRef}
        >
          {Array.from(
            { length: PUFFS },
            (_, index) => (
              <span
                className="preloader__puff"
                key={index}
              />
            )
          )}
        </div>

        <svg
          className="preloader__car"
          viewBox="0 0 320 96"
          fill="none"
          ref={carRef}
        >
          <defs>
            <linearGradient
              id="preloader-car"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#FF3A28"
              />
              <stop
                offset="55%"
                stopColor="#D01206"
              />
              <stop
                offset="100%"
                stopColor="#8E0B03"
              />
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

          <span
            className="preloader__sheen"
            ref={sheenRef}
          />
        </div>
      </div>

      <button
        className="preloader__skip"
        type="button"
        onClick={skip}
      >
        ПРОПУСТИТЬ
      </button>
    </div>
  );
}