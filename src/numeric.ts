import { toEnglishDigits } from './digits';

/** Anything the library accepts as a number. Use strings or bigint for exact large values. */
export type NumberInput = number | bigint | string;

export interface ParsedNumeric {
  negative: boolean;
  /** Integer digits without leading zeros ("0" when empty). */
  int: string;
  /** Fraction digits exactly as supplied (may be empty). */
  frac: string;
}

const NUMERIC_RE = /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i;

/**
 * Parse a number, bigint or numeric string (ASCII or Bangla digits) into
 * sign / integer / fraction digit strings. Exponent notation is expanded.
 */
export function parseNumeric(input: NumberInput): ParsedNumeric {
  let text: string;
  if (typeof input === 'bigint') {
    text = input.toString();
  } else if (typeof input === 'number') {
    if (!Number.isFinite(input)) throw new RangeError(`Cannot convert non-finite number: ${input}`);
    text = String(input);
  } else if (typeof input === 'string') {
    text = toEnglishDigits(input).trim().replace(/^−/, '-');
  } else {
    throw new TypeError('Expected a number, bigint or numeric string');
  }

  const m = NUMERIC_RE.exec(text);
  if (!m || (m[2] === '' && (m[3] === undefined || m[3] === ''))) {
    throw new TypeError(`Invalid numeric input: ${JSON.stringify(input)}`);
  }

  let int = m[2] ?? '';
  let frac = m[3] ?? '';
  const exp = m[4] !== undefined ? parseInt(m[4], 10) : 0;

  if (exp > 0) {
    const shifted = frac.padEnd(exp, '0');
    int += shifted.slice(0, exp);
    frac = shifted.slice(exp);
  } else if (exp < 0) {
    const padded = int.padStart(-exp + 1, '0');
    frac = padded.slice(padded.length + exp) + frac;
    int = padded.slice(0, padded.length + exp);
  }

  int = int.replace(/^0+(?=\d)/, '');
  if (int === '') int = '0';
  const isZero = /^0*$/.test(int) && /^0*$/.test(frac);
  return { negative: m[1] === '-' && !isZero, int, frac };
}

/** Round a decimal (given as digit strings) half-up to `digits` fraction digits. */
export function roundDecimal(
  int: string,
  frac: string,
  digits: number,
): { int: string; frac: string } {
  if (frac.length <= digits) return { int, frac };
  const roundUp = (frac[digits] as string) >= '5';
  const keep = frac.slice(0, digits);
  if (!roundUp) return { int, frac: keep };
  const s = (BigInt(int + keep) + 1n).toString().padStart(digits + 1, '0');
  return {
    int: s.slice(0, s.length - digits),
    frac: digits > 0 ? s.slice(s.length - digits) : '',
  };
}
