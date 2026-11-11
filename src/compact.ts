import { toBanglaDigits, toEnglishDigits } from './digits';
import { groupDigits, parseNumberString } from './format';
import { parseNumeric, roundDecimal, type NumberInput } from './numeric';

/** Units used by compact notation. */
export type CompactUnit = 'thousand' | 'lakh' | 'crore';

export interface FormatCompactOptions {
  /** Language of the unit label: 'en' (Lakh, Crore) or 'bn' (লক্ষ, কোটি). Default 'en'. */
  locale?: 'en' | 'bn';
  /** Digit script of the number. Default: Bangla digits for 'bn', ASCII digits for 'en'. */
  digits?: 'bn' | 'en';
  /**
   * 'long' = "12.5 Lakh"; 'short' = "12.5L", "1.2Cr", "5K". English only:
   * Bangla has no established abbreviations, so 'bn' always uses full words.
   * Default 'long'.
   */
  style?: 'long' | 'short';
  /** Round half-up to at most this many fraction digits. Default 2. */
  maximumFractionDigits?: number;
  /** Pad the fraction with zeros up to this many digits. Default 0 (trailing zeros are dropped). */
  minimumFractionDigits?: number;
  /** Use the thousand tier. With `false`, values below one lakh are written in full. Default true. */
  thousand?: boolean;
  /** Bangla word for 10^5. Default 'লক্ষ'. */
  lakh?: 'লক্ষ' | 'লাখ';
  /** Replace individual unit labels, for example `{ lakh: 'Lac' }`. */
  units?: Partial<Record<CompactUnit, string>>;
  /** Text placed before the number (after the minus sign), for example '৳'. Default ''. */
  symbol?: string;
  /** Group separator for mantissas of 1,000 crore and more. Default ','. */
  separator?: string;
  /** Decimal separator. Default '.'. */
  decimalSeparator?: string;
}

interface Tier {
  readonly exp: number;
  readonly unit?: CompactUnit;
}

const LABELS: Record<'en-long' | 'en-short' | 'bn', Record<CompactUnit, string>> = {
  'en-long': { thousand: 'Thousand', lakh: 'Lakh', crore: 'Crore' },
  'en-short': { thousand: 'K', lakh: 'L', crore: 'Cr' },
  bn: { thousand: 'হাজার', lakh: 'লক্ষ', crore: 'কোটি' },
};

function fractionDigits(value: number | undefined, fallback: number, name: string): number {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new RangeError(`${name} must be an integer between 0 and 100`);
  }
  return value;
}

/** Move the decimal point `exp` places to the left. */
function scaleDown(int: string, frac: string, exp: number): { int: string; frac: string } {
  if (exp === 0) return { int, frac };
  const padded = int.padStart(exp + 1, '0');
  return { int: padded.slice(0, padded.length - exp), frac: padded.slice(padded.length - exp) + frac };
}

/**
 * Compact notation in the South Asian system: thousand, lakh and crore, the
 * way amounts are written in Bangladeshi reports, dashboards and headlines.
 * Rounds half-up and stays exact for `bigint` and string input of any size.
 *
 * @example formatCompact(1250000) // "12.5 Lakh"
 * @example formatCompact(1250000, { locale: 'bn' }) // "১২.৫ লক্ষ"
 * @example formatCompact(34500000, { style: 'short', symbol: '৳' }) // "৳3.45Cr"
 */
export function formatCompact(input: NumberInput, options: FormatCompactOptions = {}): string {
  const { locale = 'en', style = 'long', symbol = '' } = options;
  const maxFrac = fractionDigits(options.maximumFractionDigits, 2, 'maximumFractionDigits');
  const minFrac = fractionDigits(options.minimumFractionDigits, 0, 'minimumFractionDigits');
  if (minFrac > maxFrac) throw new RangeError('minimumFractionDigits cannot exceed maximumFractionDigits');

  const parsed = parseNumeric(input);
  const tiers: Tier[] = [{ exp: 0 }];
  if (options.thousand !== false) tiers.push({ exp: 3, unit: 'thousand' });
  tiers.push({ exp: 5, unit: 'lakh' }, { exp: 7, unit: 'crore' });

  // Start from the tier the integer part belongs to, then move up while rounding
  // spills over (99,999.6 is "1 Lakh", not "100 Thousand").
  let index = 0;
  while (index + 1 < tiers.length && parsed.int.length > (tiers[index + 1] as Tier).exp) index++;
  let tier = tiers[index] as Tier;
  let value = roundDecimal(...scaleArgs(parsed.int, parsed.frac, tier.exp), maxFrac);
  while (index + 1 < tiers.length && value.int.length > (tiers[index + 1] as Tier).exp - tier.exp) {
    tier = tiers[++index] as Tier;
    value = roundDecimal(...scaleArgs(parsed.int, parsed.frac, tier.exp), maxFrac);
  }

  const frac = value.frac.replace(/0+$/, '').padEnd(minFrac, '0');
  const isZero = /^0*$/.test(value.int) && /^0*$/.test(frac);
  let number = groupDigits(value.int, 'indian', options.separator ?? ',');
  if (frac.length > 0) number += (options.decimalSeparator ?? '.') + frac;
  if ((options.digits ?? locale) === 'bn') number = toBanglaDigits(number);

  let label = '';
  if (tier.unit) {
    const defaults = locale === 'bn' ? LABELS.bn : LABELS[style === 'short' ? 'en-short' : 'en-long'];
    const custom = options.units?.[tier.unit];
    label = custom ?? (locale === 'bn' && tier.unit === 'lakh' ? (options.lakh ?? defaults.lakh) : defaults[tier.unit]);
  }
  const joiner = label === '' || (locale === 'en' && style === 'short' && !options.units?.[tier.unit as CompactUnit]) ? '' : ' ';
  return (parsed.negative && !isZero ? '-' : '') + symbol + number + joiner + label;
}

function scaleArgs(int: string, frac: string, exp: number): [string, string] {
  const scaled = scaleDown(int, frac, exp);
  return [scaled.int, scaled.frac];
}

const UNIT_EXPONENTS: Record<string, number> = {
  k: 3, thousand: 3, thousands: 3, হাজার: 3,
  l: 5, lac: 5, lacs: 5, lakh: 5, lakhs: 5, লক্ষ: 5, লাখ: 5,
  cr: 7, crore: 7, crores: 7, কোটি: 7,
};

/**
 * Parse compact notation ("12.5 লক্ষ", "৳3.45Cr", "2 lakh", "৫ হাজার") to a
 * canonical ASCII number string such as "1250000". Plain formatted numbers
 * ("1,23,456") are accepted too. Exact for any size; returns null when the
 * text is not a number or the unit is unknown.
 */
export function parseCompactString(text: string): string | null {
  if (typeof text !== 'string') return null;
  const cleaned = toEnglishDigits(text).replace(/[−–]/g, '-').replace(/\u00A0/g, ' ').trim();
  const m = /^([+-]?)\s*(?:৳|Tk\.?|BDT)?\s*([+-]?)\s*([\d,.\s]*\d\.?)\s*([^\d\s.,+-]*)\.?$/i.exec(cleaned);
  if (!m) return null;
  if (m[1] && m[2]) return null;
  const unit = (m[4] ?? '').toLowerCase();
  const exp = unit === '' ? 0 : UNIT_EXPONENTS[unit];
  if (exp === undefined) return null;
  const canonical = parseNumberString(m[3] as string);
  if (canonical === null) return null;
  const { int, frac } = parseNumeric(`${canonical}e${exp}`);
  const trimmed = frac.replace(/0+$/, '');
  const isZero = int === '0' && trimmed === '';
  const sign = (m[1] || m[2]) === '-' && !isZero ? '-' : '';
  return sign + int + (trimmed ? '.' + trimmed : '');
}

/**
 * Parse compact notation back to a JS number. Returns NaN when the text is not valid.
 *
 * @example parseCompact('১২.৫ লক্ষ') // 1250000
 * @example parseCompact('3.45Cr') // 34500000
 */
export function parseCompact(text: string): number {
  const canonical = parseCompactString(text);
  return canonical === null ? NaN : Number(canonical);
}
