import { useCallback, useRef } from 'react';
import { useFilmScrub } from '../hooks/useFilmScrub.js';
import { MEDIA } from '../data/site.js';
import '../styles/film.css';

export function FilmBackdrop({ enabled }) {
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const frameRef = useRef(null);
  const ringRef = useRef(null);
  const barRef = useRef(null);
  const barCache = useRef(-1);

  const onProgress = useCallback((progress) => {
    if (!barRef.current) return;

    if (
      Math.abs(progress - barCache.current) <= 0.004
    ) {
      return;
    }

    barCache.current = progress;

    barRef.current.style.transform =
      `scaleX(${progress.toFixed(3)})`;
  }, []);

  useFilmScrub({
    enabled,
    stageRef,
    videoRef,
    frameRef,
    ringRef,
    src: MEDIA.heroVideo,
    poster: MEDIA.heroPoster,
    onProgress,
  });

  return (
    <div
      className="film"
      ref={stageRef}
      aria-hidden="true"
    >
      <div
        className="film__poster"
        style={{
          backgroundImage:
            `url(${MEDIA.heroPoster})`,
        }}
      />

      {enabled ? (
        <>
          <video
            className="film__video"
            ref={videoRef}
            preload="auto"
            muted
            playsInline
            tabIndex={-1}
          />

          <div
            className="film__mobile-frame"
            ref={frameRef}
          />
        </>
      ) : null}

      <div className="film__grade" />

      {enabled ? (
        <>
          <svg
            className="film__ring"
            viewBox="0 0 48 48"
            ref={ringRef}
          >
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
            <span
              className="film__progress-bar"
              ref={barRef}
            />
          </span>
        </>
      ) : null}
    </div>
  );
}