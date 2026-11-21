import { NavLink } from 'react-router-dom';
import { PROJECT_NAME } from '../config.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';

export default function Header() {
  const { t } = useI18n();

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand">
          <svg
            className="brand-mark"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="1.5"
              y="1.5"
              width="17"
              height="17"
              rx="5"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M5.5 7.5h8.5m0 0-2.2-2.2M14 7.5l-2.2 2.2M14.5 12.5H6m0 0 2.2-2.2M6 12.5l2.2 2.2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="brand-name">{PROJECT_NAME}</span>
        </div>

        <nav className="main-nav" aria-label={t('nav.label')}>
          <NavLink
            to="/calculator"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            {t('nav.calculator')}
          </NavLink>
          <NavLink
            to="/theory"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            {t('nav.theory')}
          </NavLink>
          <NavLink
            to="/downloads"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            {t('nav.downloads')}
          </NavLink>
        </nav>

        <LanguageSwitcher />
      </div>
    </header>
  );
}
