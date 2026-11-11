import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { formatCompact, parseCompact, parseCompactString } from '../src';

describe('formatCompact', () => {
  it.each([
    [0, '0'],
    [7, '7'],
    [999, '999'],
    [12.345, '12.35'],
    [1000, '1 Thousand'],
    [1500, '1.5 Thousand'],
    [45000, '45 Thousand'],
    [99999, '1 Lakh'],
    [99990, '99.99 Thousand'],
    [100000, '1 Lakh'],
    [125000, '1.25 Lakh'],
    [1250000, '12.5 Lakh'],
    [9999999, '1 Crore'],
    [10000000, '1 Crore'],
    [12345678, '1.23 Crore'],
    [34500000, '3.45 Crore'],
    [1000000000, '100 Crore'],
    [123456789012, '12,345.68 Crore'],
    [-1250000, '-12.5 Lakh'],
    [-0.001, '0'],
    ['১২৫০০০০', '12.5 Lakh'],
    ['1.5e6', '15 Lakh'],
    [10n ** 14n, '1,00,00,000 Crore'],
  ])('formatCompact(%s) -> %s', (n, expected) => {
    expect(formatCompact(n)).toBe(expected);
  });

  it.each([
    [1250000, '১২.৫ লক্ষ'],
    [5000, '৫ হাজার'],
    [34500000, '৩.৪৫ কোটি'],
    [999, '৯৯৯'],
    [-250000, '-২.৫ লক্ষ'],
    [123456789012, '১২,৩৪৫.৬৮ কোটি'],
  ])('Bangla: formatCompact(%s) -> %s', (n, expected) => {
    expect(formatCompact(n, { locale: 'bn' })).toBe(expected);
  });

  it('supports লাখ and mixed digit scripts', () => {
    expect(formatCompact(100000, { locale: 'bn', lakh: 'লাখ' })).toBe('১ লাখ');
    expect(formatCompact(1250000, { locale: 'bn', digits: 'en' })).toBe('12.5 লক্ষ');
    expect(formatCompact(1250000, { digits: 'bn' })).toBe('১২.৫ Lakh');
  });

  it.each([
    [5000, '5K'],
    [1250000, '12.5L'],
    [34500000, '3.45Cr'],
    [999, '999'],
  ])('short style: %s -> %s', (n, expected) => {
    expect(formatCompact(n, { style: 'short' })).toBe(expected);
  });

  it('short style has no Bangla abbreviations', () => {
    expect(formatCompact(1250000, { locale: 'bn', style: 'short' })).toBe('১২.৫ লক্ষ');
  });

  it('controls fraction digits and rounds half-up', () => {
    expect(formatCompact(1255000, { maximumFractionDigits: 1 })).toBe('12.6 Lakh');
    expect(formatCompact(1254999, { maximumFractionDigits: 1 })).toBe('12.5 Lakh');
    expect(formatCompact(1250000, { minimumFractionDigits: 2 })).toBe('12.50 Lakh');
    expect(formatCompact(1000000, { minimumFractionDigits: 1 })).toBe('10.0 Lakh');
    expect(formatCompact(12345678, { maximumFractionDigits: 0 })).toBe('1 Crore');
    expect(formatCompact(12345678, { maximumFractionDigits: 7 })).toBe('1.2345678 Crore');
    expect(formatCompact(2.5, { maximumFractionDigits: 0 })).toBe('3');
  });

  it('moves to the next unit when rounding spills over', () => {
    expect(formatCompact(999.999)).toBe('1 Thousand');
    expect(formatCompact(99999.6, { maximumFractionDigits: 0 })).toBe('1 Lakh');
    expect(formatCompact(9999999, { maximumFractionDigits: 1 })).toBe('1 Crore');
    expect(formatCompact(999.999, { thousand: false })).toBe('1,000');
    expect(formatCompact(99999.999, { thousand: false })).toBe('1 Lakh');
  });

  it('can skip the thousand tier', () => {
    expect(formatCompact(45000, { thousand: false })).toBe('45,000');
    expect(formatCompact(45000.5, { thousand: false, locale: 'bn' })).toBe('৪৫,০০০.৫');
    expect(formatCompact(450000, { thousand: false })).toBe('4.5 Lakh');
  });

  it('accepts custom unit labels, symbol and separators', () => {
    expect(formatCompact(250000, { units: { lakh: 'Lac' } })).toBe('2.5 Lac');
    expect(formatCompact(250000, { style: 'short', units: { lakh: 'lac' } })).toBe('2.5 lac');
    expect(formatCompact(5000, { style: 'short', units: { lakh: 'lac' } })).toBe('5K');
    expect(formatCompact(34500000, { symbol: '৳' })).toBe('৳3.45 Crore');
    expect(formatCompact(-34500000, { symbol: '৳', style: 'short' })).toBe('-৳3.45Cr');
    expect(formatCompact(34500000, { symbol: '৳', locale: 'bn' })).toBe('৳৩.৪৫ কোটি');
    expect(formatCompact(123456789012, { separator: ' ', decimalSeparator: ',' })).toBe('12 345,68 Crore');
  });

  it('rejects bad options and input', () => {
    expect(() => formatCompact(1, { maximumFractionDigits: -1 })).toThrow(RangeError);
    expect(() => formatCompact(1, { maximumFractionDigits: 1.5 })).toThrow(RangeError);
    expect(() => formatCompact(1, { minimumFractionDigits: 3 })).toThrow(RangeError);
    expect(() => formatCompact('abc')).toThrow(TypeError);
    expect(() => formatCompact(Infinity)).toThrow(RangeError);
  });
});

describe('parseCompact', () => {
  it.each([
    ['12.5 Lakh', 1250000],
    ['12.5L', 1250000],
    ['12.5 lac', 1250000],
    ['2 lakhs', 200000],
    ['১২.৫ লক্ষ', 1250000],
    ['১২.৫ লাখ', 1250000],
    ['৫ হাজার', 5000],
    ['5k', 5000],
    ['1.5 Thousand', 1500],
    ['3.45Cr', 34500000],
    ['3.45 CRORE', 34500000],
    ['২ কোটি', 20000000],
    ['12,345.68 Crore', 123456800000],
    ['৳3.45Cr', 34500000],
    ['৳ ৩.৪৫ কোটি', 34500000],
    ['Tk. 2 Lakh', 200000],
    ['BDT 5K', 5000],
    ['-৳3.45Cr', -34500000],
    ['৳-2 lakh', -200000],
    ['−১ লক্ষ', -100000],
    ['1,23,456', 123456],
    ['999', 999],
    ['0.5 lakh', 50000],
    ['0.001 K', 1],
    ['1.2345678 Crore', 12345678],
    ['2 Cr.', 20000000],
    ['0 Crore', 0],
  ])('parseCompact(%j) -> %s', (text, expected) => {
    expect(parseCompact(text)).toBe(expected);
  });

  it.each(['', 'lakh', '12 million', '1.2.3 lakh', 'abc', '12 lakh crore', '-+5K', '--5K', '5 K K'])(
    'rejects %j',
    (text) => {
      expect(parseCompactString(text)).toBeNull();
      expect(parseCompact(text)).toBeNaN();
    },
  );

  it('returns exact strings for huge and fractional values', () => {
    expect(parseCompactString('12345678901234567890.5 Crore')).toBe('123456789012345678905000000');
    expect(parseCompactString('0.00001 K')).toBe('0.01');
    expect(parseCompactString('-0 lakh')).toBe('0');
    expect(parseCompactString('1.50 Lakh')).toBe('150000');
    expect(parseCompactString(42 as unknown as string)).toBeNull();
  });
});

describe('compact properties', () => {
  const variants = [
    {},
    { locale: 'bn' as const },
    { style: 'short' as const },
    { locale: 'bn' as const, lakh: 'লাখ' as const, symbol: '৳' },
    { thousand: false },
  ];

  it('round-trips integers exactly when no digits are dropped', () => {
    fc.assert(
      fc.property(fc.bigInt({ min: -(10n ** 30n), max: 10n ** 30n }), fc.constantFrom(...variants), (n, opts) => {
        const text = formatCompact(n, { ...opts, maximumFractionDigits: 7 });
        expect(parseCompactString(text)).toBe(n.toString());
      }),
    );
  });

  it('stays within half a unit of the last kept digit', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2_000_000_000 }), fc.integer({ min: 0, max: 3 }), (n, digits) => {
        const text = formatCompact(n, { maximumFractionDigits: digits });
        const back = parseCompact(text);
        const unit = n >= 1e7 ? 1e7 : n >= 1e5 ? 1e5 : n >= 1e3 ? 1e3 : 1;
        expect(Math.abs(back - n)).toBeLessThanOrEqual((unit / 10 ** digits) * 0.5 + 1e-6);
      }),
    );
  });

  it('never shows a mantissa that belongs to the next unit', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 9_999_999 }), fc.integer({ min: 0, max: 2 }), (n, digits) => {
        const text = formatCompact(n, { maximumFractionDigits: digits });
        const mantissa = Number(text.split(' ')[0]?.replace(/,/g, ''));
        if (text.endsWith('Thousand') || text.endsWith('Lakh')) expect(mantissa).toBeLessThan(100);
        if (!text.includes(' ')) expect(mantissa).toBeLessThan(1000);
      }),
    );
  });
});
