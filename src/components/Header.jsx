import { NavLink } from 'react-router-dom';
import { PROJECT_NAME } from '../config.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import ThemeSwitcher from './ThemeSwitcher.jsx';

export default function Header() {
  const { t } = useI18n();

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand">
          <svg
            className="brand-mark"
            width="22"
            height="22"
            viewBox="0 0 200 200"
            fill="none"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M100 0a100 100 0 1 0 0 200 100 100 0 1 0 0-200ZM46.2 57.4L58.5 53.6L103.8 159.8L92.2 166.0ZM101.3 40.6L115.6 36.1L106.1 72.1L133.4 81.8L126.9 109.7L166.5 124.7L152.2 132.9L88.4 110.1Q83.2 108.2 84.9 101.3ZM102.8 84.7L119.4 89.5L114.7 105.7L98.2 100.9Z"
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

        <div className="header-actions">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
