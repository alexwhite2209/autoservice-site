import { useRef, useState } from 'react';
import { Lines } from './Lines.jsx';
import { useReveal } from '../hooks/useReveal.js';
import { useParallax } from '../hooks/useParallax.js';
import { MEDIA } from '../data/site.js';
import '../styles/before-after.css';

/**
 * 05 — ДО И ПОСЛЕ.
 *
 * Управление построено вокруг настоящего input[type=range]. Он невидим,
 * растянут на всю ширину и лежит поверх кадров. Так мышь, палец и
 * клавиатура работают сами по себе, без единого обработчика перетаскивания,
 * и требование «у перетаскивания должна быть альтернатива» выполняется
 * не заплаткой, а самой конструкцией.
 */
export function BeforeAfter() {
  const revealRef = useReveal();
  const leadRef = useRef(null);
  useParallax(leadRef, 3);
  const [position, setPosition] = useState(50);

  return (
    <section id="compare" className="section compare">
      <div className="section__inner reveal" ref={revealRef}>
        <header className="compare__head">
          <p className="section__kicker r-item" style={{ '--reveal-delay': '0ms' }}>
            <span>04</span>
          </p>
          <h2 className="section__title">
            <Lines lines={['ДО И ПОСЛЕ']} delay={120} />
          </h2>
          <div className="compare__lead-drift" ref={leadRef}>
            <p
              className="section__lead compare__lead r-item"
              style={{ '--reveal-delay': '260ms' }}
            >
              Наглядный результат
              <br />
              нашей работы.
            </p>
          </div>
        </header>

        <figure
          className="compare__figure r-item"
          style={{ '--reveal-delay': '300ms', '--pos': `${position}%` }}
        >
          <div className="compare__viewport">
            <img
              className="compare__image compare__image--before"
              src={MEDIA.compareBefore}
              alt="Тормозной узел до ремонта"
              width="1600"
              height="1000"
              loading="lazy"
              decoding="async"
            />

            {/* Верхний кадр подрезается по позиции разделителя. */}
            <div className="compare__after-clip">
              <img
                className="compare__image compare__image--after"
                src={MEDIA.compareAfter}
                alt="Тот же тормозной узел после ремонта"
                width="1600"
                height="1000"
                loading="lazy"
                decoding="async"
              />
            </div>

            <span className="compare__tag compare__tag--before" aria-hidden="true">
              ДО
            </span>
            <span className="compare__tag compare__tag--after" aria-hidden="true">
              ПОСЛЕ
            </span>

            <span className="compare__divider" aria-hidden="true">
              <span className="compare__handle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="m9 6-5 6 5 6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="m15 6 5 6-5 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </span>

            <input
              className="compare__range"
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={position}
              onChange={(event) => setPosition(Number(event.target.value))}
              aria-label="Сравнение до и после: сдвиньте разделитель"
              aria-valuetext={`Показано ${Math.round(position)} процентов кадра после ремонта`}
            />
          </div>
        </figure>
      </div>
    </section>
  );
}
