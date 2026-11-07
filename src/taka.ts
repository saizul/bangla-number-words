import { parseNumeric, roundDecimal, type NumberInput } from './numeric';
import { integerToBanglaWords, resolveBn, type BanglaWordsOptions } from './words-bn';
import {
  applyCase,
  integerToEnglishLower,
  type EnglishCase,
  type EnglishSystem,
} from './words-en';

export interface TakaBanglaOptions extends BanglaWordsOptions {
  /** Major unit. Default 'টাকা'. */
  majorUnit?: string;
  /** Minor unit. Default 'পয়সা'. */
  minorUnit?: string;
  /** Closing word. Default 'মাত্র'. Use '' to omit. */
  suffix?: string;
  /** Print "শূন্য পয়সা" when the paisa part is zero. Default false. */
  showZeroMinor?: boolean;
}

export interface TakaEnglishOptions {
  system?: EnglishSystem;
  case?: EnglishCase;
  hyphenate?: boolean;
  useAnd?: boolean;
  /** Default 'Taka'. */
  majorUnit?: string;
  /** Default 'Paisa'. */
  minorUnit?: string;
  /** Default 'Only'. Use '' to omit. */
  suffix?: string;
  /** Word placed before negative amounts. Default 'Minus'. */
  negativeWord?: string;
  /** Word joining taka and paisa. Default 'and'. */
  joiner?: string;
  /** Print "Zero Paisa" when the paisa part is zero. Default false. */
  showZeroMinor?: boolean;
}

export interface TakaOptions extends TakaBanglaOptions, TakaEnglishOptions {
  /** Output language. Default 'bn'. */
  lang?: 'bn' | 'en';
}

interface Amount {
  negative: boolean;
  taka: string;
  paisa: number;
}

/** Split an amount into whole taka and paisa, rounding half-up to 2 decimals. */
export function splitTaka(amount: NumberInput): Amount {
  const { negative, int, frac } = parseNumeric(amount);
  const rounded = roundDecimal(int, frac, 2);
  const paisa = Number(rounded.frac.padEnd(2, '0') || '0');
  const isZero = rounded.int === '0' && paisa === 0;
  return { negative: negative && !isZero, taka: rounded.int, paisa };
}

/**
 * Taka amount in Bangla words for invoices and cheques.
 *
 * @example takaWordsBn(1250.5) // "এক হাজার দুইশত পঞ্চাশ টাকা পঞ্চাশ পয়সা মাত্র"
 */
export function takaWordsBn(amount: NumberInput, options: TakaBanglaOptions = {}): string {
  const { negative, taka, paisa } = splitTaka(amount);
  const major = options.majorUnit ?? 'টাকা';
  const minor = options.minorUnit ?? 'পয়সা';
  const suffix = options.suffix ?? 'মাত্র';
  const parts: string[] = [];
  if (negative) parts.push(resolveBn(options).negativeWord);
  const hasTaka = taka !== '0';
  if (hasTaka || paisa === 0) parts.push(integerToBanglaWords(taka, options), major);
  if (paisa > 0 || (options.showZeroMinor && hasTaka)) {
    parts.push(integerToBanglaWords(String(paisa), options), minor);
  }
  if (suffix) parts.push(suffix);
  return parts.join(' ');
}

/**
 * Taka amount in English words for invoices and cheques.
 *
 * @example takaWordsEn(1250.5) // "One Thousand Two Hundred Fifty Taka and Fifty Paisa Only"
 */
export function takaWordsEn(amount: NumberInput, options: TakaEnglishOptions = {}): string {
  const { negative, taka, paisa } = splitTaka(amount);
  const mode = options.case ?? 'title';
  const wordOpts = { system: options.system, hyphenate: options.hyphenate, useAnd: options.useAnd };
  const hasTaka = taka !== '0';
  const showMinor = paisa > 0 || (options.showZeroMinor === true && hasTaka);

  // Labels are kept out of the case transform when the caller supplies them,
  // so "BDT" stays "BDT" in title case.
  const labels: string[] = [];
  const label = (custom: string | undefined, fallback: string): string => {
    const text = custom ?? fallback;
    const shown =
      mode === 'upper' ? text.toUpperCase() : mode === 'lower' ? text.toLowerCase()
      : custom === undefined && mode === 'sentence' ? text.toLowerCase() : text;
    labels.push(shown);
    return String.fromCharCode(0xe000 + labels.length - 1);
  };
  const major = label(options.majorUnit, 'Taka');
  const minor = label(options.minorUnit, 'Paisa');
  const suffix = options.suffix === '' ? '' : label(options.suffix, 'Only');
  const minus = negative ? label(options.negativeWord, 'Minus') : '';

  const parts: string[] = [];
  if (negative) parts.push(minus);
  if (hasTaka || !showMinor) parts.push(integerToEnglishLower(taka, wordOpts), major);
  if (showMinor) {
    if (hasTaka) parts.push((options.joiner ?? 'and').toLowerCase());
    parts.push(integerToEnglishLower(String(paisa), wordOpts), minor);
  }
  if (suffix) parts.push(suffix);
  return applyCase(parts.join(' '), mode).replace(/[\ue000-\uf8ff]/g, (c) => labels[c.charCodeAt(0) - 0xe000] as string);
}

/** Taka amount in words; `lang` selects Bangla (default) or English. */
export function takaWords(amount: NumberInput, options: TakaOptions = {}): string {
  return options.lang === 'en' ? takaWordsEn(amount, options) : takaWordsBn(amount, options);
}
