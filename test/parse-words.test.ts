import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { banglaWords, wordsToNumber, wordsToNumberString } from '../src';

describe('wordsToNumber', () => {
  it.each([
    ['শূন্য', 0],
    ['এক', 1],
    ['নিরানব্বই', 99],
    ['একশত', 100],
    ['একশত এক', 101],
    ['এক হাজার দুইশত', 1200],
    ['এক লক্ষ পঁচিশ হাজার', 125000],
    ['এক কোটি', 10000000],
    ['দশ হাজার কোটি', 100000000000],
    ['ঋণাত্মক পাঁচ', -5],
    ['তিন দশমিক এক চার', 3.14],
    ['শূন্য দশমিক পাঁচ', 0.5],
  ])('%s -> %d', (words, expected) => {
    expect(wordsToNumber(words)).toBe(expected);
  });

  it('accepts spelling variants', () => {
    expect(wordsToNumber('এক লাখ')).toBe(100000);
    expect(wordsToNumber('দুইশ')).toBe(200);
    expect(wordsToNumber('দুইশো পঞ্চাশ')).toBe(250);
    expect(wordsToNumber('দুই শত')).toBe(200);
    expect(wordsToNumber('  এক   হাজার  ')).toBe(1000);
  });

  it('supports custom negative and decimal words', () => {
    expect(wordsToNumber('মাইনাস দুই পয়েন্ট পাঁচ', { negativeWord: 'মাইনাস', decimalWord: 'পয়েন্ট' })).toBe(-2.5);
  });

  it('returns exact strings for huge numbers', () => {
    const big = '123456789012345678901234567890';
    expect(wordsToNumberString(banglaWords(big))).toBe(big);
    expect(() => wordsToNumber(banglaWords(big))).toThrow(RangeError);
  });

  it.each(['', '   ', 'hello', 'হাজার', 'হাজার এক', 'এক এক', 'ঋণাত্মক', 'এক দশমিক', 'এক দশমিক একশত', 'শূন্যশত', 'একশ হাজার'])(
    'rejects %j',
    (bad) => {
      expect(() => wordsToNumber(bad)).toThrow(TypeError);
    },
  );

  it('round-trips integers through banglaWords', () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 0n, max: 10n ** 30n }), (n) => {
        expect(wordsToNumberString(banglaWords(n))).toBe(n.toString());
      }),
    );
  });

  it('round-trips the লাখ / শ spellings and negatives', () => {
    fc.assert(
      fc.property(fc.integer({ min: -999_999_999, max: 999_999_999 }), (n) => {
        expect(wordsToNumber(banglaWords(n, { lakh: 'লাখ', hundred: 'শ' }))).toBe(n);
      }),
    );
  });

  it('round-trips decimals', () => {
    for (const s of ['0.5', '-12.075', '1000000.25', '99.9']) {
      expect(wordsToNumberString(banglaWords(s))).toBe(s);
    }
  });
});
