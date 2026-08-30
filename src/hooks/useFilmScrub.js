import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SMOOTHING = 0.16;
const RING_LENGTH = 126;

const MOBILE_SHEETS = 12;
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
 */
export const filmTime = (progress, duration) =>
  progress <= 0.5
    ? progress * 2 * duration
    : (1 - progress) * 2 * duration;

/**
 * Прогресс страницы → кадр мобильного спрайта.
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
 */
const sheetUrl = (sheetIndex) => {
  const number = String(sheetIndex).padStart(2, '0');

  return `${import.meta.env.BASE_URL}assets/mobile-scrub/sheet_${number}.webp`;
};

/**
 * Устанавливает конкретный кадр внутри sprite sheet.
 *
 * Каждый sheet:
 *
 * 2 колонки
 * 5 рядов
 * 10 кадров
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
   * Каждый кадр: 640×360 = 16:9.
   * Sprite: 1280×1800 = 2×5 кадров.
   *
   * Масштабируем sprite по высоте.
   * На вертикальном телефоне лишнее
   * по бокам автоматически обрезается.
   */

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const spriteWidth =
    (1280 / 1800 * 5 * viewportHeight) /
    viewportWidth;

  const frameWidth =
    (640 / 1800 * 5 * viewportHeight) /
    viewportWidth;

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
    if (!enabled) return undefined;

    const stage = stageRef.current;
    const video = videoRef.current;
    const frame = frameRef.current;

    if (!stage) return undefined;

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
       * Загружаем ВСЕ 12 sprite sheets сразу.
       *
       * Каждый лист содержит 10 готовых кадров.
       *
       * Всего 2.4 МБ — для мобильного это намного легче,
       * чем постоянный seek H.264.
       */

      let loaded = 0;

      const handleSheetLoaded = () => {
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

        if (
          loaded === MOBILE_SHEETS &&
          !disposed
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

      for (
        let i = 0;
        i < MOBILE_SHEETS;
        i += 1
      ) {
        const image = new Image();

        image.onload =
          handleSheetLoaded;

        image.onerror =
          handleSheetLoaded;

        image.src =
          sheetUrl(i);

        images.push(image);
      }

      /*
       * Первоначальный кадр.
       */
      showMobileFrame(frame, 0);

      const tickMobile = (now) => {
        if (disposed) return;

        const dt = Math.min(
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

      if (!ring) return;

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
        // Мобильный режим сюда не попадает.
      }
    };

    const tick = (now) => {
      if (disposed) return;

      const dt = Math.min(
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

    const handleLoadedMetadata =
      () => {
        if (disposed) return;

        metadataReady = true;

        seekVideo(
          filmTime(
            target,
            video.duration
          )
        );
      };

    const handleCanPlay = () => {
      if (disposed) return;

      stage.classList.add(
        'is-video-ready'
      );

      setRing(1);
    };

    const handleProgress = () => {
      if (disposed) return;

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

    const handleError = () => {
      metadataReady = false;

      stage.classList.remove(
        'is-video-ready'
      );

      stage.classList.add(
        'is-video-failed'
      );
    };

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
      video.removeAttribute('src');
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