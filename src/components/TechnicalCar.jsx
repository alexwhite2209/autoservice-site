import { useRef } from 'react';
import { Lines } from './Lines.jsx';
import { useReveal } from '../hooks/useReveal.js';
import { useParallax } from '../hooks/useParallax.js';
import { CAR_HOTSPOTS, MEDIA } from '../data/site.js';
import '../styles/technical-car.css';

/**
 * 04 — ВИДИМ ГЛАВНОЕ.
 *
 * Фотография разобранного автомобиля с наложенными точками узлов.
 *
 * Выноски рисуются в SVG с системой координат 0..100 и растяжением по обеим
 * осям, поэтому проценты из данных попадают ровно туда, куда нужно, при любых
 * пропорциях кадра. Толщину линий это не портит: non-scaling-stroke считает
 * её после растяжения. Точки и подписи — обычные элементы, поэтому кружки
 * остаются круглыми, а типографика настоящей.
 */
export function TechnicalCar() {
  const revealRef = useReveal({ threshold: 0.2, settleMs: 3400 });
  const leadRef = useRef(null);
  // Параллакс висит на обёртке, а не на самом кадре: точки узлов заданы
  // в процентах от кадра, и любой сдвиг картинки внутри рамки увёл бы их
  // с реальных деталей.
  const figureRef = useRef(null);
  useParallax(leadRef, 3);
  useParallax(figureRef, 4);

  return (
    <section id="technical" className="section section--alt tcar">
      <div className="section__inner reveal" ref={revealRef}>
        <header className="tcar__head">
          <p className="section__kicker r-item" style={{ '--reveal-delay': '0ms' }}>
            <span>03</span>
          </p>
          <h2 className="section__title">
            <Lines lines={['ВИДИМ', 'ГЛАВНОЕ']} delay={120} />
          </h2>
          <div className="tcar__lead-drift" ref={leadRef}>
            <p className="section__lead tcar__lead r-item" style={{ '--reveal-delay': '260ms' }}>
              Современное оборудование
              <br />
              позволяет точно определить
              <br />
              неисправность.
            </p>
          </div>
        </header>

        <div className="tcar__stage">
          <div className="tcar__figure-drift" ref={figureRef}>
          <figure className="tcar__figure r-item" style={{ '--reveal-delay': '340ms' }}>
            <img
              className="tcar__photo"
              src={MEDIA.technicalCar}
              alt="Автомобиль с снятыми панелями и колёсами: открыты двигатель, тормозной механизм, подвеска и салон"
              width="1600"
              height="900"
              loading="lazy"
              decoding="async"
            />

            {/* Один живой элемент секции: мягкий проход света по кадру */}
            <span className="tcar__scan" aria-hidden="true" />

            <svg
              className="tcar__leaders"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {CAR_HOTSPOTS.map((spot, index) => (
                <polyline
                  className="tcar__leader"
                  key={spot.id}
                  style={{ '--i': index }}
                  points={`${spot.point.x},${spot.point.y} ${spot.elbow.x},${spot.elbow.y} ${spot.edge.x},${spot.edge.y}`}
                  pathLength="1"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>

            <div className="tcar__overlay" aria-hidden="true">
              {CAR_HOTSPOTS.map((spot, index) => (
                <span
                  className="tcar__point"
                  key={spot.id}
                  style={{
                    '--i': index,
                    left: `${spot.point.x}%`,
                    top: `${spot.point.y}%`,
                  }}
                >
                  <span className="tcar__halo" />
                  <span className="tcar__dot" />
                </span>
              ))}

              {CAR_HOTSPOTS.map((spot, index) => (
                <div
                  className={`tcar__label tcar__label--${spot.side}`}
                  key={spot.id}
                  style={{
                    '--i': index,
                    top: `${spot.edge.y}%`,
                    ...(spot.side === 'left'
                      ? { right: `${100 - spot.edge.x}%` }
                      : { left: `${spot.edge.x}%` }),
                  }}
                >
                  <span className="tcar__label-title">{spot.title}</span>
                  <span className="tcar__label-desc">{spot.description}</span>
                </div>
              ))}
            </div>
          </figure>
          </div>

          {/* Тот же смысл словами: для читалок всегда, на узких экранах — глазами. */}
          <ul className="tcar__legend">
            {CAR_HOTSPOTS.map((spot) => (
              <li className="tcar__legend-item" key={spot.id}>
                <span className="tcar__legend-dot" aria-hidden="true" />
                <span className="tcar__legend-text">
                  <strong className="tcar__legend-title">{spot.title}</strong>
                  <span className="tcar__legend-desc">{spot.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
