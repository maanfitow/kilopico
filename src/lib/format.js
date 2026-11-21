const SUPERSCRIPT_DIGITS = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
  '⁺': '+',
  '⁻': '-',
};

const ASCII_TO_SUPERSCRIPT = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '-': '⁻',
};

/**
 * Convert Unicode superscript characters (e.g. ⁻²⁴) to ASCII (e.g. -24).
 * @param {string} text
 * @returns {string}
 */
export function fromSuperscript(text) {
  return [...text].map((ch) => SUPERSCRIPT_DIGITS[ch] ?? ch).join('');
}

/**
 * Convert an integer exponent to Unicode superscript characters.
 * @param {number} exponent
 * @returns {string}
 */
export function toSuperscript(exponent) {
  return [...String(exponent)].map((ch) => ASCII_TO_SUPERSCRIPT[ch] ?? ch).join('');
}

/**
 * Parse a numeric string supporting comma or dot decimals, scientific notation
 * (3.9e9, 3.9 x 10^9, 3.9×10^-24), and the dot-three-digits decimal notice (2.600).
 * Rejects thousands separators.
 *
 * @param {string|number} rawInput
 * @returns {{ ok: true, value: number, notices: Array<{ type: string, params?: object }> } | { ok: false, error: string }}
 */
export function parseNumericInput(rawInput) {
  if (typeof rawInput === 'number') {
    if (!Number.isFinite(rawInput)) {
      return { ok: false, error: 'invalid_number' };
    }
    return { ok: true, value: rawInput, notices: [] };
  }

  const trimmed = String(rawInput ?? '').trim();
  if (!trimmed) {
    return { ok: false, error: 'empty_input' };
  }

  // Normalize Unicode minus sign (U+2212) to ASCII hyphen-minus.
  const normalizedMinus = trimmed.replace(/\u2212/g, '-');
  const notices = [];

  // Scientific notation: e.g. "3.9e9", "3.9 x 10^9", "3.9×10^-24", "4.3 x 10⁵"
  const sciMatch = normalizedMinus.match(
    /^([+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+))\s*(?:[x×*]\s*10\s*(?:\^\s*([+-]?\d+)|([⁺⁻]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+))|[eE]([+-]?\d+))$/
  );

  if (sciMatch) {
    const rawMantissa = sciMatch[1];
    const dotThreeMatch = rawMantissa.match(/^[+-]?[1-9]\d*\.\d{3}$/);
    const mantissaStr = rawMantissa.replace(',', '.');
    const expStr = sciMatch[2] ?? (sciMatch[3] ? fromSuperscript(sciMatch[3]) : sciMatch[4]);
    const mantissa = Number(mantissaStr);
    const exponent = Number(expStr);

    if (!Number.isFinite(mantissa) || !Number.isInteger(exponent)) {
      return { ok: false, error: 'invalid_number' };
    }

    if (dotThreeMatch) {
      notices.push({
        type: 'decimalThreeDigits',
        params: {
          value: String(mantissa),
          integer: rawMantissa.replace('.', ''),
        },
      });
    }

    const value = mantissa * Math.pow(10, exponent);
    if (!Number.isFinite(value)) {
      return { ok: false, error: 'invalid_number' };
    }
    return { ok: true, value, notices };
  }

  // Reject mixed separators (e.g. "1,234.56") or multiple separators ("1.234.567").
  const dotCount = (normalizedMinus.match(/\./g) || []).length;
  const commaCount = (normalizedMinus.match(/,/g) || []).length;
  if ((dotCount > 0 && commaCount > 0) || dotCount > 1 || commaCount > 1) {
    return { ok: false, error: 'invalid_number' };
  }

  // Standard decimal number (optional leading sign, digits with optional single . or ,).
  if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(normalizedMinus)) {
    return { ok: false, error: 'invalid_number' };
  }

  const hasDotThreeDigits = /^[+-]?[1-9]\d*\.\d{3}$/.test(normalizedMinus);
  const value = Number(normalizedMinus.replace(',', '.'));
  if (!Number.isFinite(value)) {
    return { ok: false, error: 'invalid_number' };
  }

  if (hasDotThreeDigits) {
    notices.push({
      type: 'decimalThreeDigits',
      params: {
        value: String(value),
        integer: normalizedMinus.replace('.', ''),
      },
    });
  }

  return { ok: true, value, notices };
}

/**
 * Format a numeric result using significant digits (1..15) and automatic
 * scientific notation for |value| < 1e-4 or |value| >= 1e9.
 *
 * @param {number} value
 * @param {number} [significantDigits=6]
 * @returns {string}
 */
export function formatResult(value, significantDigits = 6) {
  if (!Number.isFinite(value)) {
    return '';
  }

  const sigFigs = Math.min(15, Math.max(1, Math.round(significantDigits)));
  const rounded = Number(value.toPrecision(sigFigs));

  if (Object.is(rounded, -0) || rounded === 0) {
    return '0';
  }

  const abs = Math.abs(rounded);
  if (abs < 1e-4 || abs >= 1e9) {
    const expStr = rounded.toExponential(sigFigs - 1);
    const [rawMantissa, rawExp] = expStr.split('e');
    const cleanMantissa = String(Number(rawMantissa));
    const exponent = Number(rawExp);
    return `${cleanMantissa} × 10${toSuperscript(exponent)}`;
  }

  return String(rounded);
}
