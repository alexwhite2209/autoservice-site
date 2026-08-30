import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Сглаживание движения видео за кадр. */
const SMOOTHING = 0.16;

/** Длина окружности кольца загрузки: r=20 → 2πr ≈ 126. */
const RING_LENGTH = 126;

/**
 * Прогресс страницы → время видео, «туда и обратно».
 */
export const filmTime = (progress, duration) =>
  progress <= 0.5
    ? progress * 2 * duration
    : (1 - progress) * 2 * duration;

/**
 * Связывает прокрутку страницы с временем видео.
 *
 * Видео загружается напрямую браузером, без fetch → Blob.
 * Это особенно важно для мобильных браузеров.
 *
 * Скролл управляет currentTime.
 * Само видео никогда не проигрывается автоматически.
 */
export function useFilmScrub({
  enabled,
  stageRef,
  videoRef,
  ringRef,
  src,
  poster,
  bytes,
  onProgress,
}) {
  const progressCb = useRef(onProgress);
  progressCb.current = onProgress;

  useEffect(() => {
    if (!enabled) return undefined;

    const stage = stageRef.current;
    const video = videoRef.current;

    if (!stage || !video) return undefined;

    let disposed = false;

    let target = 0;
    let shown = 0;

    let rafId = null;
    let lastTick = 0;

    let metadataReady = false;

    /* -------------------------------------------------
       ПРОГРЕСС КОЛЬЦА
    ------------------------------------------------- */

    const setRing = (fraction) => {
      const ring = ringRef.current;

      if (!ring) return;

      const safeFraction = Math.max(0, Math.min(1, fraction));

      ring.style.setProperty(
        '--ring-offset',
        String(
          Math.round(
            RING_LENGTH * (1 - safeFraction)
          )
        )
      );
    };

    /* -------------------------------------------------
       ОШИБКА ВИДЕО
    ------------------------------------------------- */

    const failVideo = () => {
      if (disposed) return;

      stage.classList.remove('is-video-ready');
      stage.classList.add('is-video-failed');
    };

    /* -------------------------------------------------
       ПЕРЕМОТКА
    ------------------------------------------------- */

    const seekVideo = (time) => {
      if (disposed || !metadataReady) return;

      const duration = video.duration;

      if (!Number.isFinite(duration) || duration <= 0) {
        return;
      }

      const clamped = Math.max(
        0,
        Math.min(duration - 0.001, time)
      );

      /*
       * Не пытаемся запускать воспроизведение.
       *
       * currentTime работает как скраб:
       * пользователь двигает страницу → меняется кадр.
       */

      try {
        if (Math.abs(video.currentTime - clamped) > 0.003) {
          video.currentTime = clamped;
        }
      } catch {
        // Некоторые мобильные браузеры могут временно
        // отклонить перемотку во время подготовки видео.
      }
    };

    /* -------------------------------------------------
       ПЛАВНОЕ ДВИЖЕНИЕ
    ------------------------------------------------- */

    const tick = (now) => {
      if (disposed) return;

      const dt = Math.min(
        100,
        now - (lastTick || now)
      );

      lastTick = now;

      const smoothing =
        1 -
        (1 - SMOOTHING) **
          (dt / 16.667);

      shown +=
        (target - shown) * smoothing;

      if (
        Math.abs(target - shown) <
        0.0005
      ) {
        shown = target;

        rafId = null;
        lastTick = 0;
      } else {
        rafId =
          requestAnimationFrame(tick);
      }

      if (metadataReady) {
        seekVideo(
          filmTime(
            shown,
            video.duration
          )
        );
      }

      progressCb.current?.(shown);
    };

    const kick = () => {
      if (
        rafId === null &&
        !disposed
      ) {
        rafId =
          requestAnimationFrame(tick);
      }
    };

    /* -------------------------------------------------
       SCROLLTRIGGER
    ------------------------------------------------- */

    const trigger =
      ScrollTrigger.create({
        trigger:
          document.documentElement,

        start: 'top top',
        end: 'bottom bottom',

        onUpdate: (self) => {
          target = self.progress;

          kick();
        },
      });

    /* -------------------------------------------------
       VIDEO METADATA
    ------------------------------------------------- */

    const handleLoadedMetadata = () => {
      if (disposed) return;

      metadataReady = true;

      /*
       * В этот момент браузер уже знает:
       * - duration
       * - размеры видео
       * - структуру MP4
       */

      seekVideo(
        filmTime(
          target,
          video.duration
        )
      );

      stage.classList.add(
        'is-video-ready'
      );

      setRing(1);
    };

    /* -------------------------------------------------
       VIDEO CANPLAY
    ------------------------------------------------- */

    const handleCanPlay = () => {
      if (disposed) return;

      stage.classList.add(
        'is-video-ready'
      );
    };

    /* -------------------------------------------------
       ПРОГРЕСС ЗАГРУЗКИ
    ------------------------------------------------- */

    const handleProgress = () => {
      if (disposed) return;

      /*
       * Для прямого video.src браузер сам управляет
       * загрузкой и Range Requests.
       *
       * У некоторых браузеров buffered может быть
       * доступен сразу, у некоторых — нет.
       */

      try {
        if (
          video.duration &&
          video.buffered.length
        ) {
          const bufferedEnd =
            video.buffered.end(
              video.buffered.length - 1
            );

          const fraction = Math.min(
            1,
            bufferedEnd /
              video.duration
          );

          setRing(fraction);
        }
      } catch {
        // Ничего страшного.
        // Загрузка видео продолжится штатно.
      }
    };

    /* -------------------------------------------------
       ОШИБКА
    ------------------------------------------------- */

    const handleVideoError = () => {
      metadataReady = false;
      failVideo();
    };

    /* -------------------------------------------------
       НАСТРОЙКА VIDEO
    ------------------------------------------------- */

    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    /*
     * Критически важно:
     *
     * НЕ fetch()
     * НЕ Blob
     * НЕ createObjectURL()
     *
     * Мобильный браузер получает оригинальный MP4
     * напрямую и сам управляет буферизацией.
     */

    video.src = src;

    /* Poster используется самим video. */
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
      handleVideoError
    );

    setRing(0);

    progressCb.current?.(0);

    /*
     * load() запускает загрузку после назначения src.
     */
    video.load();

    /* -------------------------------------------------
       CLEANUP
    ------------------------------------------------- */

    return () => {
      disposed = true;

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
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
        handleVideoError
      );

      video.pause();

      video.removeAttribute(
        'src'
      );

      video.removeAttribute(
        'poster'
      );

      video.load();

      metadataReady = false;

      stage.classList.remove(
        'is-video-ready',
        'is-video-failed'
      );
    };
  }, [
    enabled,
    src,
    poster,
    bytes,
    stageRef,
    videoRef,
    ringRef,
  ]);
}