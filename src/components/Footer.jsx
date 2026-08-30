import { Logo } from './Logo.jsx';
import { COPYRIGHT, CONTACTS, FOOTER_NAV } from '../data/site.js';
import '../styles/footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <Logo />
        </div>

        <nav className="footer__nav" aria-label="Разделы страницы, подвал">
          <ul className="footer__nav-list">
            {FOOTER_NAV.map((item) => (
              <li key={item.href}>
                <a className="footer__link" href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <address className="footer__address">
          {CONTACTS.addressLines.map((line) => (
            <span className="footer__address-line" key={line}>
              {line}
            </span>
          ))}
          <a className="footer__phone" href={CONTACTS.phoneHref}>
            {CONTACTS.phoneDisplay}
          </a>
        </address>

        <p className="footer__copy">{COPYRIGHT}</p>
      </div>
    </footer>
  );
}
