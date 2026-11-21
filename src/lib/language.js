/**
 * Pure language detection heuristic for first-visit localization.
 * Priority:
 * 1. Stored user preference ("es" or "en")
 * 2. Browser IANA time zone belonging to a Spanish-speaking country
 * 3. Any browser preferred language starting with "es"
 * 4. Default to English ("en")
 *
 * @param {object} params
 * @param {string|null|undefined} params.stored
 * @param {string|null|undefined} params.timeZone
 * @param {string[]|null|undefined} params.browserLanguages
 * @param {Array<{ timezones: string[] }>} params.countries
 * @returns {'es' | 'en'}
 */
export function detectLanguage({ stored, timeZone, browserLanguages, countries }) {
  if (stored === 'es' || stored === 'en') {
    return stored;
  }

  if (timeZone && Array.isArray(countries)) {
    const matchesCountry = countries.some(
      (country) => Array.isArray(country.timezones) && country.timezones.includes(timeZone)
    );
    if (matchesCountry) {
      return 'es';
    }
  }

  if (Array.isArray(browserLanguages)) {
    const prefersSpanish = browserLanguages.some(
      (lang) => typeof lang === 'string' && lang.trim().toLowerCase().startsWith('es')
    );
    if (prefersSpanish) {
      return 'es';
    }
  }

  return 'en';
}
