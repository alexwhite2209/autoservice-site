import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Сглаживание за один кадр при 60 к/с. Подбиралось на ощупь при скрабе. */
const SMOOTHING = 0.16;
/** Длина окружности кольца загрузки: r=20 → 2πr ≈ 126. */
const RING_LENGTH = 126;
/** Столько миллисекунд без единого байта считаем зависшей загрузкой. */
const STALL_MS = 20000;

/**
 * Связывает прокрутку с временем видео.
 *
 * Четыре правила, каждое из которых закрывает реальную поломку:
 *
 * 1. Видео тянется целиком как Blob. Многие хостинги молча не поддерживают
 *    частичную загрузку, и тогда любая перемотка схлопывается в ноль:
 *    локально всё работает, на живом сайте скролл не двигает картинку.
 * 2. Отображаемое время догоняет целевое плавно, а не переписывается
 *    напрямую. Коэффициент нормализован по времени кадра, иначе на экране
 *    120 Гц сайт ощущается вдвое резче, чем на 60 Гц.
 * 3. Новая перемотка не отправляется, пока не завершилась предыдущая.
 *    Наложенные перемотки — это ровно та разница между «плавно» и «рвано»,
 *    которую видно в Chrome.
 * 4. Цикл засыпает: и когда догнал цель, и когда первый экран ушёл из виду.
 */
export function useScrollScrub({
  enabled,
  containerRef,
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

    const container = containerRef.current;
    const stage = stageRef.current;
    const video = videoRef.current;
    if (!container || !stage || !video) return undefined;

    let disposed = false;
    let target = 0;
    let shown = 0;
    let rafId = null;
    let lastTick = 0;
    let heroOnScreen = true;
    let seekBusy = false;
    let pendingTime = null;
    let objectUrl = null;
    let controller = null;
    let posterTimer = 0;
    let fetchStarted = false;

    /* ---------- шлюз перемоток ---------- */

    const requestSeek = (time) => {
      const duration = video.duration;
      if (!duration || Number.isNaN(duration)) return;
      const clamped = Math.min(duration - 0.001, Math.max(0, time));
      if (seekBusy) {
        pendingTime = clamped; // коалесценция: держим только самое свежее
        return;
      }
      seekBusy = true;
      try {
        video.currentTime = clamped;
      } catch {
        seekBusy = false;
      }
    };

    const handleSeeked = () => {
      seekBusy = false;
      if (pendingTime === null) return;
      const next = pendingTime;
      pendingTime = null;
      requestSeek(next); // ровно одна догоняющая перемотка
    };

    /* ---------- цикл, который умеет спать ---------- */

    const tick = (now) => {
      if (disposed) return;
      const dt = Math.min(100, now - (lastTick || now));
      lastTick = now;

      shown += (target - shown) * (1 - (1 - SMOOTHING) ** (dt / 16.667));

      if (Math.abs(target - shown) < 0.0005) {
        shown = target;
        rafId = null;
        lastTick = 0;
      } else {
        rafId = requestAnimationFrame(tick);
      }

      requestSeek(shown * (video.duration || 0));
      progressCb.current?.(shown);
    };

    const kick = () => {
      if (rafId === null && heroOnScreen && !disposed) {
        rafId = requestAnimationFrame(tick);
      }
    };

    /* ---------- прогресс прокрутки ---------- */

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        target = self.progress;
        kick();
      },
      onToggle: (self) => {
        heroOnScreen = self.isActive;
        if (self.isActive) kick();
      },
    });

    /* ---------- загрузка ---------- */

    const setRing = (fraction) => {
      const ring = ringRef.current;
      if (!ring) return;
      ring.style.setProperty(
        '--ring-offset',
        String(Math.round(RING_LENGTH * (1 - fraction)))
      );
    };

    const failVideo = () => {
      if (disposed) return;
      // Кольцо не должно застыть навсегда: это хуже, чем его отсутствие.
      stage.classList.remove('is-video-ready');
      stage.classList.add('is-video-failed');
    };

    const loadHeroBlob = async () => {
      controller = new AbortController();
      let watchdog = setTimeout(() => controller.abort(), STALL_MS);

      const response = await fetch(src, {
        priority: 'low',
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`video ${response.status}`);

      const total = Number(response.headers.get('Content-Length')) || bytes || 0;
      const reader = response.body.getReader();
      const chunks = [];
      let received = 0;
      let lastRingWrite = 0;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        clearTimeout(watchdog);
        watchdog = setTimeout(() => controller.abort(), STALL_MS);

        chunks.push(value);
        received += value.length;

        if (total) {
          const fraction = Math.min(1, received / total);
          const now = performance.now();
          // Пишем не чаще 10 раз в секунду, но последнюю запись
          // пропускаем всегда, иначе кольцо не дойдёт до конца.
          if (now - lastRingWrite > 100 || fraction === 1) {
            lastRingWrite = now;
            setRing(fraction);
          }
        }
      }

      clearTimeout(watchdog);
      setRing(1);
      if (disposed) return;

      objectUrl = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }));
      video.src = objectUrl;
      video.load();

      video.addEventListener(
        'canplay',
        () => {
          if (disposed) return;
          requestSeek(target * (video.duration || 0));
          stage.classList.add('is-video-ready');
        },
        { once: true }
      );
    };

    const startBlobFetch = () => {
      if (fetchStarted || disposed) return;
      fetchStarted = true;
      loadHeroBlob().catch(failVideo);
    };

    const handleVideoError = () => {
      seekBusy = false;
      pendingTime = null;
      failVideo();
    };

    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleVideoError);

    // Постер выигрывает гонку за канал намеренно: сначала он, потом Blob.
    const posterImage = new Image();
    posterImage.onload = startBlobFetch;
    posterImage.onerror = startBlobFetch;
    posterImage.src = poster;
    // Страховка: зависший постер не должен держать видео вечно.
    posterTimer = window.setTimeout(startBlobFetch, 4000);

    progressCb.current?.(0);

    return () => {
      disposed = true;
      window.clearTimeout(posterTimer);
      if (controller) controller.abort();
      if (rafId !== null) cancelAnimationFrame(rafId);
      trigger.kill();
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleVideoError);
      video.removeAttribute('src');
      video.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      stage.classList.remove('is-video-ready', 'is-video-failed');
    };
  }, [enabled, src, poster, bytes, containerRef, stageRef, videoRef, ringRef]);
}
