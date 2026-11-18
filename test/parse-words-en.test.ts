import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { englishWords, englishWordsToNumber, englishWordsToNumberString, takaWordsEn } from '../src';

describe('englishWordsToNumber', () => {
  it.each([
    ['zero', 0],
    ['One', 1],
    ['nineteen', 19],
    ['Twenty One', 21],
    ['twenty-one', 21],
    ['Ninety Nine', 99],
    ['One Hundred', 100],
    ['one hundred and five', 105],
    ['Twelve Hundred', 1200],
    ['One Thousand Two Hundred Fifty', 1250],
    ['Twelve Lakh Thirty Four Thousand Five Hundred Sixty Seven', 1234567],
    ['one crore', 10000000],
    ['Ten Thousand Crore', 100000000000],
    ['one million two hundred thirty four thousand five hundred sixty seven', 1234567],
    ['Five Hundred Thousand', 500000],
    ['One Billion', 1000000000],
    ['minus five', -5],
    ['negative twelve', -12],
    ['three point one four', 3.14],
    ['zero point oh five', 0.05],
  ])('%s -> %d', (words, expected) => {
    expect(englishWordsToNumber(words)).toBe(expected);
  });

  it('accepts spelling variants, case, commas and a trailing "only"', () => {
    expect(englishWordsToNumber('FIVE LAC')).toBe(500000);
    expect(englishWordsToNumber('two lakhs fifty thousand')).toBe(250000);
    expect(englishWordsToNumber('Three Crores')).toBe(30000000);
    expect(englishWordsToNumber('One Lakh, Twenty Thousand Only')).toBe(120000);
    expect(englishWordsToNumber('  one   thousand  ')).toBe(1000);
  });

  it('reads the integer part of English Taka words', () => {
    const words = takaWordsEn(125000).replace(/ Taka.*$/, '');
    expect(englishWordsToNumber(words)).toBe(125000);
  });

  it('supports custom negative and decimal words', () => {
    expect(englishWordsToNumber('less two dot five', { negativeWords: ['less'], decimalWord: 'dot' })).toBe(-2.5);
  });

  it('returns exact strings for huge numbers', () => {
    const big = '123456789012345678901234567890';
    expect(englishWordsToNumberString(englishWords(big))).toBe(big);
    expect(englishWordsToNumberString(englishWords(big, { system: 'international' }))).toBe(big);
    expect(() => englishWordsToNumber(englishWords(big))).toThrow(RangeError);
  });

  it('normalises negative zero', () => {
    expect(englishWordsToNumberString('minus zero')).toBe('0');
  });

  it.each([
    '',
    'only',
    'hundred',
    'one one',
    'twenty twenty',
    'twelve five',
    'five hundred hundred',
    'thousand',
    'one thousand one lakh',
    'one thousand two thousand',
    'one million one lakh',
    'one zero',
    'one point',
    'point five',
    'one point twelve',
    'and one',
    'one apple',
  ])('rejects %j', (words) => {
    expect(() => englishWordsToNumber(words)).toThrow(TypeError);
  });

  it('round-trips englishWords in every system and style', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 10n ** 20n }),
        fc.constantFrom('indian' as const, 'international' as const),
        fc.constantFrom('title' as const, 'lower' as const, 'upper' as const, 'sentence' as const),
        fc.boolean(),
        fc.boolean(),
        (n, system, letterCase, hyphenate, useAnd) => {
          const words = englishWords(n, { system, case: letterCase, hyphenate, useAnd });
          expect(englishWordsToNumberString(words)).toBe(n.toString());
        },
      ),
    );
  });

  it('round-trips decimals and negatives', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: 1_000_000 }), fc.integer({ min: 0, max: 99 }), (i, f) => {
        const value = `${i}.${String(f).padStart(2, '0')}`;
        const expected = i === 0 && f === 0 ? '0.00' : value;
        expect(englishWordsToNumberString(englishWords(value))).toBe(expected);
      }),
    );
  });
});
