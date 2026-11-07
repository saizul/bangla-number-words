import { parseNumeric, type NumberInput } from './numeric';

export type EnglishSystem = 'indian' | 'international';
export type EnglishCase = 'title' | 'lower' | 'upper' | 'sentence';

export interface EnglishWordsOptions {
  /** 'indian' (thousand, lakh, crore) or 'international' (million, billion...). Default 'indian'. */
  system?: EnglishSystem;
  /** Letter case of the result. Default 'title'. */
  case?: EnglishCase;
  /** Join tens and ones with a hyphen ("Twenty-One"). Default false. */
  hyphenate?: boolean;
  /** Insert "and" British style ("One Hundred and Five"). Default false. */
  useAnd?: boolean;
  /** Word placed before negative numbers. Default 'minus'. */
  negativeWord?: string;
  /** Word between integer and fraction. Default 'point'. */
  decimalWord?: string;
}

const ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
] as const;
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'] as const;
const SCALES = [
  '', 'thousand', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion',
  'sextillion', 'septillion', 'octillion', 'nonillion', 'decillion',
] as const;

interface Cfg {
  hyphenate: boolean;
  useAnd: boolean;
}

function below100(n: number, c: Cfg): string {
  if (n < 20) return ONES[n] as string;
  const t = TENS[Math.floor(n / 10)] as string;
  const o = n % 10;
  return o === 0 ? t : t + (c.hyphenate ? '-' : ' ') + (ONES[o] as string);
}

function below1000(n: number, c: Cfg, hasHigher: boolean): string[] {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h > 0) parts.push(ONES[h] as string, 'hundred');
  if (rest > 0) {
    if (c.useAnd && (h > 0 || hasHigher)) parts.push('and');
    parts.push(below100(rest, c));
  }
  return parts;
}

function belowCrore(n: number, c: Cfg, hasHigher: boolean): string[] {
  const parts: string[] = [];
  const lakhs = Math.floor(n / 100000);
  const thousands = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  if (lakhs > 0) parts.push(below100(lakhs, c), 'lakh');
  if (thousands > 0) parts.push(below100(thousands, c), 'thousand');
  parts.push(...below1000(rest, c, hasHigher || lakhs > 0 || thousands > 0));
  return parts;
}

const CRORE = 10000000n;

function indian(n: bigint, c: Cfg, hasHigher = false): string[] {
  if (n < CRORE) return belowCrore(Number(n), c, hasHigher);
  const parts = [...indian(n / CRORE, c), 'crore'];
  const rest = n % CRORE;
  if (rest > 0n) parts.push(...belowCrore(Number(rest), c, true));
  return parts;
}

function international(n: bigint, c: Cfg): string[] {
  const groups: number[] = [];
  let rest = n;
  while (rest > 0n) {
    groups.push(Number(rest % 1000n));
    rest /= 1000n;
  }
  if (groups.length > SCALES.length) {
    throw new RangeError('Number too large for the international system (max < 10^36)');
  }
  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i] as number;
    if (g === 0) continue;
    parts.push(...below1000(g, c, i === 0 && groups.length > 1));
    if (i > 0) parts.push(SCALES[i] as string);
  }
  return parts;
}

function integerLower(int: string, system: EnglishSystem, c: Cfg): string {
  const n = BigInt(int);
  if (n === 0n) return 'zero';
  return (system === 'indian' ? indian(n, c) : international(n, c)).join(' ');
}

const ORDINAL_IRREGULAR: Record<string, string> = {
  one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth',
  nine: 'ninth', twelve: 'twelfth',
};

/** Turn the last word of a lower-case cardinal phrase into its ordinal form. */
export function ordinalizeLower(phrase: string): string {
  const m = /^(.*?)([a-z]+)$/.exec(phrase);
  if (!m) return phrase;
  const head = m[1] as string;
  const last = m[2] as string;
  const irregular = ORDINAL_IRREGULAR[last];
  if (irregular) return head + irregular;
  if (last.endsWith('y')) return head + last.slice(0, -1) + 'ieth';
  return head + last + 'th';
}

/** Apply the requested letter case to a lower-case English phrase. */
export function applyCase(text: string, mode: EnglishCase = 'title'): string {
  switch (mode) {
    case 'lower':
      return text;
    case 'upper':
      return text.toUpperCase();
    case 'sentence':
      return text.charAt(0).toUpperCase() + text.slice(1);
    case 'title':
      return text.replace(/(^|[\s-])([a-z])([a-z]*)/g, (all, sep: string, first: string, rest: string) =>
        sep + (first + rest === 'and' ? 'and' : first.toUpperCase() + rest),
      );
  }
}

/** Lower-case cardinal words for a non-negative integer digit string. */
export function integerToEnglishLower(int: string, options: EnglishWordsOptions = {}): string {
  return integerLower(int, options.system ?? 'indian', {
    hyphenate: options.hyphenate ?? false,
    useAnd: options.useAnd ?? false,
  });
}

/**
 * Convert a number to English words. Defaults to the South Asian system
 * (thousand, lakh, crore); pass `{ system: 'international' }` for million/billion.
 *
 * @example englishWords(1234567) // "Twelve Lakh Thirty Four Thousand Five Hundred Sixty Seven"
 */
export function englishWords(input: NumberInput, options: EnglishWordsOptions = {}): string {
  const { negative, int, frac } = parseNumeric(input);
  const parts: string[] = [];
  if (negative) parts.push(options.negativeWord ?? 'minus');
  parts.push(integerToEnglishLower(int, options));
  if (frac.length > 0) {
    parts.push(options.decimalWord ?? 'point');
    for (const d of frac) parts.push(ONES[Number(d)] as string);
  }
  return applyCase(parts.join(' '), options.case);
}
