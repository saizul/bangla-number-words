import { toBanglaDigits } from './digits';
import { integerToBanglaWords, type BanglaWordsOptions } from './words-bn';
import {
  applyCase,
  integerToEnglishLower,
  ordinalizeLower,
  type EnglishWordsOptions,
} from './words-en';
import { parseNumeric, type NumberInput } from './numeric';

const BN_ORDINAL_WORDS: Record<number, string> = {
  1: 'প্রথম',
  2: 'দ্বিতীয়',
  3: 'তৃতীয়',
  4: 'চতুর্থ',
  5: 'পঞ্চম',
  6: 'ষষ্ঠ',
  7: 'সপ্তম',
  8: 'অষ্টম',
  9: 'নবম',
  10: 'দশম',
};

const BN_ORDINAL_SHORT: Record<number, string> = {
  1: 'ম', 2: 'য়', 3: 'য়', 4: 'র্থ', 5: 'ম', 6: 'ষ্ঠ', 7: 'ম', 8: 'ম', 9: 'ম', 10: 'ম',
};

function positiveInteger(input: NumberInput, allowZero = false): string {
  const { negative, int, frac } = parseNumeric(input);
  if (negative || /[1-9]/.test(frac) || (!allowZero && int === '0')) {
    throw new RangeError('Ordinals require a positive integer');
  }
  return int;
}

/**
 * Bangla ordinal in words: প্রথম, দ্বিতীয়, ... দশম, then the cardinal plus "তম"
 * (এগারোতম, একুশতম, একশততম).
 */
export function banglaOrdinalWords(input: NumberInput, options: BanglaWordsOptions = {}): string {
  const int = positiveInteger(input);
  const small = BN_ORDINAL_WORDS[Number(int.length <= 2 ? int : 0)];
  if (small) return small;
  return integerToBanglaWords(int, options) + 'তম';
}

/**
 * Short Bangla ordinal with digits: ১ম, ২য়, ৩য়, ৪র্থ, ৫ম, ৬ষ্ঠ, ৭ম ... ১০ম, ১১তম.
 * Pass `{ digits: 'en' }` for ASCII digits (1ম).
 */
export function banglaOrdinalShort(input: NumberInput, options: { digits?: 'bn' | 'en' } = {}): string {
  const int = positiveInteger(input);
  const n = int.length <= 2 ? Number(int) : 0;
  const suffix = BN_ORDINAL_SHORT[n] ?? 'তম';
  return (options.digits === 'en' ? int : toBanglaDigits(int)) + suffix;
}

/**
 * Day-of-month ordinal used in Bangla dates: ১লা, ২রা, ৩রা, ৪ঠা, ৫ই ... ১৮ই, ১৯শে ... ৩১শে.
 */
export function banglaDayOrdinal(day: number, options: { digits?: 'bn' | 'en' } = {}): string {
  if (!Number.isInteger(day) || day < 1 || day > 31) throw new RangeError('Day must be 1-31');
  const suffix = day === 1 ? 'লা' : day === 2 || day === 3 ? 'রা' : day === 4 ? 'ঠা' : day <= 18 ? 'ই' : 'শে';
  return (options.digits === 'en' ? String(day) : toBanglaDigits(day)) + suffix;
}

/** English ordinal in words: First, Second, Twenty First, One Hundredth. */
export function englishOrdinalWords(input: NumberInput, options: EnglishWordsOptions = {}): string {
  const int = positiveInteger(input);
  return applyCase(ordinalizeLower(integerToEnglishLower(int, options)), options.case);
}

/** English ordinal with digits: 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, 21st, 112th. */
export function englishOrdinalShort(input: NumberInput): string {
  const int = positiveInteger(input);
  const last2 = Number(int.slice(-2));
  const last = last2 % 10;
  const suffix = last2 >= 11 && last2 <= 13 ? 'th' : last === 1 ? 'st' : last === 2 ? 'nd' : last === 3 ? 'rd' : 'th';
  return int + suffix;
}
