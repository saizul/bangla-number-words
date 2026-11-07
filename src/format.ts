import { toBanglaDigits, toEnglishDigits } from './digits';
import { parseNumeric, roundDecimal, type NumberInput } from './numeric';

export interface FormatNumberOptions {
  /** Digit script of the output. Default 'en'. */
  digits?: 'bn' | 'en';
  /** 'indian' = 1,23,45,678 (lakh/crore); 'international' = 12,345,678; 'none'. Default 'indian'. */
  grouping?: 'indian' | 'international' | 'none';
  /** Pad the fraction with zeros up to this many digits. Default 0. */
  minimumFractionDigits?: number;
  /** Round half-up to at most this many fraction digits. Default: keep all. */
  maximumFractionDigits?: number;
  /** Group separator. Default ','. */
  separator?: string;
  /** Decimal separator. Default '.'. */
  decimalSeparator?: string;
}

/** Group an integer digit string. */
export function groupDigits(
  int: string,
  grouping: 'indian' | 'international' | 'none' = 'indian',
  separator = ',',
): string {
  if (grouping === 'none' || int.length <= 3) return int;
  if (grouping === 'international') {
    return int.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  }
  const tail = int.slice(-3);
  const head = int.slice(0, -3);
  return head.replace(/\B(?=(\d{2})+(?!\d))/g, separator) + separator + tail;
}

/**
 * Format a number with lakh/crore (or international) grouping in Bangla or
 * English digits.
 *
 * @example formatNumber(12345678) // "1,23,45,678"
 * @example formatNumber(12345678, { digits: 'bn' }) // "১,২৩,৪৫,৬৭৮"
 */
export function formatNumber(input: NumberInput, options: FormatNumberOptions = {}): string {
  const parsed = parseNumeric(input);
  let { int, frac } = parsed;
  if (options.maximumFractionDigits !== undefined) {
    ({ int, frac } = roundDecimal(int, frac, options.maximumFractionDigits));
  }
  if (options.minimumFractionDigits !== undefined) {
    frac = frac.padEnd(options.minimumFractionDigits, '0');
  }
  const isZero = /^0*$/.test(int) && /^0*$/.test(frac);
  let out = groupDigits(int, options.grouping ?? 'indian', options.separator ?? ',');
  if (frac.length > 0) out += (options.decimalSeparator ?? '.') + frac;
  if (parsed.negative && !isZero) out = '-' + out;
  return options.digits === 'bn' ? toBanglaDigits(out) : out;
}

/** Format an amount as currency: "৳ 1,23,456.50" style. */
export function formatCurrency(
  input: NumberInput,
  options: FormatNumberOptions & { symbol?: string } = {},
): string {
  const { symbol = '৳', ...rest } = options;
  const body = formatNumber(input, { minimumFractionDigits: 2, maximumFractionDigits: 2, ...rest });
  return body.startsWith('-') ? `-${symbol}${body.slice(1)}` : `${symbol}${body}`;
}

/**
 * Normalise a formatted number string (Bangla or English digits, any grouping
 * separators, optional sign) to a canonical ASCII string such as "-12345.67".
 * Returns null when the input is not a number.
 */
export function parseNumberString(text: string): string | null {
  const cleaned = toEnglishDigits(text)
    .replace(/[\s,\u066C\u060C\u2009\u00A0_]/g, '')
    .replace(/[−–]/g, '-');
  const m = /^([+-]?)(\d+)(?:\.(\d*))?$|^([+-]?)\.(\d+)$/.exec(cleaned);
  if (!m) return null;
  const sign = (m[1] ?? m[4]) === '-' ? '-' : '';
  const int = (m[2] ?? '0').replace(/^0+(?=\d)/, '');
  const frac = m[3] ?? m[5] ?? '';
  return sign + int + (frac ? '.' + frac : '');
}

/**
 * Parse a Bangla/English formatted number back to a JS number. Returns NaN when
 * the text is not a valid number.
 *
 * @example parseNumber('১,২৩,৪৫,৬৭৮.৫০') // 12345678.5
 */
export function parseNumber(text: string): number {
  const canonical = parseNumberString(text);
  return canonical === null ? NaN : Number(canonical);
}
