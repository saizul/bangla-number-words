import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { formatCurrency, formatNumber, groupDigits, parseNumber, parseNumberString } from '../src';

describe('formatNumber', () => {
  it.each([
    [0, '0'],
    [7, '7'],
    [999, '999'],
    [1000, '1,000'],
    [1234, '1,234'],
    [12345, '12,345'],
    [100000, '1,00,000'],
    [123456, '1,23,456'],
    [1234567, '12,34,567'],
    [12345678, '1,23,45,678'],
    [123456789, '12,34,56,789'],
    [1234567890, '1,23,45,67,890'],
    [-1234567, '-12,34,567'],
    [1234.5, '1,234.5'],
    ['1234567.891', '12,34,567.891'],
    [123456789012345678901234567890n, ''],
  ])('formatNumber(%s)', (n, expected) => {
    // the bigint row is recomputed below, skip exact check for it
    if (typeof n === 'bigint') {
      expect(formatNumber(n).replace(/,/g, '')).toBe(n.toString());
      return;
    }
    expect(formatNumber(n)).toBe(expected);
  });

  it('supports international grouping', () => {
    expect(formatNumber(12345678, { grouping: 'international' })).toBe('12,345,678');
    expect(formatNumber(999, { grouping: 'international' })).toBe('999');
    expect(formatNumber(1000, { grouping: 'international' })).toBe('1,000');
  });

  it('supports no grouping and custom separators', () => {
    expect(formatNumber(12345678, { grouping: 'none' })).toBe('12345678');
    expect(formatNumber(1234567.5, { separator: ' ', decimalSeparator: ',' })).toBe('12 34 567,5');
  });

  it('supports Bangla digits', () => {
    expect(formatNumber(12345678, { digits: 'bn' })).toBe('১,২৩,৪৫,৬৭৮');
    expect(formatNumber(-1500.5, { digits: 'bn' })).toBe('-১,৫০০.৫');
    expect(formatNumber('১২৩৪৫৬', { digits: 'en' })).toBe('1,23,456');
  });

  it('handles fraction digit options', () => {
    expect(formatNumber(1234.5, { minimumFractionDigits: 2 })).toBe('1,234.50');
    expect(formatNumber(1.25, { maximumFractionDigits: 1 })).toBe('1.3');
    expect(formatNumber(1.249, { maximumFractionDigits: 1 })).toBe('1.2');
    expect(formatNumber(999.999, { maximumFractionDigits: 2 })).toBe('1,000.00');
    expect(formatNumber(9.5, { maximumFractionDigits: 0 })).toBe('10');
    expect(formatNumber(1, { minimumFractionDigits: 2, maximumFractionDigits: 2 })).toBe('1.00');
    expect(formatNumber(-0.001, { maximumFractionDigits: 2 })).toBe('0.00');
  });

  it('formats currency', () => {
    expect(formatCurrency(1234567.891)).toBe('৳12,34,567.89');
    expect(formatCurrency(5)).toBe('৳5.00');
    expect(formatCurrency(-1500)).toBe('-৳1,500.00');
    expect(formatCurrency(1500, { digits: 'bn' })).toBe('৳১,৫০০.০০');
    expect(formatCurrency(10, { symbol: 'BDT ' })).toBe('BDT 10.00');
  });

  it('groupDigits works directly', () => {
    expect(groupDigits('1234567')).toBe('12,34,567');
    expect(groupDigits('1234567', 'international')).toBe('1,234,567');
    expect(groupDigits('12')).toBe('12');
  });
});

describe('parseNumber', () => {
  it.each([
    ['১,২৩,৪৫,৬৭৮', 12345678],
    ['১,২৩,৪৫,৬৭৮.৫০', 12345678.5],
    ['1,23,45,678', 12345678],
    ['12,345,678', 12345678],
    ['-১,০০০', -1000],
    ['−1,000', -1000],
    ['+5', 5],
    ['.5', 0.5],
    ['০.২৫', 0.25],
    ['  42  ', 42],
    ['1 234 567', 1234567],
    ['007', 7],
    ['12.', 12],
  ])('parseNumber(%s) = %s', (text, expected) => {
    expect(parseNumber(text)).toBe(expected);
  });

  it.each([[''], ['abc'], ['1.2.3'], ['--5'], ['1e5'], ['12a'], ['.']])('parseNumber(%s) is NaN', (text) => {
    expect(parseNumber(text)).toBeNaN();
  });

  it('parseNumberString keeps full precision', () => {
    expect(parseNumberString('১২,৩৪৫,৬৭৮,৯০১,২৩৪,৫৬৭,৮৯০')).toBe('12345678901234567890');
    expect(parseNumberString('-0.50')).toBe('-0.50');
    expect(parseNumberString('x')).toBeNull();
  });
});

describe('format/parse round trips', () => {
  const opts = fc.record({
    digits: fc.constantFrom('bn', 'en') as fc.Arbitrary<'bn' | 'en'>,
    grouping: fc.constantFrom('indian', 'international', 'none') as fc.Arbitrary<'indian' | 'international' | 'none'>,
  });

  it('property: parseNumber(formatNumber(n)) === n for safe integers', () => {
    fc.assert(
      fc.property(fc.integer({ min: Number.MIN_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER }), opts, (n, o) => {
        expect(parseNumber(formatNumber(n, o))).toBe(n);
      }),
    );
  });

  it('property: parseNumber(formatNumber(x)) === x for 2-decimal amounts', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1e11, max: 1e11 }), opts, (cents, o) => {
        const x = cents / 100;
        expect(parseNumber(formatNumber(x, { ...o, minimumFractionDigits: 2 }))).toBe(x);
      }),
    );
  });

  it('property: grouping preserves the digits', () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 0n, max: 10n ** 40n }), opts, (n, o) => {
        const out = formatNumber(n, o);
        expect(parseNumberString(out)).toBe(n.toString());
      }),
    );
  });

  it('property: Indian grouping has 3 digits last, then pairs', () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 1000n, max: 10n ** 30n }), (n) => {
        const parts = formatNumber(n).split(',');
        expect(parts[parts.length - 1]).toHaveLength(3);
        for (const p of parts.slice(1, -1)) expect(p).toHaveLength(2);
        expect(parts[0]!.length).toBeLessThanOrEqual(2);
      }),
    );
  });
});
