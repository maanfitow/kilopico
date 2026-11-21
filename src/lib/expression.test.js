import { describe, expect, it } from 'vitest';
import unitsData from '../../data/units.json';
import prefixesData from '../../data/prefixes.json';
import { dimensionsMatch, parseCompoundExpression, parseUnitTerm } from './expression.js';

describe('expression parser', () => {
  it('resolves dam, ft, min, Mm, and mm without ambiguity', () => {
    const dam = parseUnitTerm('dam', unitsData, prefixesData);
    expect(dam.ok).toBe(true);
    expect(dam.unitId).toBe('m');
    expect(dam.prefix.symbol).toBe('da');
    expect(dam.unitFactor).toBe(10);

    const ft = parseUnitTerm('ft', unitsData, prefixesData);
    expect(ft.ok).toBe(true);
    expect(ft.unitId).toBe('ft');
    expect(ft.prefix).toBeNull();

    const min = parseUnitTerm('min', unitsData, prefixesData);
    expect(min.ok).toBe(true);
    expect(min.unitId).toBe('min');

    const megametre = parseUnitTerm('Mm', unitsData, prefixesData);
    expect(megametre.ok).toBe(true);
    expect(megametre.unitId).toBe('m');
    expect(megametre.prefix.exponent).toBe(6);

    const millimetre = parseUnitTerm('mm', unitsData, prefixesData);
    expect(millimetre.ok).toBe(true);
    expect(millimetre.unitId).toBe('m');
    expect(millimetre.prefix.exponent).toBe(-3);
  });

  it('normalizes sheet typos Dm -> dam and Ml -> mL and micro variants', () => {
    const dmTypo = parseUnitTerm('Dm', unitsData, prefixesData);
    expect(dmTypo.ok).toBe(true);
    expect(dmTypo.prefix.symbol).toBe('da');
    expect(dmTypo.notices[0].type).toBe('aliasNormalized');

    const mlTypo = parseUnitTerm('Ml', unitsData, prefixesData);
    expect(mlTypo.ok).toBe(true);
    expect(mlTypo.unitId).toBe('L');
    expect(mlTypo.prefix.symbol).toBe('m');

    expect(parseUnitTerm('µg', unitsData, prefixesData).prefix.exponent).toBe(-6);
    expect(parseUnitTerm('μg', unitsData, prefixesData).prefix.exponent).toBe(-6);
    expect(parseUnitTerm('ug', unitsData, prefixesData).prefix.exponent).toBe(-6);
  });

  it('rejects double prefixes and prefixes on non-prefixable units', () => {
    expect(parseUnitTerm('mµm', unitsData, prefixesData).ok).toBe(false);
    expect(parseUnitTerm('kmin', unitsData, prefixesData).ok).toBe(false);
    expect(parseUnitTerm('mft', unitsData, prefixesData).ok).toBe(false);
  });

  it('parses compound expressions kg·m/s, mm/min2, and g/cm3', () => {
    const momentum = parseCompoundExpression('kg·m/s', unitsData, prefixesData);
    expect(momentum.ok).toBe(true);
    expect(momentum.dimension).toEqual({ L: 1, M: 1, T: -1, I: 0, Θ: 0, N: 0, J: 0 });
    expect(momentum.factor).toBeCloseTo(1, 12);

    const accel = parseCompoundExpression('mm/min2', unitsData, prefixesData);
    expect(accel.ok).toBe(true);
    expect(accel.dimension).toEqual({ L: 1, M: 0, T: -2, I: 0, Θ: 0, N: 0, J: 0 });
    expect(accel.factor).toBeCloseTo(1e-3 / 3600, 12);

    const density = parseCompoundExpression('g/cm3', unitsData, prefixesData);
    expect(density.ok).toBe(true);
    expect(density.dimension).toEqual({ L: -3, M: 1, T: 0, I: 0, Θ: 0, N: 0, J: 0 });
    expect(density.factor).toBeCloseTo(1000, 10);
  });

  it('detects incompatible dimensions between kg and m and rejects parentheses', () => {
    const kg = parseCompoundExpression('kg', unitsData, prefixesData);
    const m = parseCompoundExpression('m', unitsData, prefixesData);
    expect(dimensionsMatch(kg.dimension, m.dimension)).toBe(false);
    expect(parseCompoundExpression('kg/(m·s)', unitsData, prefixesData).error).toBe(
      'parentheses_unsupported'
    );
  });
});
