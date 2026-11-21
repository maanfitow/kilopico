import { describe, expect, it } from 'vitest';
import unitsData from '../../data/units.json';
import prefixesData from '../../data/prefixes.json';
import { convertCompound, convertSimple } from './converter.js';
import { formatResult } from './format.js';

describe('conversion suite (Section 13 acceptance cases)', () => {
  const simpleCases = [
    ['25', { unitId: 'in' }, { unitId: 'ft' }, 25 / 12],
    ['0,045', { unitId: 'm', prefix: 'c' }, { unitId: 'm', prefix: 'k' }, 4.5e-7],
    ['23000', { unitId: 's' }, { unitId: 'h' }, 23000 / 3600],
    ['0,0043', { unitId: 't' }, { unitId: 'g' }, 4300],
    ['500000', { unitId: 'm', prefix: 'c', exponent: 3 }, { unitId: 'm', exponent: 3 }, 0.5],
    ['2600', { unitId: 'm', prefix: 'd', exponent: 3 }, { unitId: 'L' }, 2600],
    ['0,0200', { unitId: 'm', prefix: 'M' }, { unitId: 'm', prefix: 'd' }, 200000],
    ['40', { unitId: 'yd' }, { unitId: 'm', prefix: 'c' }, 3657.6],
    ['500', { unitId: 'ft' }, { unitId: 'm' }, 152.4],
    ['350', { unitId: 'in' }, { unitId: 'm', prefix: 'm' }, 8890],
    ['8', { unitId: 'cal', prefix: 'k' }, { unitId: 'J' }, 33472],
    ['−90', { unitId: '°C' }, { unitId: 'K' }, 183.15],
    ['77', { unitId: '°F' }, { unitId: 'K' }, 298.15],
    ['36', { unitId: 'km/h' }, { unitId: 'm/s' }, 10],
    ['90', { unitId: 'm/s' }, { unitId: 'km/h' }, 324],
    ['2.7', { unitId: 'g/cm3' }, { unitId: 'kg/m3' }, 2700],
    ['13.6', { unitId: 'g/cm3' }, { unitId: 'kg/L' }, 13.6],
    ['40', { unitId: 'mi/h' }, { unitId: 'ft/s' }, (40 * 5280) / 3600],
    ['14.7', { unitId: 'psi' }, { unitId: 'kgf/cm2' }, (14.7 * 0.45359237) / (0.0254 ** 2 * 10000)],
    ['100', { unitId: 'Pa', prefix: 'k' }, { unitId: 'atm' }, 100000 / 101325],
    ['1', { unitId: 'GiB' }, { unitId: 'MB' }, 1073.741824],
    ['180', { unitId: 'deg' }, { unitId: 'rad' }, Math.PI],
  ];

  it.each(simpleCases)('converts %s %j -> %j', (rawValue, from, to, expected) => {
    const res = convertSimple({ rawValue, from, to, unitsData, prefixesData });
    expect(res.ok).toBe(true);
    expect(res.value).toBeCloseTo(expected, 9);
  });

  it('formats 0,045 cm -> km in scientific notation', () => {
    const res = convertSimple({
      rawValue: '0,045',
      from: { unitId: 'm', prefix: 'c' },
      to: { unitId: 'm', prefix: 'k' },
      unitsData,
      prefixesData,
    });
    expect(formatResult(res.value, 6)).toBe('4.5 × 10⁻⁷');
  });

  const compoundCases = [
    ['36', 'km/h', 'm/s', 10],
    ['90', 'm/s', 'km/h', 324],
    ['2.7', 'g/cm³', 'kg/m³', 2700],
    ['13.6', 'g/cm³', 'kg/L', 13.6],
    ['40', 'mi/h', 'ft/s', (40 * 5280) / 3600],
    ['14.7', 'lb/in²', 'kg/cm²', 1.03351228],
  ];

  it.each(compoundCases)('converts compound %s %s -> %s', (rawValue, fromExpr, toExpr, expected) => {
    const res = convertCompound({ rawValue, fromExpr, toExpr, unitsData, prefixesData });
    expect(res.ok).toBe(true);
    expect(res.value).toBeCloseTo(expected, 6);
  });

  it('emits massAsForce notice for lb/in² -> kg/cm² and calendarConvention for year/month', () => {
    const pressure = convertCompound({
      rawValue: '14.7',
      fromExpr: 'lb/in²',
      toExpr: 'kg/cm²',
      unitsData,
      prefixesData,
    });
    expect(pressure.notices.some((n) => n.type === 'massAsForce')).toBe(true);

    const cal = convertSimple({
      rawValue: '1',
      from: { unitId: 'month' },
      to: { unitId: 's' },
      unitsData,
      prefixesData,
    });
    expect(cal.value).toBe(2592000);
    expect(cal.notices.some((n) => n.type === 'calendarConvention')).toBe(true);
  });

  it('supports mixed time input and round-trip conversions', () => {
    const mixed = convertSimple({
      rawValue: '2 h 5 min 15 s',
      from: { unitId: 's' },
      to: { unitId: 's' },
      unitsData,
      prefixesData,
    });
    expect(mixed.ok).toBe(true);
    expect(mixed.value).toBe(7515);

    const forward = convertCompound({
      rawValue: '67',
      fromExpr: 'mi/h',
      toExpr: 'm/s',
      unitsData,
      prefixesData,
    });
    const back = convertCompound({
      rawValue: String(forward.value),
      fromExpr: 'm/s',
      toExpr: 'mi/h',
      unitsData,
      prefixesData,
    });
    expect(back.value).toBeCloseTo(67, 9);
  });

  it('emits decimalThreeDigits notice for 2.600 dm³ -> L and exposes minSignificantDigits for slug', () => {
    const vol = convertSimple({
      rawValue: '2.600',
      from: { unitId: 'm', prefix: 'd', exponent: 3 },
      to: { unitId: 'L' },
      unitsData,
      prefixesData,
    });
    expect(vol.ok).toBe(true);
    expect(vol.value).toBeCloseTo(2.6, 12);
    expect(vol.notices).toContainEqual({
      type: 'decimalThreeDigits',
      params: { value: '2.6', integer: '2600' },
    });

    const slugConv = convertSimple({
      rawValue: '2300',
      from: { unitId: 'slug' },
      to: { unitId: 'g', prefix: 'k' },
      unitsData,
      prefixesData,
    });
    expect(slugConv.ok).toBe(true);
    expect(slugConv.exact).toBe(false);
    expect(slugConv.minSignificantDigits).toBe(6);
    expect(slugConv.value).toBeCloseTo(2300 * 14.5939, 4);
  });

  it('rejects incompatible units and temperature in compound mode', () => {
    const mismatch = convertCompound({
      rawValue: '10',
      fromExpr: 'kg',
      toExpr: 'm',
      unitsData,
      prefixesData,
    });
    expect(mismatch).toEqual({ ok: false, error: 'incompatible_units' });

    const tempCompound = convertCompound({
      rawValue: '25',
      fromExpr: '°C/s',
      toExpr: 'K/s',
      unitsData,
      prefixesData,
    });
    expect(tempCompound).toEqual({ ok: false, error: 'temperature_in_compound' });
  });
});
