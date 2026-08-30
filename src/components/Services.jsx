import { useRef, useState } from 'react';
import { Lines } from './Lines.jsx';
import { useReveal } from '../hooks/useReveal.js';
import { useParallax } from '../hooks/useParallax.js';
import { CONTACTS, SERVICES } from '../data/site.js';
import '../styles/services.css';

function ArrowIcon() {
  return (
    <svg
      className="services__arrow-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M4 12h15" strokeLinecap="round" />
      <path d="m13 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 03 — ЧТО МЫ ДЕЛАЕМ. Не карточки, а крупный вертикальный список. */
export function Services() {
  const revealRef = useReveal();
  const leadRef = useRef(null);
  useParallax(leadRef, 3);

  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section id="services" className="section services">
      <div className="section__inner reveal" ref={revealRef}>
        <header className="services__head">
          <p className="section__kicker r-item" style={{ '--reveal-delay': '0ms' }}>
            <span>02</span>
          </p>

          <h2 className="section__title">
            <Lines lines={['ЧТО МЫ', 'ДЕЛАЕМ']} delay={120} />
          </h2>

          <div className="services__lead-drift" ref={leadRef}>
            <p
              className="section__lead services__lead r-item"
              style={{ '--reveal-delay': '260ms' }}
            >
              Решаем проблемы любой сложности.
              <br />
              Быстро. Честно.
              <br />
              С гарантией.
            </p>
          </div>
        </header>

        <div className="services__body">
          {/* Панель предпросмотра — украшение: та же информация есть
              в строке рядом, поэтому читалке она не нужна. */}
          <div className="services__preview r-item" aria-hidden="true">
            {SERVICES.map((service, index) => (
              <img
                key={service.num}
                className={`services__preview-image${
                  index === activeIndex ? ' is-active' : ''
                }`}
                src={service.image}
                alt=""
                width="1600"
                height="900"
                loading="lazy"
                decoding="async"
              />
            ))}
            <span className="services__preview-frame" />
          </div>

          <ul className="services__list">
            {SERVICES.map((service, index) => (
              <li
                className={`services__row r-item${index === activeIndex ? ' is-active' : ''}`}
                key={service.num}
                style={{ '--reveal-delay': `${340 + index * 110}ms` }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <a
                  className="services__link"
                  href={CONTACTS.phoneHref}
                  onFocus={() => setActiveIndex(index)}
                  aria-label={`${service.title}. ${service.description}. Позвонить: ${CONTACTS.phoneDisplay}`}
                >
                  <span className="services__num" aria-hidden="true">
                    {service.num}
                  </span>

                  <span className="services__text">
                    <span className="services__title">{service.title}</span>
                    <span className="services__desc">{service.description}</span>
                  </span>

                  <img
                    className="services__thumb"
                    src={service.image}
                    alt=""
                    width="1600"
                    height="900"
                    loading="lazy"
                    decoding="async"
                  />

                  <span className="services__arrow" aria-hidden="true">
                    <ArrowIcon />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
