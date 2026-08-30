import { BandText } from './BandText.jsx';
import { useReveal } from '../hooks/useReveal.js';
import '../styles/film.css';

/**
 * Окно между секциями: содержимого нет, виден только фильм, и в одном из
 * углов стоит короткая реплика. Именно здесь страница даёт видео дышать.
 */
export function FilmCaption({ caption }) {
  const revealRef = useReveal({ threshold: 0.4, settleMs: 1600 });

  return (
    <section
      className={`window window--${caption.anchor}`}
      data-caption={caption.id}
      aria-label={caption.text}
    >
      <div className="window__inner reveal" ref={revealRef}>
        <p className="window__caption r-item">
          <span className="window__rule" aria-hidden="true" />
          <BandText lines={[caption.text]} entrance={caption.entrance} seed={31} />
        </p>
      </div>
    </section>
  );
}
