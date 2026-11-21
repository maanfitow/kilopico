import { useI18n } from '../i18n/I18nContext.jsx';

export default function LanguageSwitcher() {
  const { language, changeLanguage, t } = useI18n();

  return (
    <div className="lang-switcher" role="group" aria-label={t('language.label')}>
      <button
        type="button"
        className={language === 'es' ? 'lang-btn active' : 'lang-btn'}
        onClick={() => changeLanguage('es')}
        aria-pressed={language === 'es'}
        aria-label={`${t('language.es')} — ${t('language.switchToEs')}`}
      >
        {t('language.es')}
      </button>
      <button
        type="button"
        className={language === 'en' ? 'lang-btn active' : 'lang-btn'}
        onClick={() => changeLanguage('en')}
        aria-pressed={language === 'en'}
        aria-label={`${t('language.en')} — ${t('language.switchToEn')}`}
      >
        {t('language.en')}
      </button>
    </div>
  );
}
