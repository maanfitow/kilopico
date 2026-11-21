import { parseNumericInput } from './format.js';
import {
  DIMENSIONS,
  dimensionsMatch,
  emptyDimension,
  parseCompoundExpression,
} from './expression.js';

const CALENDAR_UNIT_IDS = new Set(['month', 'year', 'a_j']);

/**
 * Parse mixed time expressions such as "2 h 5 min 15 s" (or "2 h 5 m 15 s")
 * into seconds. Returns null if the input does not match mixed time syntax.
 *
 * @param {string} rawInput
 * @param {object} unitsData
 * @returns {{ ok: true, seconds: number, usedUnits: Array } | null}
 */
export function parseMixedTimeInput(rawInput, unitsData) {
  const text = String(rawInput ?? '').trim();
  if (!text) return null;

  // Require at least two value+unit segments so ordinary numbers don't match.
  const segmentRegex = /([+-]?\d+(?:[.,]\d+)?)\s*(h|hr|horas?|hours?|min|minutos?|minutes?|m|s|seg|segundos?|seconds?|d|d[ií]as?|days?)\b/gi;
  const matches = [...text.matchAll(segmentRegex)];
  if (matches.length < 2) return null;

  const consumed = matches.map((m) => m[0]).join(' ').replace(/\s+/g, '');
  if (consumed.length !== text.replace(/\s+/g, '').length) {
    return null;
  }

  let totalSeconds = 0;
  const usedUnits = [];

  for (const match of matches) {
    const val = Number(match[1].replace(',', '.'));
    if (!Number.isFinite(val)) return null;

    const unitToken = match[2].toLowerCase();
    let unitId = 's';
    if (unitToken.startsWith('h')) unitId = 'h';
    else if (unitToken === 'm' || unitToken.startsWith('min')) unitId = 'min';
    else if (unitToken.startsWith('d')) unitId = 'd';

    const unit = unitsData.units[unitId];
    if (!unit || unit.quantity !== 'time') return null;

    totalSeconds += val * unit.factor;
    usedUnits.push({ unitId, unit, prefix: null, exponent: 1 });
  }

  return { ok: true, seconds: totalSeconds, usedUnits };
}

function getPrefixMultiplier(prefixSymbol, prefixesData) {
  if (!prefixSymbol) return { ok: true, factor: 1, prefix: null };
  const found = prefixesData.find(
    (p) => p.symbol === prefixSymbol || (p.aliases || []).includes(prefixSymbol)
  );
  if (!found) return { ok: false, error: 'unknown_unit', token: prefixSymbol };
  return { ok: true, factor: Math.pow(10, found.exponent), prefix: found };
}

function dedupeNotices(notices) {
  const seen = new Set();
  const out = [];
  for (const notice of notices) {
    const key = `${notice.type}:${JSON.stringify(notice.params || {})}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(notice);
    }
  }
  return out;
}

function dedupeUsedUnits(entries) {
  const seen = new Set();
  const out = [];
  for (const entry of entries) {
    const key = `${entry.unitId}:${entry.prefix?.symbol || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(entry);
    }
  }
  return out;
}

function resolveSimpleDescriptor(descriptor, unitsData, prefixesData) {
  const unit = unitsData.units[descriptor.unitId];
  if (!unit) {
    return { ok: false, error: 'unknown_unit', token: descriptor.unitId };
  }

  const exponent = descriptor.exponent ?? 1;
  const prefixRes = getPrefixMultiplier(descriptor.prefix, prefixesData);
  if (!prefixRes.ok) return prefixRes;

  if (descriptor.prefix && !unit.accepts_prefixes) {
    return { ok: false, error: 'invalid_expression', token: descriptor.unitId };
  }

  const baseQty = unitsData.quantities[unit.quantity];
  const dimension = emptyDimension();
  for (const axis of DIMENSIONS) {
    dimension[axis] = (baseQty.dimension[axis] || 0) * exponent;
  }

  const linearFactor = Math.pow(prefixRes.factor * unit.factor, exponent);

  return {
    ok: true,
    unitId: descriptor.unitId,
    unit,
    prefix: prefixRes.prefix,
    exponent,
    dimension,
    factor: linearFactor,
    offset: unit.offset ?? 0,
  };
}

/**
 * Convert between two simple unit descriptors:
 * { unitId: string, prefix?: string|null, exponent?: number }.
 * Supports linear units (including derived area/volume via exponent),
 * affine temperature units, and optional mixed time input.
 *
 * @param {object} params
 */
export function convertSimple({ rawValue, from, to, unitsData, prefixesData }) {
  const fromResolved = resolveSimpleDescriptor(from, unitsData, prefixesData);
  if (!fromResolved.ok) return fromResolved;

  const toResolved = resolveSimpleDescriptor(to, unitsData, prefixesData);
  if (!toResolved.ok) return toResolved;

  if (!dimensionsMatch(fromResolved.dimension, toResolved.dimension)) {
    return { ok: false, error: 'incompatible_units' };
  }

  let numericValue;
  let inputNotices = [];
  let mixedUsedUnits = [];
  let fromFactorOverride = null;

  const fromIsTime = fromResolved.unit.quantity === 'time' && fromResolved.exponent === 1;
  if (fromIsTime && typeof rawValue === 'string') {
    const mixed = parseMixedTimeInput(rawValue, unitsData);
    if (mixed) {
      numericValue = mixed.seconds;
      fromFactorOverride = 1;
      mixedUsedUnits = mixed.usedUnits;
    }
  }

  if (numericValue === undefined) {
    const parsedNum = parseNumericInput(rawValue);
    if (!parsedNum.ok) return parsedNum;
    numericValue = parsedNum.value;
    inputNotices = parsedNum.notices;
  }

  let resultValue;
  if (fromResolved.unit.quantity === 'temperature') {
    const kelvin = numericValue * fromResolved.factor + fromResolved.offset;
    resultValue = (kelvin - toResolved.offset) / toResolved.factor;
  } else {
    const effectiveFromFactor = fromFactorOverride ?? fromResolved.factor;
    resultValue = numericValue * (effectiveFromFactor / toResolved.factor);
  }

  const allEntries = [
    { unitId: fromResolved.unitId, unit: fromResolved.unit, prefix: fromResolved.prefix, exponent: fromResolved.exponent },
    { unitId: toResolved.unitId, unit: toResolved.unit, prefix: toResolved.prefix, exponent: toResolved.exponent },
    ...mixedUsedUnits,
  ];

  const exact = allEntries.every((e) => e.unit.exact);
  const sigDigitsList = allEntries
    .filter((e) => !e.unit.exact && typeof e.unit.significant_digits === 'number')
    .map((e) => e.unit.significant_digits);

  const notices = [...inputNotices];
  if (allEntries.some((e) => CALENDAR_UNIT_IDS.has(e.unitId))) {
    notices.push({ type: 'calendarConvention' });
  }

  return {
    ok: true,
    value: resultValue,
    exact,
    minSignificantDigits: sigDigitsList.length ? Math.min(...sigDigitsList) : null,
    notices: dedupeNotices(notices),
    usedUnits: dedupeUsedUnits(allEntries),
    // Reserved for future step-by-step calculation breakdown without changing API shape.
    breakdown: {
      inputValue: numericValue,
      fromFactor: fromFactorOverride ?? fromResolved.factor,
      toFactor: toResolved.factor,
    },
  };
}

/**
 * Convert between two compound unit expressions (e.g. "km/h" -> "m/s").
 *
 * @param {object} params
 */
export function convertCompound({ rawValue, fromExpr, toExpr, unitsData, prefixesData }) {
  const parsedNum = parseNumericInput(rawValue);
  if (!parsedNum.ok) return parsedNum;

  const fromParsed = parseCompoundExpression(fromExpr, unitsData, prefixesData);
  if (!fromParsed.ok) return fromParsed;

  const toParsed = parseCompoundExpression(toExpr, unitsData, prefixesData);
  if (!toParsed.ok) return toParsed;

  if (fromParsed.hasTemperature || toParsed.hasTemperature) {
    return { ok: false, error: 'temperature_in_compound' };
  }

  if (!dimensionsMatch(fromParsed.dimension, toParsed.dimension)) {
    return { ok: false, error: 'incompatible_units' };
  }

  const resultValue = parsedNum.value * (fromParsed.factor / toParsed.factor);
  const allTerms = [...fromParsed.terms, ...toParsed.terms];

  const exact = fromParsed.exact && toParsed.exact;
  const sigList = [fromParsed.minSignificantDigits, toParsed.minSignificantDigits].filter(
    (n) => typeof n === 'number'
  );

  const notices = [...parsedNum.notices, ...fromParsed.notices, ...toParsed.notices];
  if (allTerms.some((t) => CALENDAR_UNIT_IDS.has(t.unitId))) {
    notices.push({ type: 'calendarConvention' });
  }

  // Detect pressure-like mass/area conversions such as lb/in² -> kg/cm².
  const isMassPerArea =
    fromParsed.dimension.M === 1 &&
    fromParsed.dimension.L === -2 &&
    DIMENSIONS.every((d) => (d === 'M' || d === 'L' ? true : fromParsed.dimension[d] === 0));

  const hasLb = allTerms.some((t) => t.unitId === 'lb');
  const hasGrams = allTerms.some((t) => t.unitId === 'g');
  if (isMassPerArea && hasLb && hasGrams) {
    notices.push({ type: 'massAsForce' });
  }

  return {
    ok: true,
    value: resultValue,
    exact,
    minSignificantDigits: sigList.length ? Math.min(...sigList) : null,
    notices: dedupeNotices(notices),
    usedUnits: dedupeUsedUnits(allTerms),
    breakdown: {
      inputValue: parsedNum.value,
      fromFactor: fromParsed.factor,
      toFactor: toParsed.factor,
      dimension: fromParsed.dimension,
    },
  };
}
