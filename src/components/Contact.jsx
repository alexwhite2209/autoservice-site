import { Lines } from './Lines.jsx';
import { useReveal } from '../hooks/useReveal.js';
import { CONTACTS } from '../data/site.js';
import '../styles/contact.css';

/** 06 — КОНТАКТЫ. Никакой формы: единственное действие — звонок. */
export function Contact() {
  const revealRef = useReveal();

  return (
    // Секция намеренно прозрачная: к этому месту фильм откручен обратно
    // до начала, и за текстом видно снова собранную машину.
    <section id="contact" className="section section--open contact">
      <div className="section__inner contact__inner reveal" ref={revealRef}>
        <p className="section__kicker r-item" style={{ '--reveal-delay': '0ms' }}>
          <span>05</span>
        </p>

        <h2 className="section__title contact__title">
          <Lines lines={['ЧТО-ТО', 'НЕ ТАК?']} delay={120} />
        </h2>

        <p className="contact__lead r-item" style={{ '--reveal-delay': '300ms' }}>
          Позвоните нам.
          <br />
          Разберёмся.
        </p>

        <div className="contact__action r-item" style={{ '--reveal-delay': '400ms' }}>
          <p className="contact__invite">ПОЗВОНИТЕ ПРЯМО СЕЙЧАС</p>

          <a className="contact__phone" href={CONTACTS.phoneHref}>
            {CONTACTS.phoneDisplay}
          </a>

          <p className="contact__hours">{CONTACTS.hours}</p>
        </div>
      </div>
    </section>
  );
}
