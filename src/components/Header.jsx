import { useEffect, useRef } from 'react';
import { Logo } from './Logo.jsx';
import { CONTACTS, NAV } from '../data/site.js';
import '../styles/header.css';

/** Шапка: минималистичная сверху, компактная и с подложкой после прокрутки. */
export function Header() {
  const headerRef = useRef(null);
  const compact = useRef(false);

  useEffect(() => {
    const element = headerRef.current;
    if (!element) return undefined;

    const onScroll = () => {
      const next = window.scrollY > 48;
      // Класс переключается только при смене состояния, а не каждый кадр.
      if (next === compact.current) return;
      compact.current = next;
      element.classList.toggle('is-compact', next);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="header" ref={headerRef}>
      <div className="header__inner">
        <a className="header__logo" href="#hero" aria-label="В начало страницы">
          <Logo />
        </a>

        <nav className="header__nav" aria-label="Разделы страницы">
          <ul className="header__nav-list">
            {NAV.map((item) => (
              <li key={item.href}>
                <a className="header__nav-link" href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header__contact">
          <a className="header__phone" href={CONTACTS.phoneHref}>
            {CONTACTS.phoneDisplay}
          </a>
          <a className="btn btn--primary header__call" href={CONTACTS.phoneHref}>
            ПОЗВОНИТЬ
          </a>
        </div>
      </div>
    </header>
  );
}
