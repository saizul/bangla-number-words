import { parseNumeric, type NumberInput } from './numeric';

/** Words for 0-99. Bangla number names below 100 are irregular, so each is listed. */
export const BN_NAMES: readonly string[] = [
  'শূন্য', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়',
  'দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ',
  'বিশ', 'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আটাশ', 'ঊনত্রিশ',
  'ত্রিশ', 'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাঁইত্রিশ', 'আটত্রিশ', 'ঊনচল্লিশ',
  'চল্লিশ', 'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'ঊনপঞ্চাশ',
  'পঞ্চাশ', 'একান্ন', 'বাহান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'ঊনষাট',
  'ষাট', 'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'ঊনসত্তর',
  'সত্তর', 'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চুয়াত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আটাত্তর', 'ঊনআশি',
  'আশি', 'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'আটাশি', 'ঊননব্বই',
  'নব্বই', 'একানব্বই', 'বিরানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই',
];

export interface BanglaWordsOptions {
  /** Spelling of 100,000. Default 'লক্ষ'. */
  lakh?: 'লক্ষ' | 'লাখ';
  /** Spelling of the hundred suffix. Default 'শত' (দুইশত); 'শ' gives দুইশ. */
  hundred?: 'শত' | 'শ';
  /** Word placed before negative numbers. Default 'ঋণাত্মক'. */
  negativeWord?: string;
  /** Word between integer and fraction. Default 'দশমিক'. */
  decimalWord?: string;
}

interface Resolved {
  lakh: string;
  hundred: string;
  negativeWord: string;
  decimalWord: string;
}

export function resolveBn(o: BanglaWordsOptions = {}): Resolved {
  return {
    lakh: o.lakh ?? 'লক্ষ',
    hundred: o.hundred ?? 'শত',
    negativeWord: o.negativeWord ?? 'ঋণাত্মক',
    decimalWord: o.decimalWord ?? 'দশমিক',
  };
}

const name = (n: number): string => BN_NAMES[n] as string;

function below1000(n: number, r: Resolved): string[] {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h > 0) parts.push(name(h) + r.hundred);
  if (rest > 0) parts.push(name(rest));
  return parts;
}

function belowCrore(n: number, r: Resolved): string[] {
  const parts: string[] = [];
  const lakhs = Math.floor(n / 100000);
  const thousands = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  if (lakhs > 0) parts.push(name(lakhs), r.lakh);
  if (thousands > 0) parts.push(name(thousands), 'হাজার');
  parts.push(...below1000(rest, r));
  return parts;
}

const CRORE = 10000000n;

function big(n: bigint, r: Resolved): string[] {
  if (n < CRORE) return belowCrore(Number(n), r);
  const crores = n / CRORE;
  const rest = n % CRORE;
  // Beyond 99 crore the Bangladeshi system keeps counting crores ("দশ হাজার কোটি").
  const parts = [...big(crores, r), 'কোটি'];
  if (rest > 0n) parts.push(...belowCrore(Number(rest), r));
  return parts;
}

/** Cardinal words for a non-negative integer given as a digit string. */
export function integerToBanglaWords(int: string, options: BanglaWordsOptions = {}): string {
  const n = BigInt(int);
  if (n === 0n) return name(0);
  return big(n, resolveBn(options)).join(' ');
}

/**
 * Convert a number to Bangla words using the Bangladeshi numbering system.
 *
 * @example banglaWords(125000) // "এক লক্ষ পঁচিশ হাজার"
 */
export function banglaWords(input: NumberInput, options: BanglaWordsOptions = {}): string {
  const r = resolveBn(options);
  const { negative, int, frac } = parseNumeric(input);
  const parts: string[] = [];
  if (negative) parts.push(r.negativeWord);
  parts.push(integerToBanglaWords(int, options));
  if (frac.length > 0) {
    parts.push(r.decimalWord);
    for (const d of frac) parts.push(name(Number(d)));
  }
  return parts.join(' ');
}
