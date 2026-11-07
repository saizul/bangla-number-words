import { describe, expect, it } from 'vitest';
import {
  banglaDayOrdinal,
  banglaOrdinalShort,
  banglaOrdinalWords,
  englishOrdinalShort,
  englishOrdinalSuffix,
  englishOrdinalWords,
  formatOrdinal,
} from '../src';

describe('Bangla ordinals', () => {
  it.each([
    [1, 'প্রথম'],
    [2, 'দ্বিতীয়'],
    [3, 'তৃতীয়'],
    [4, 'চতুর্থ'],
    [5, 'পঞ্চম'],
    [6, 'ষষ্ঠ'],
    [7, 'সপ্তম'],
    [8, 'অষ্টম'],
    [9, 'নবম'],
    [10, 'দশম'],
    [11, 'এগারোতম'],
    [21, 'একুশতম'],
    [100, 'একশততম'],
    [1000, 'এক হাজারতম'],
    ['০৩', 'তৃতীয়'],
  ])('banglaOrdinalWords(%s) = %s', (n, expected) => {
    expect(banglaOrdinalWords(n)).toBe(expected);
  });

  it.each([
    [1, '১ম'],
    [2, '২য়'],
    [3, '৩য়'],
    [4, '৪র্থ'],
    [5, '৫ম'],
    [6, '৬ষ্ঠ'],
    [7, '৭ম'],
    [10, '১০ম'],
    [11, '১১তম'],
    [100, '১০০তম'],
  ])('banglaOrdinalShort(%s) = %s', (n, expected) => {
    expect(banglaOrdinalShort(n)).toBe(expected);
  });

  it('supports ASCII digits in the short form', () => {
    expect(banglaOrdinalShort(4, { digits: 'en' })).toBe('4র্থ');
  });

  it.each([
    [1, '১লা'],
    [2, '২রা'],
    [3, '৩রা'],
    [4, '৪ঠা'],
    [5, '৫ই'],
    [18, '১৮ই'],
    [19, '১৯শে'],
    [31, '৩১শে'],
  ])('banglaDayOrdinal(%s) = %s', (d, expected) => {
    expect(banglaDayOrdinal(d)).toBe(expected);
  });

  it('rejects invalid ordinals', () => {
    expect(() => banglaOrdinalWords(0)).toThrow(RangeError);
    expect(() => banglaOrdinalWords(-1)).toThrow(RangeError);
    expect(() => banglaOrdinalWords(1.5)).toThrow(RangeError);
    expect(() => banglaDayOrdinal(0)).toThrow(RangeError);
    expect(() => banglaDayOrdinal(32)).toThrow(RangeError);
  });
});

describe('English ordinals', () => {
  it.each([
    [1, 'First'],
    [2, 'Second'],
    [3, 'Third'],
    [4, 'Fourth'],
    [5, 'Fifth'],
    [8, 'Eighth'],
    [9, 'Ninth'],
    [12, 'Twelfth'],
    [19, 'Nineteenth'],
    [20, 'Twentieth'],
    [21, 'Twenty First'],
    [30, 'Thirtieth'],
    [80, 'Eightieth'],
    [100, 'One Hundredth'],
    [101, 'One Hundred First'],
    [1000, 'One Thousandth'],
  ])('englishOrdinalWords(%s) = %s', (n, expected) => {
    expect(englishOrdinalWords(n)).toBe(expected);
  });

  it.each([
    [1, '1st'], [2, '2nd'], [3, '3rd'], [4, '4th'], [10, '10th'], [11, '11th'], [12, '12th'],
    [13, '13th'], [21, '21st'], [22, '22nd'], [23, '23rd'], [101, '101st'], [111, '111th'], [112, '112th'],
  ])('englishOrdinalShort(%s) = %s', (n, expected) => {
    expect(englishOrdinalShort(n)).toBe(expected);
  });

  it('respects options', () => {
    expect(englishOrdinalWords(21, { hyphenate: true, case: 'lower' })).toBe('twenty-first');
  });
});

describe('English ordinal words, full range', () => {
  const small = [
    'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
    'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth',
    'eighteenth', 'nineteenth', 'twentieth', 'twenty-first',
  ];
  it.each(small.map((word, i) => [i + 1, word] as const))('%s -> %s', (n, word) => {
    expect(englishOrdinalWords(n, { case: 'lower', hyphenate: true })).toBe(word);
  });

  it.each([
    [40, 'fortieth'],
    [90, 'ninetieth'],
    [99, 'ninety-ninth'],
    [100, 'one hundredth'],
    [110, 'one hundred tenth'],
    [200, 'two hundredth'],
    [1000, 'one thousandth'],
    [1001, 'one thousand first'],
    [12000, 'twelve thousandth'],
  ])('%s -> %s', (n, word) => {
    expect(englishOrdinalWords(n, { case: 'lower', hyphenate: true })).toBe(word);
  });

  it('uses international scales on request', () => {
    expect(englishOrdinalWords(1_000_000, { system: 'international', case: 'lower' })).toBe('one millionth');
  });

  it('accepts Bangla digits and numeric strings', () => {
    expect(englishOrdinalWords('২১', { case: 'lower', hyphenate: true })).toBe('twenty-first');
    expect(englishOrdinalShort('০৩')).toBe('3rd');
    expect(englishOrdinalShort('123456789012345678901')).toBe('123456789012345678901st');
  });

  it('rejects non-positive and fractional input', () => {
    for (const bad of [0, -3, 2.5, '1.5']) {
      expect(() => englishOrdinalWords(bad)).toThrow(RangeError);
      expect(() => englishOrdinalShort(bad)).toThrow(RangeError);
      expect(() => formatOrdinal(bad)).toThrow(RangeError);
    }
  });
});

describe('englishOrdinalSuffix', () => {
  it.each([
    [1, 'st'], [2, 'nd'], [3, 'rd'], [4, 'th'], [10, 'th'], [11, 'th'], [12, 'th'], [13, 'th'],
    [14, 'th'], [20, 'th'], [21, 'st'], [22, 'nd'], [23, 'rd'], [100, 'th'], [101, 'st'],
    [111, 'th'], [112, 'th'], [113, 'th'], [121, 'st'], [1011, 'th'], [1012, 'th'],
  ])('%s -> %s', (n, suffix) => {
    expect(englishOrdinalSuffix(n)).toBe(suffix);
  });

  it('matches the short form for 1..1000', () => {
    for (let n = 1; n <= 1000; n++) {
      expect(englishOrdinalShort(n)).toBe(`${n}${englishOrdinalSuffix(n)}`);
    }
  });
});

describe('formatOrdinal', () => {
  it.each([
    [1, '1st'], [2, '2nd'], [3, '3rd'], [4, '4th'], [11, '11th'], [12, '12th'], [13, '13th'],
    [21, '21st'], [22, '22nd'], [101, '101st'], [111, '111th'],
  ])('defaults to short English: %s -> %s', (n, expected) => {
    expect(formatOrdinal(n)).toBe(expected);
  });

  it('spells out English words', () => {
    expect(formatOrdinal(3, { style: 'words' })).toBe('Third');
    expect(formatOrdinal(21, { style: 'words', case: 'lower', hyphenate: true })).toBe('twenty-first');
    expect(formatOrdinal(100, { style: 'words', case: 'lower' })).toBe('one hundredth');
  });

  it('supports Bangla', () => {
    expect(formatOrdinal(4, { locale: 'bn' })).toBe('৪র্থ');
    expect(formatOrdinal(4, { locale: 'bn', digits: 'en' })).toBe('4র্থ');
    expect(formatOrdinal(1, { locale: 'bn', style: 'words' })).toBe('প্রথম');
    expect(formatOrdinal(11, { locale: 'bn', style: 'words' })).toBe('এগারোতম');
  });
});
