import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { hasBanglaDigits, isBanglaDigits, toBanglaDigits, toEnglishDigits } from '../src';

describe('digits', () => {
  it.each([
    [0, '০'],
    [7, '৭'],
    [1234567890, '১২৩৪৫৬৭৮৯০'],
    ['2024', '২০২৪'],
    ['Room 12, Floor 3', 'Room ১২, Floor ৩'],
    ['3.14', '৩.১৪'],
    [-45, '-৪৫'],
    [123456789012345678901234567890n, '১২৩৪৫৬৭৮৯০১২৩৪৫৬৭৮৯০১২৩৪৫৬৭৮৯০'],
    ['', ''],
    ['abc', 'abc'],
  ])('toBanglaDigits(%s) = %s', (input, expected) => {
    expect(toBanglaDigits(input)).toBe(expected);
  });

  it.each([
    ['০', '0'],
    ['১২৩৪৫৬৭৮৯০', '1234567890'],
    ['১,২৩,৪৫,৬৭৮', '1,23,45,678'],
    ['৩.১৪', '3.14'],
    ['মোট ৫০ টাকা', 'মোট 50 টাকা'],
    ['123', '123'],
    ['', ''],
  ])('toEnglishDigits(%s) = %s', (input, expected) => {
    expect(toEnglishDigits(input)).toBe(expected);
  });

  it('detects Bangla digits', () => {
    expect(hasBanglaDigits('abc ৫')).toBe(true);
    expect(hasBanglaDigits('abc 5')).toBe(false);
    expect(isBanglaDigits('১২৩')).toBe(true);
    expect(isBanglaDigits('১২3')).toBe(false);
    expect(isBanglaDigits('')).toBe(false);
  });

  it('property: toEnglishDigits(toBanglaDigits(s)) round-trips digit strings', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[0-9.,-]{0,40}$/), (s) => {
        expect(toEnglishDigits(toBanglaDigits(s))).toBe(s);
      }),
    );
  });

  it('property: toBanglaDigits(toEnglishDigits(s)) round-trips Bangla digit strings', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[০-৯]{0,30}$/), (s) => {
        expect(toBanglaDigits(toEnglishDigits(s))).toBe(s);
      }),
    );
  });
});
