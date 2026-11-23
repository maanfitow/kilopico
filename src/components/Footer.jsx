import { PROJECT_NAME, SOCIAL_LINKS } from '../config.js';
import { useI18n } from '../i18n/I18nContext.jsx';

const SOCIAL_ITEMS = [
  {
    key: 'github',
    label: 'GitHub',
    handle: 'maanfitow',
    href: SOCIAL_LINKS.github,
    path: 'M12 2C6.48 2 2 6.48 2 12.02c0 4.42 2.87 8.18 6.84 9.5.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.6-3.37-1.35-3.37-1.35-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03a9.56 9.56 0 0 1 5 0c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.86 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48A10.02 10.02 0 0 0 22 12.02C22 6.48 17.52 2 12 2Z',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    handle: 'mau-figue',
    href: SOCIAL_LINKS.linkedin,
    path: 'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z',
  },
];

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-meta">
          <span className="footer-brand">{PROJECT_NAME}</span>
          <span className="footer-tagline">{t('app.tagline')}</span>
        </div>

        <nav className="footer-links" aria-label={t('footer.socialLabel')}>
          {SOCIAL_ITEMS.map(({ key, label, handle, href, path }) => (
            <a
              key={key}
              className={`social-link social-${key}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('footer.openProfile', { network: label, handle })}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d={path} />
              </svg>
              <span>{label}</span>
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
