import { useEffect, useState } from 'react';
import { Preloader } from './components/Preloader.jsx';
import { Header } from './components/Header.jsx';
import { SectionIndicator } from './components/SectionIndicator.jsx';
import { FilmBackdrop } from './components/FilmBackdrop.jsx';
import { FilmCaption } from './components/FilmCaption.jsx';
import { Hero } from './components/Hero.jsx';
import { Services } from './components/Services.jsx';
import { TechnicalCar } from './components/TechnicalCar.jsx';
import { BeforeAfter } from './components/BeforeAfter.jsx';
import { Contact } from './components/Contact.jsx';
import { Footer } from './components/Footer.jsx';
import { useScrubGate } from './hooks/useScrubGate.js';
import { FILM_CAPTIONS } from './data/site.js';

export default function App() {
  const scrubEnabled = useScrubGate();
  const [introDone, setIntroDone] = useState(false);

  // Скрытая вкладка не должна крутить анимации. Правило вешается на body,
  // потому что animation-play-state не наследуется и до вложенных
  // элементов и псевдоэлементов иначе не доходит.
  useEffect(() => {
    const sync = () => {
      document.body.classList.toggle('is-hidden', document.hidden);
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  const [apart, deeper, cause, fix] = FILM_CAPTIONS;

  return (
    <>
      {/* Заставка снимается сама и после себя отдаёт страницу. */}
      {!introDone ? <Preloader onFinish={() => setIntroDone(true)} /> : null}

      <a className="skip-link" href="#main">
        К содержанию
      </a>

      {/* Фильм под всей страницей. Секции скользят поверх него. */}
      <FilmBackdrop enabled={scrubEnabled} />

      <Header />
      <SectionIndicator />

      <main id="main" tabIndex={-1}>
        <Hero scrubEnabled={scrubEnabled} />

        {/* Окна между секциями: здесь фильм виден целиком. */}
        {scrubEnabled ? <FilmCaption caption={apart} /> : null}
        <Services />

        {scrubEnabled ? <FilmCaption caption={deeper} /> : null}
        <TechnicalCar />

        {scrubEnabled ? <FilmCaption caption={cause} /> : null}
        <BeforeAfter />

        {scrubEnabled ? <FilmCaption caption={fix} /> : null}
        <Contact />
      </main>

      <Footer />
    </>
  );
}
