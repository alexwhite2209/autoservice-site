import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SMOOTHING = 0.16;
const RING_LENGTH = 126;

/*
 * Мобильная версия:
 *
 * 24 sprite sheets
 * × 10 кадров в каждом
 * = 240 кадров
 */
const MOBILE_SHEETS = 24;
const FRAMES_PER_SHEET = 10;
const TOTAL_FRAMES =
  MOBILE_SHEETS * FRAMES_PER_SHEET;

const isMobileScrub = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia('(max-width: 720px)').matches ||
    window.matchMedia(
      '(orientation: portrait) and (pointer: coarse)'
    ).matches
  );
};

/**
 * Прогресс страницы → время видео.
 *
 * 0% страницы   → начало видео
 * 50% страницы  → конец видео
 * 100% страницы → снова начало видео
 */
export const filmTime = (progress, duration) =>
  progress <= 0.5
    ? progress * 2 * duration
    : (1 - progress) * 2 * duration;

/**
 * Прогресс страницы → номер мобильного кадра.
 *
 * 0   → кадр 0
 * 0.5 → кадр 120
 * 1   → кадр 239
 *
 * В мобильном режиме используем всю последовательность
 * из 240 кадров.
 */
const frameFromProgress = (progress) => {
  const frame = Math.round(
    progress * (TOTAL_FRAMES - 1)
  );

  return Math.max(
    0,
    Math.min(
      TOTAL_FRAMES - 1,
      frame
    )
  );
};

/**
 * URL мобильного sprite sheet.
 *
 * sheet_00.webp
 * sheet_01.webp
 * ...
 * sheet_23.webp
 */
const sheetUrl = (sheetIndex) => {
  const number = String(sheetIndex).padStart(2, '0');

  return `${import.meta.env.BASE_URL}assets/mobile-scrub/sheet_${number}.webp`;
};

/**
 * Показывает конкретный кадр мобильной версии.
 *
 * Каждый sprite:
 *
 * 1280 × 1800
 *
 * Внутри:
 *
 * 2 колонки
 * 5 рядов
 * 10 кадров
 *
 * Один кадр:
 *
 * 640 × 360
 * = 16:9
 */
const showMobileFrame = (element, frame) => {
  if (!element) return;

  const sheetIndex = Math.floor(
    frame / FRAMES_PER_SHEET
  );

  const localFrame =
    frame % FRAMES_PER_SHEET;

  const column =
    localFrame % 2;

  const row =
    Math.floor(localFrame / 2);

  const url = sheetUrl(sheetIndex);

  /*
   * Меняем background-image только когда
   * переходим на другой sprite.
   */
  if (
    element.dataset.sheet !==
    String(sheetIndex)
  ) {
    element.style.backgroundImage =
      `url("${url}")`;

    element.dataset.sheet =
      String(sheetIndex);
  }

  /*
   * Sprite масштабируется по высоте:
   *
   * 5 × высота экрана.
   *
   * Поэтому каждый кадр остаётся 16:9.
   */

  const viewportWidth =
    window.innerWidth;

  const viewportHeight =
    window.innerHeight;

  /*
   * Реальная ширина sprite после масштабирования.
   */
  const spriteWidth =
    (1280 / 1800 * 5 * viewportHeight) /
    viewportWidth;

  /*
   * Реальная ширина одного кадра
   * относительно ширины viewport.
   */
  const frameWidth =
    (640 / 1800 * 5 * viewportHeight) /
    viewportWidth;

  /*
   * Центрируем выбранный кадр
   * относительно экрана.
   */
  let x = 50;

  if (spriteWidth > 1) {
    const frameCenter =
      column === 0
        ? frameWidth / 2
        : spriteWidth - frameWidth / 2;

    x =
      ((0.5 - frameCenter) /
        (1 - spriteWidth)) *
      100;
  }

  /*
   * Пять рядов:
   *
   * 0%
   * 25%
   * 50%
   * 75%
   * 100%
   */
  const y = row * 25;

  element.style.backgroundPosition =
    `${x}% ${y}%`;
};

export function useFilmScrub({
  enabled,
  stageRef,
  videoRef,
  frameRef,
  ringRef,
  src,
  poster,
  onProgress,
}) {
  const progressCb = useRef(onProgress);

  progressCb.current = onProgress;

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const stage =
      stageRef.current;

    const video =
      videoRef.current;

    const frame =
      frameRef.current;

    if (!stage) {
      return undefined;
    }

    const mobile =
      isMobileScrub();

    let disposed = false;

    let target = 0;
    let shown = 0;

    let rafId = null;
    let lastTick = 0;

    /* =====================================================
       MOBILE
       ===================================================== */

    if (mobile && frame) {
      const images = [];

      /*
       * Загружаем ВСЕ 24 sprite sheets.
       *
       * 24 × 10 = 240 кадров.
       */
      let loaded = 0;

      const handleSheetLoaded = () => {
        if (disposed) {
          return;
        }

        loaded += 1;

        const fraction =
          loaded / MOBILE_SHEETS;

        const ring =
          ringRef.current;

        if (ring) {
          ring.style.setProperty(
            '--ring-offset',
            String(
              Math.round(
                RING_LENGTH *
                  (1 - fraction)
              )
            )
          );
        }

        /*
         * Когда загрузились все 24 спрайта,
         * показываем мобильный слой.
         */
        if (
          loaded === MOBILE_SHEETS
        ) {
          stage.classList.add(
            'is-video-ready'
          );

          showMobileFrame(
            frame,
            frameFromProgress(target)
          );
        }
      };

      /*
       * Предзагрузка всех спрайтов.
       */
      for (
        let i = 0;
        i < MOBILE_SHEETS;
        i += 1
      ) {
        const image =
          new Image();

        image.onload =
          handleSheetLoaded;

        image.onerror =
          handleSheetLoaded;

        image.src =
          sheetUrl(i);

        images.push(image);
      }

      /*
       * Первый кадр показываем сразу.
       */
      showMobileFrame(
        frame,
        0
      );

      /*
       * Плавное движение по кадрам.
       */
      const tickMobile = (now) => {
        if (disposed) {
          return;
        }

        const dt =
          Math.min(
            100,
            now -
              (lastTick || now)
          );

        lastTick = now;

        const smoothing =
          1 -
          (1 - SMOOTHING) **
            (dt / 16.667);

        shown +=
          (target - shown) *
          smoothing;

        if (
          Math.abs(
            target - shown
          ) < 0.0005
        ) {
          shown = target;

          rafId = null;
          lastTick = 0;
        } else {
          rafId =
            requestAnimationFrame(
              tickMobile
            );
        }

        /*
         * Показываем соответствующий
         * кадр из 240 кадров.
         */
        showMobileFrame(
          frame,
          frameFromProgress(
            shown
          )
        );

        progressCb.current?.(
          shown
        );
      };

      const kickMobile = () => {
        if (
          rafId === null &&
          !disposed
        ) {
          rafId =
            requestAnimationFrame(
              tickMobile
            );
        }
      };

      /*
       * Следим за прокруткой всей страницы.
       */
      const trigger =
        ScrollTrigger.create({
          trigger:
            document.documentElement,

          start: 'top top',

          end: 'bottom bottom',

          onUpdate: (self) => {
            target =
              self.progress;

            kickMobile();
          },
        });

      progressCb.current?.(0);

      return () => {
        disposed = true;

        if (rafId !== null) {
          cancelAnimationFrame(
            rafId
          );
        }

        trigger.kill();

        images.forEach(
          (image) => {
            image.onload = null;
            image.onerror = null;
            image.src = '';
          }
        );

        stage.classList.remove(
          'is-video-ready',
          'is-video-failed'
        );
      };
    }

    /* =====================================================
       DESKTOP
       ===================================================== */

    if (!video) {
      return undefined;
    }

    let metadataReady = false;

    const setRing = (fraction) => {
      const ring =
        ringRef.current;

      if (!ring) {
        return;
      }

      ring.style.setProperty(
        '--ring-offset',
        String(
          Math.round(
            RING_LENGTH *
              (1 - fraction)
          )
        )
      );
    };

    /*
     * Перемотка десктопного видео.
     */
    const seekVideo = (time) => {
      if (
        disposed ||
        !metadataReady
      ) {
        return;
      }

      const duration =
        video.duration;

      if (
        !Number.isFinite(
          duration
        ) ||
        duration <= 0
      ) {
        return;
      }

      const clamped =
        Math.max(
          0,
          Math.min(
            duration - 0.001,
            time
          )
        );

      try {
        if (
          Math.abs(
            video.currentTime -
              clamped
          ) > 0.003
        ) {
          video.currentTime =
            clamped;
        }
      } catch {
        /*
         * Ничего.
         *
         * На мобильном этот код
         * вообще не используется.
         */
      }
    };

    /*
     * Плавное движение десктопного видео.
     */
    const tick = (now) => {
      if (disposed) {
        return;
      }

      const dt =
        Math.min(
          100,
          now -
            (lastTick || now)
        );

      lastTick = now;

      const smoothing =
        1 -
        (1 - SMOOTHING) **
          (dt / 16.667);

      shown +=
        (target - shown) *
        smoothing;

      if (
        Math.abs(
          target - shown
        ) < 0.0005
      ) {
        shown = target;

        rafId = null;
        lastTick = 0;
      } else {
        rafId =
          requestAnimationFrame(
            tick
          );
      }

      seekVideo(
        filmTime(
          shown,
          video.duration
        )
      );

      progressCb.current?.(
        shown
      );
    };

    const kick = () => {
      if (
        rafId === null &&
        !disposed
      ) {
        rafId =
          requestAnimationFrame(
            tick
          );
      }
    };

    /*
     * ScrollTrigger для desktop.
     */
    const trigger =
      ScrollTrigger.create({
        trigger:
          document.documentElement,

        start: 'top top',

        end: 'bottom bottom',

        onUpdate: (self) => {
          target =
            self.progress;

          kick();
        },
      });

    /*
     * Метаданные видео готовы.
     */
    const handleLoadedMetadata =
      () => {
        if (disposed) {
          return;
        }

        metadataReady = true;

        seekVideo(
          filmTime(
            target,
            video.duration
          )
        );
      };

    /*
     * Видео можно отображать.
     */
    const handleCanPlay = () => {
      if (disposed) {
        return;
      }

      stage.classList.add(
        'is-video-ready'
      );

      setRing(1);
    };

    /*
     * Обновляем индикатор загрузки.
     */
    const handleProgress = () => {
      if (disposed) {
        return;
      }

      try {
        if (
          video.duration &&
          video.buffered.length
        ) {
          const end =
            video.buffered.end(
              video.buffered.length - 1
            );

          setRing(
            Math.min(
              1,
              end /
                video.duration
            )
          );
        }
      } catch {
        // Ничего.
      }
    };

    /*
     * Ошибка видео.
     */
    const handleError = () => {
      metadataReady = false;

      stage.classList.remove(
        'is-video-ready'
      );

      stage.classList.add(
        'is-video-failed'
      );
    };

    /*
     * Desktop video.
     */
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    video.src = src;

    if (poster) {
      video.poster = poster;
    }

    video.addEventListener(
      'loadedmetadata',
      handleLoadedMetadata
    );

    video.addEventListener(
      'canplay',
      handleCanPlay
    );

    video.addEventListener(
      'progress',
      handleProgress
    );

    video.addEventListener(
      'error',
      handleError
    );

    video.load();

    progressCb.current?.(0);

    return () => {
      disposed = true;

      if (rafId !== null) {
        cancelAnimationFrame(
          rafId
        );
      }

      trigger.kill();

      video.removeEventListener(
        'loadedmetadata',
        handleLoadedMetadata
      );

      video.removeEventListener(
        'canplay',
        handleCanPlay
      );

      video.removeEventListener(
        'progress',
        handleProgress
      );

      video.removeEventListener(
        'error',
        handleError
      );

      video.pause();

      video.removeAttribute(
        'src'
      );

      video.load();

      stage.classList.remove(
        'is-video-ready',
        'is-video-failed'
      );
    };
  }, [
    enabled,
    src,
    poster,
    stageRef,
    videoRef,
    frameRef,
    ringRef,
  ]);
}