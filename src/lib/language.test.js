import { describe, expect, it } from 'vitest';
import countries from '../../data/spanish-countries.json';
import { detectLanguage } from './language.js';

describe('detectLanguage', () => {
  it('respects stored preference even in a Bolivian time zone', () => {
    expect(
      detectLanguage({
        stored: 'en',
        timeZone: 'America/La_Paz',
        browserLanguages: ['es-BO'],
        countries,
      })
    ).toBe('en');
  });

  it('returns es when nothing is stored and timeZone is America/La_Paz', () => {
    expect(
      detectLanguage({
        stored: null,
        timeZone: 'America/La_Paz',
        browserLanguages: ['en-US'],
        countries,
      })
    ).toBe('es');
  });

  it('returns en for America/New_York with en-US', () => {
    expect(
      detectLanguage({
        stored: null,
        timeZone: 'America/New_York',
        browserLanguages: ['en-US'],
        countries,
      })
    ).toBe('en');
  });

  it('returns es for America/New_York with es-US', () => {
    expect(
      detectLanguage({
        stored: null,
        timeZone: 'America/New_York',
        browserLanguages: ['es-US'],
        countries,
      })
    ).toBe('es');
  });
});
