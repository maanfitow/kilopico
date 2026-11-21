import { fromSuperscript } from './format.js';

export const DIMENSIONS = ['L', 'M', 'T', 'I', 'Θ', 'N', 'J'];

const SHEET_NORMALIZATIONS = {
  Dm: 'dam',
  Ml: 'mL',
};

/**
 * Create a zeroed 7-component SI dimension vector.
 * @returns {Record<string, number>}
 */
export function emptyDimension() {
  return { L: 0, M: 0, T: 0, I: 0, Θ: 0, N: 0, J: 0 };
}

/**
 * Check whether two 7-component SI dimension vectors are equal.
 * @param {Record<string, number>} dimA
 * @param {Record<string, number>} dimB
 * @returns {boolean}
 */
export function dimensionsMatch(dimA, dimB) {
  return DIMENSIONS.every((axis) => (dimA?.[axis] || 0) === (dimB?.[axis] || 0));
}

function buildPrefixMap(prefixesData) {
  const bySymbol = new Map();
  for (const prefix of prefixesData) {
    bySymbol.set(prefix.symbol, prefix);
    for (const alias of prefix.aliases || []) {
      bySymbol.set(alias, prefix);
    }
  }
  // Sort longest symbols first so "da" matches before "d".
  const keys = [...bySymbol.keys()].sort((a, b) => b.length - a.length);
  return { bySymbol, keys };
}

function buildUnitLookups(unitsData) {
  const byExactSymbol = new Map();
  const byAlias = new Map();

  for (const [id, unit] of Object.entries(unitsData.units)) {
    byExactSymbol.set(unit.symbol, { id, unit });
    if (id !== unit.symbol) {
      byExactSymbol.set(id, { id, unit });
    }
    for (const alias of unit.aliases || []) {
      if (!byAlias.has(alias)) {
        byAlias.set(alias, { id, unit });
      }
    }
  }

  return { byExactSymbol, byAlias };
}

function resolveUnitAndPrefix(rawSymbol, unitsData, prefixesData) {
  const notices = [];
  let symbolText = rawSymbol;

  if (Object.prototype.hasOwnProperty.call(SHEET_NORMALIZATIONS, rawSymbol)) {
    const normalized = SHEET_NORMALIZATIONS[rawSymbol];
    notices.push({
      type: 'aliasNormalized',
      params: { raw: rawSymbol, normalized },
    });
    symbolText = normalized;
  }

  const { byExactSymbol, byAlias } = buildUnitLookups(unitsData);
  const { bySymbol: prefixMap, keys: prefixKeys } = buildPrefixMap(prefixesData);

  // 1. Exact unit symbol match first (prevents "min" -> m+in, "ft" -> f+t, "Mm" -> M+m vs "mm").
  if (byExactSymbol.has(symbolText)) {
    const found = byExactSymbol.get(symbolText);
    return {
      ok: true,
      unitId: found.id,
      unit: found.unit,
      prefix: null,
      notices,
    };
  }

  // 2. Exact unit alias match (case-sensitive, e.g., "Ton", "pulg", "pies", "lt", "gr").
  if (byAlias.has(symbolText)) {
    const found = byAlias.get(symbolText);
    return {
      ok: true,
      unitId: found.id,
      unit: found.unit,
      prefix: null,
      notices,
    };
  }

  // 3. Single prefix + unit symbol (or alias) for units that accept prefixes.
  for (const prefixKey of prefixKeys) {
    if (!symbolText.startsWith(prefixKey)) continue;
    const rest = symbolText.slice(prefixKey.length);
    if (!rest) continue;

    const candidate = byExactSymbol.get(rest) ?? byAlias.get(rest);
    if (candidate && candidate.unit.accepts_prefixes) {
      return {
        ok: true,
        unitId: candidate.id,
        unit: candidate.unit,
        prefix: prefixMap.get(prefixKey),
        notices,
      };
    }
  }

  return { ok: false, error: 'unknown_unit', token: rawSymbol };
}

/**
 * Parse a single unit term of the form [prefix]symbol[exponent].
 * Supports ^n, Unicode superscripts (², ³), and glued digits (cm3, m2).
 *
 * @param {string} rawTerm
 * @param {object} unitsData
 * @param {Array} prefixesData
 */
export function parseUnitTerm(rawTerm, unitsData, prefixesData) {
  const token = String(rawTerm ?? '').trim();
  if (!token) {
    return { ok: false, error: 'invalid_expression' };
  }

  let baseSymbol = token;
  let exponent = 1;

  const caretMatch = token.match(/^(.+?)\^([+-]?\d+)$/);
  const superMatch = token.match(/^(.+?)([⁺⁻]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/);
  const gluedMatch = token.match(/^([^\d]+?)(\d+)$/);

  if (caretMatch) {
    baseSymbol = caretMatch[1].trim();
    exponent = Number(caretMatch[2]);
  } else if (superMatch) {
    baseSymbol = superMatch[1].trim();
    exponent = Number(fromSuperscript(superMatch[2]));
  } else if (gluedMatch) {
    baseSymbol = gluedMatch[1].trim();
    exponent = Number(gluedMatch[2]);
  }

  if (!baseSymbol || !Number.isInteger(exponent) || exponent === 0) {
    return { ok: false, error: 'invalid_expression', token };
  }

  const resolved = resolveUnitAndPrefix(baseSymbol, unitsData, prefixesData);
  if (!resolved.ok) {
    return resolved;
  }

  const prefixFactor = resolved.prefix ? Math.pow(10, resolved.prefix.exponent) : 1;
  const termFactor = prefixFactor * resolved.unit.factor;

  return {
    ok: true,
    unitId: resolved.unitId,
    unit: resolved.unit,
    prefix: resolved.prefix,
    exponent,
    unitFactor: termFactor,
    notices: resolved.notices,
  };
}

function splitProductTerms(segment) {
  return segment.split(/[·*]/).map((s) => s.trim());
}

/**
 * Parse a compound unit expression (e.g. "kg·m/s^2", "g/cm³", "mm/min2").
 * Everything after the first "/" belongs to the denominator.
 *
 * @param {string} rawExpr
 * @param {object} unitsData
 * @param {Array} prefixesData
 */
export function parseCompoundExpression(rawExpr, unitsData, prefixesData) {
  const expr = String(rawExpr ?? '').trim();
  if (!expr) {
    return { ok: false, error: 'empty_expression' };
  }

  if (/[()]/.test(expr)) {
    return { ok: false, error: 'parentheses_unsupported' };
  }

  const slashParts = expr.split('/');
  if (slashParts.length > 2) {
    return { ok: false, error: 'invalid_expression' };
  }

  const numRaw = slashParts[0].trim();
  const denRaw = slashParts.length === 2 ? slashParts[1].trim() : '';

  if (!numRaw || (slashParts.length === 2 && !denRaw)) {
    return { ok: false, error: 'invalid_expression' };
  }

  const numTokens = splitProductTerms(numRaw);
  const denTokens = denRaw ? splitProductTerms(denRaw) : [];

  if (numTokens.some((t) => !t) || denTokens.some((t) => !t)) {
    return { ok: false, error: 'invalid_expression' };
  }

  const dimension = emptyDimension();
  let factor = 1;
  let exact = true;
  let minSignificantDigits = Infinity;
  let hasTemperature = false;
  const notices = [];
  const terms = [];

  const applyTokens = (tokens, sign) => {
    for (const tok of tokens) {
      const parsed = parseUnitTerm(tok, unitsData, prefixesData);
      if (!parsed.ok) return parsed;

      const netExp = sign * parsed.exponent;
      const quantity = unitsData.quantities[parsed.unit.quantity];
      if (!quantity) {
        return { ok: false, error: 'invalid_expression', token: tok };
      }

      if (parsed.unit.quantity === 'temperature') {
        hasTemperature = true;
      }

      factor *= Math.pow(parsed.unitFactor, netExp);

      for (const axis of DIMENSIONS) {
        dimension[axis] += (quantity.dimension[axis] || 0) * netExp;
      }

      if (!parsed.unit.exact) {
        exact = false;
        if (typeof parsed.unit.significant_digits === 'number') {
          minSignificantDigits = Math.min(minSignificantDigits, parsed.unit.significant_digits);
        }
      }

      notices.push(...parsed.notices);
      terms.push({
        unitId: parsed.unitId,
        unit: parsed.unit,
        prefix: parsed.prefix,
        exponent: netExp,
      });
    }
    return { ok: true };
  };

  const numResult = applyTokens(numTokens, 1);
  if (!numResult.ok) return numResult;

  const denResult = applyTokens(denTokens, -1);
  if (!denResult.ok) return denResult;

  return {
    ok: true,
    expression: expr,
    factor,
    dimension,
    exact,
    minSignificantDigits: Number.isFinite(minSignificantDigits) ? minSignificantDigits : null,
    hasTemperature,
    notices,
    terms,
  };
}
