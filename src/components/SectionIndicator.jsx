import { useEffect, useState } from 'react';
import { SECTIONS } from '../data/site.js';
import '../styles/section-indicator.css';

/**
 * Вертикальный указатель текущего положения. Только на больших экранах:
 * на телефоне он отнимал бы место и ничего не давал.
 */
export function SectionIndicator() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id);

  useEffect(() => {
    const elements = SECTIONS.map((section) =>
      document.getElementById(section.id)
    ).filter(Boolean);

    if (!elements.length) return undefined;

    // Секция считается текущей, когда пересекает середину экрана.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-48% 0px -48% 0px', threshold: 0 }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="indicator" aria-label="Положение на странице">
      <ol className="indicator__list">
        {SECTIONS.map((section) => {
          const isActive = section.id === activeId;
          return (
            <li className="indicator__item" key={section.id}>
              <a
                className={`indicator__link${isActive ? ' is-active' : ''}`}
                href={`#${section.id}`}
                aria-current={isActive ? 'true' : undefined}
              >
                <span className="indicator__dot" aria-hidden="true" />
                <span className="indicator__num" aria-hidden="true">
                  {section.num}
                </span>
                <span className="visually-hidden">{section.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
