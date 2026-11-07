import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { englishWords } from '../src';

describe('englishWords: South Asian system (default)', () => {
  it.each([
    [0, 'Zero'],
    [1, 'One'],
    [13, 'Thirteen'],
    [20, 'Twenty'],
    [21, 'Twenty One'],
    [99, 'Ninety Nine'],
    [100, 'One Hundred'],
    [101, 'One Hundred One'],
    [999, 'Nine Hundred Ninety Nine'],
    [1000, 'One Thousand'],
    [1250, 'One Thousand Two Hundred Fifty'],
    [99999, 'Ninety Nine Thousand Nine Hundred Ninety Nine'],
    [100000, 'One Lakh'],
    [150000, 'One Lakh Fifty Thousand'],
    [1234567, 'Twelve Lakh Thirty Four Thousand Five Hundred Sixty Seven'],
    [10000000, 'One Crore'],
    [12345678, 'One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight'],
    [1000000000, 'One Hundred Crore'],
    [100000000000, 'Ten Thousand Crore'],
    [1000000000000, 'One Lakh Crore'],
    [10000000000000, 'Ten Lakh Crore'],
    [100000000000000, 'One Crore Crore'],
  ])('englishWords(%s)', (n, expected) => {
    expect(englishWords(n)).toBe(expected);
  });
});

describe('englishWords: international system', () => {
  const intl = { system: 'international' } as const;
  it.each([
    [0, 'Zero'],
    [1000, 'One Thousand'],
    [100000, 'One Hundred Thousand'],
    [1234567, 'One Million Two Hundred Thirty Four Thousand Five Hundred Sixty Seven'],
    [1000000000, 'One Billion'],
    [1000000000000, 'One Trillion'],
    [1000001, 'One Million One'],
    [5000000000n, 'Five Billion'],
    [10n ** 15n, 'One Quadrillion'],
    [10n ** 33n, 'One Decillion'],
    [10n ** 36n - 1n, 'Nine Hundred Ninety Nine Decillion Nine Hundred Ninety Nine Nonillion Nine Hundred Ninety Nine Octillion Nine Hundred Ninety Nine Septillion Nine Hundred Ninety Nine Sextillion Nine Hundred Ninety Nine Quintillion Nine Hundred Ninety Nine Quadrillion Nine Hundred Ninety Nine Trillion Nine Hundred Ninety Nine Billion Nine Hundred Ninety Nine Million Nine Hundred Ninety Nine Thousand Nine Hundred Ninety Nine'],
  ])('englishWords(%s, international)', (n, expected) => {
    expect(englishWords(n, intl)).toBe(expected);
  });

  it('throws beyond the supported scale', () => {
    expect(() => englishWords(10n ** 36n, intl)).toThrow(RangeError);
  });
});

describe('englishWords: options', () => {
  it('supports letter case modes', () => {
    expect(englishWords(1250, { case: 'lower' })).toBe('one thousand two hundred fifty');
    expect(englishWords(1250, { case: 'upper' })).toBe('ONE THOUSAND TWO HUNDRED FIFTY');
    expect(englishWords(1250, { case: 'sentence' })).toBe('One thousand two hundred fifty');
  });
  it('hyphenates compound numbers', () => {
    expect(englishWords(21, { hyphenate: true })).toBe('Twenty-One');
    expect(englishWords(99, { hyphenate: true, case: 'lower' })).toBe('ninety-nine');
  });
  it('inserts "and" in British style', () => {
    expect(englishWords(105, { useAnd: true })).toBe('One Hundred and Five');
    expect(englishWords(1005, { useAnd: true })).toBe('One Thousand and Five');
    expect(englishWords(1100, { useAnd: true })).toBe('One Thousand One Hundred');
    expect(englishWords(100005, { useAnd: true })).toBe('One Lakh and Five');
    expect(englishWords(1000005, { useAnd: true, system: 'international' })).toBe('One Million and Five');
  });
  it('handles decimals and negatives', () => {
    expect(englishWords(3.14)).toBe('Three Point One Four');
    expect(englishWords(-12.05)).toBe('Minus Twelve Point Zero Five');
    expect(englishWords('0.5', { case: 'lower' })).toBe('zero point five');
    expect(englishWords(-1, { negativeWord: 'negative' })).toBe('Negative One');
    expect(englishWords(1.5, { decimalWord: 'dot' })).toBe('One Dot Five');
  });
  it('accepts Bangla digit strings', () => {
    expect(englishWords('১২৩')).toBe('One Hundred Twenty Three');
  });
});

describe('englishWords: properties', () => {
  it('property: output only contains letters, spaces', () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 0n, max: 10n ** 30n }), (n) => {
        for (const system of ['indian', 'international'] as const) {
          const w = englishWords(n, { system });
          expect(w).toMatch(/^[A-Za-z]+( [A-Za-z]+)*$/);
        }
      }),
    );
  });
  it('property: lower-case output equals lowered title output', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1e12 }), (n) => {
        expect(englishWords(n, { case: 'lower' })).toBe(englishWords(n).toLowerCase());
      }),
    );
  });
});
