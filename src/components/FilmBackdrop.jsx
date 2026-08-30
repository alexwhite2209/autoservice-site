import { useCallback, useRef } from 'react';
import { useFilmScrub } from '../hooks/useFilmScrub.js';
import { MEDIA } from '../data/site.js';
import '../styles/film.css';

/**
 * Фильм под всей страницей.
 *
 * Слой закреплён на экране, содержимое сайта скользит поверх него.
 * Прокрутка всей страницы гонит время видео: первую половину вперёд,
 * вторую обратно, поэтому к низу страницы машина снова собрана.
 */
export function FilmBackdrop({ enabled }) {
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const ringRef = useRef(null);
  const barRef = useRef(null);
  const barCache = useRef(-1);

  const onProgress = useCallback((progress) => {
    if (!barRef.current) return;
    // В DOM пишем только при изменении: иначе каждый кадр трогает стили.
    if (Math.abs(progress - barCache.current) <= 0.004) return;
    barCache.current = progress;
    barRef.current.style.transform = `scaleX(${progress.toFixed(3)})`;
  }, []);

  useFilmScrub({
    enabled,
    stageRef,
    videoRef,
    ringRef,
    src: MEDIA.heroVideo,
    poster: MEDIA.heroPoster,
    bytes: MEDIA.heroVideoBytes,
    onProgress,
  });

  return (
    <div className="film" ref={stageRef} aria-hidden="true">
      <div
        className="film__poster"
        style={{ backgroundImage: `url(${MEDIA.heroPoster})` }}
      />

      {/* Видео здесь декорация: озвучивать его читалке нечем,
          и в обход клавиатуры оно тоже не нужно. */}
      {enabled ? (
        <video
          className="film__video"
          ref={videoRef}
          preload="auto"
          muted
          playsInline
          tabIndex={-1}
        />
      ) : null}

      {/* Постоянная цветокоррекция. Она одинаковая на всём фильме и не
          реагирует на появление текста, поэтому кадр не «моргает». */}
      <div className="film__grade" />

      {enabled ? (
        <>
          <svg className="film__ring" viewBox="0 0 48 48" ref={ringRef}>
            <circle
              className="film__ring-track"
              cx="24"
              cy="24"
              r="20"
              fill="none"
              strokeWidth="2"
            />
            <circle
              className="film__ring-arc"
              cx="24"
              cy="24"
              r="20"
              fill="none"
              strokeWidth="2"
              strokeDasharray="126"
            />
          </svg>

          <span className="film__progress">
            <span className="film__progress-bar" ref={barRef} />
          </span>
        </>
      ) : null}
    </div>
  );
}
