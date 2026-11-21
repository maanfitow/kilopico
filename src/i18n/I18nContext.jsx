import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import translations from '../../data/translations.json';
import spanishCountries from '../../data/spanish-countries.json';
import { PROJECT_NAME, STORAGE_KEYS } from '../config.js';
import { detectLanguage } from '../lib/language.js';

const I18nContext = createContext(null);

function readStoredLanguage() {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.language);
  } catch {
    return null;
  }
}

function writeStoredLanguage(code) {
  try {
    window.localStorage.setItem(STORAGE_KEYS.language, code);
  } catch {
    // Ignore storage errors in restricted browsing contexts.
  }
}

function resolveInitialLanguage() {
  let timeZone = null;
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    timeZone = null;
  }

  const browserLanguages =
    typeof navigator !== 'undefined' && Array.isArray(navigator.languages)
      ? navigator.languages
      : typeof navigator !== 'undefined' && navigator.language
        ? [navigator.language]
        : [];

  return detectLanguage({
    stored: readStoredLanguage(),
    timeZone,
    browserLanguages,
    countries: spanishCountries,
  });
}

function lookupKey(obj, path) {
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

function interpolate(text, vars) {
  if (typeof text !== 'string' || !vars) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : `{{${name}}}`
  );
}

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => resolveInitialLanguage());

  const changeLanguage = useCallback((code) => {
    if (code !== 'es' && code !== 'en') return;
    setLanguage(code);
    writeStoredLanguage(code);
  }, []);

  const t = useCallback(
    (key, vars) => {
      const value = lookupKey(translations[language], key) ?? lookupKey(translations.en, key) ?? key;
      return interpolate(value, vars);
    },
    [language]
  );

  useEffect(() => {
    document.documentElement.lang = language;
    const tagline = lookupKey(translations[language], 'app.tagline') || '';
    document.title = tagline ? `${PROJECT_NAME} — ${tagline}` : PROJECT_NAME;
  }, [language]);

  const contextValue = useMemo(
    () => ({ language, changeLanguage, t }),
    [language, changeLanguage, t]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
