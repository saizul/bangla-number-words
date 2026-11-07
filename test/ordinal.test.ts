import { describe, expect, it } from 'vitest';
import {
  banglaDayOrdinal,
  banglaOrdinalShort,
  banglaOrdinalWords,
  englishOrdinalShort,
  englishOrdinalWords,
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
