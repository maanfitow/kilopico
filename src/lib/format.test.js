import { describe, expect, it } from 'vitest';
import { formatResult, parseNumericInput } from './format.js';

describe('parseNumericInput', () => {
  it('accepts comma and dot decimals', () => {
    expect(parseNumericInput('8,6')).toEqual({ ok: true, value: 8.6, notices: [] });
    expect(parseNumericInput('0.045')).toEqual({ ok: true, value: 0.045, notices: [] });
    expect(parseNumericInput('−90')).toEqual({ ok: true, value: -90, notices: [] });
  });

  it('parses scientific notation variants', () => {
    expect(parseNumericInput('3.9 x 10^9').value).toBeCloseTo(3.9e9, 0);
    expect(parseNumericInput('3.9×10^-24').value).toBeCloseTo(3.9e-24, 30);
    expect(parseNumericInput('3.9e9').value).toBe(3.9e9);
    expect(parseNumericInput('4.3 x 10⁵').value).toBe(4.3e5);
  });

  it('reads dot followed by three digits as decimal and emits a notice', () => {
    const res = parseNumericInput('2.600');
    expect(res.ok).toBe(true);
    expect(res.value).toBe(2.6);
    expect(res.notices).toEqual([
      { type: 'decimalThreeDigits', params: { value: '2.6', integer: '2600' } },
    ]);
  });

  it('rejects thousands separators and invalid text', () => {
    expect(parseNumericInput('1,234.56')).toEqual({ ok: false, error: 'invalid_number' });
    expect(parseNumericInput('1.234.567')).toEqual({ ok: false, error: 'invalid_number' });
    expect(parseNumericInput('')).toEqual({ ok: false, error: 'empty_input' });
    expect(parseNumericInput('abc')).toEqual({ ok: false, error: 'invalid_number' });
  });
});

describe('formatResult', () => {
  it('uses scientific notation below 1e-4 and at or above 1e9', () => {
    expect(formatResult(4.5e-7, 6)).toBe('4.5 × 10⁻⁷');
    expect(formatResult(1e9, 6)).toBe('1 × 10⁹');
    expect(formatResult(3.6e6, 6)).toBe('3600000');
  });

  it('respects significant digits setting', () => {
    expect(formatResult(2.083333333333, 6)).toBe('2.08333');
    expect(formatResult(2.083333333333, 3)).toBe('2.08');
    expect(formatResult(0, 6)).toBe('0');
  });
});
