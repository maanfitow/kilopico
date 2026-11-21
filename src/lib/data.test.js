import { describe, expect, it } from 'vitest';
import unitsData from '../../data/units.json';
import prefixesData from '../../data/prefixes.json';
import sourcesData from '../../data/sources.json';
import translationsData from '../../data/translations.json';
import countriesData from '../../data/spanish-countries.json';

function collectKeys(obj, prefix = '') {
  if (Array.isArray(obj)) {
    return [prefix];
  }
  if (obj && typeof obj === 'object') {
    return Object.keys(obj)
      .sort()
      .flatMap((key) => collectKeys(obj[key], prefix ? `${prefix}.${key}` : key));
  }
  return [prefix];
}

describe('JSON dataset integrity', () => {
  it('has identical translation keys in es and en', () => {
    const enKeys = collectKeys(translationsData.en);
    const esKeys = collectKeys(translationsData.es);
    expect(esKeys).toEqual(enKeys);
  });

  it('has 24 SI prefixes covering 10^-30 to 10^30', () => {
    expect(prefixesData).toHaveLength(24);
    const exponents = prefixesData.map((p) => p.exponent);
    expect(Math.min(...exponents)).toBe(-30);
    expect(Math.max(...exponents)).toBe(30);
    for (const prefix of prefixesData) {
      expect(sourcesData).toHaveProperty(prefix.source);
    }
  });

  it('references an existing source for every unit and specifies significant_digits when approximate', () => {
    for (const [id, unit] of Object.entries(unitsData.units)) {
      expect(sourcesData, `Unit ${id} references unknown source ${unit.source}`).toHaveProperty(unit.source);
      expect(unitsData.quantities).toHaveProperty(unit.quantity);
      if (unit.exact === false) {
        expect(typeof unit.significant_digits, `Unit ${id} needs significant_digits`).toBe('number');
        expect(unit.significant_digits).toBeGreaterThan(0);
      }
    }
  });

  it('includes the 21 Spanish-speaking countries with non-empty IANA time zones', () => {
    expect(countriesData).toHaveLength(21);
    for (const country of countriesData) {
      expect(country.code).toMatch(/^[A-Z]{2}$/);
      expect(country.name.es).toBeTruthy();
      expect(country.name.en).toBeTruthy();
      expect(country.timezones.length).toBeGreaterThan(0);
    }
  });
});
