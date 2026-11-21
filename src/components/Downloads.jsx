import sourcesData from '../../data/sources.json';
import { PDF_RELEASE_BASE_URL, PROJECT_NAME } from '../config.js';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function Downloads() {
  const { language, t } = useI18n();
  const esDownloadName = t('downloads.esPdfFilename', { projectName: PROJECT_NAME });
  const enDownloadName = t('downloads.enPdfFilename', { projectName: PROJECT_NAME });
  const esHref = `${PDF_RELEASE_BASE_URL}/${esDownloadName}`;
  const enHref = `${PDF_RELEASE_BASE_URL}/${enDownloadName}`;

  return (
    <div className="page-stack">
      <header className="hero-header">
        <h1 className="page-title">{t('downloads.title')}</h1>
        <p className="hero-subtitle">{t('downloads.intro')}</p>
      </header>

      <div className="download-grid">
        <article
          className={`download-option download-es${language === 'es' ? ' highlighted' : ''}`}
        >
          <div className="download-tags">
            <span className="pastel-tag">ES</span>
            {language === 'es' && (
              <span className="pastel-tag pastel-tag-solid">{t('downloads.recommended')}</span>
            )}
          </div>
          <h2 className="card-display-title">{t('downloads.esPdfTitle')}</h2>
          <p>{t('downloads.esPdfDesc')}</p>
          <a className="primary-btn" href={esHref} download={esDownloadName}>
            {t('downloads.downloadButton')} (ES)
          </a>
        </article>

        <article
          className={`download-option download-en${language === 'en' ? ' highlighted' : ''}`}
        >
          <div className="download-tags">
            <span className="pastel-tag">EN</span>
            {language === 'en' && (
              <span className="pastel-tag pastel-tag-solid">{t('downloads.recommended')}</span>
            )}
          </div>
          <h2 className="card-display-title">{t('downloads.enPdfTitle')}</h2>
          <p>{t('downloads.enPdfDesc')}</p>
          <a className="primary-btn" href={enHref} download={enDownloadName}>
            {t('downloads.downloadButton')} (EN)
          </a>
        </article>
      </div>

      <section className="instrument-sheet">
        <h2 className="section-title">{t('downloads.allSourcesTitle')}</h2>
        <ul className="sources-list">
          {Object.entries(sourcesData).map(([id, source]) => (
            <li key={id} className="source-item">
              <div className="source-item-header">
                <strong className="source-unit-title">{source.title}</strong>
                <span className={source.verified ? 'status-tag status-exact' : 'status-tag status-approx'}>
                  {source.verified ? t('sources.verified') : t('sources.pendingVerification')}
                </span>
              </div>
              <div className="source-citation">
                {source.authors && source.authors.length > 0 && `${source.authors.join(', ')}. `}
                {source.publisher && `${source.publisher}`}
                {source.year ? ` (${source.year})` : ''}
                {source.edition ? ` — ${source.edition}` : ''}
                {source.url && (
                  <>
                    {' · '}
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${t('sources.openLink')}: ${source.title}`}
                    >
                      {t('sources.openLink')}
                    </a>
                  </>
                )}
              </div>
              {source.notes && <p className="source-note">{source.notes}</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
