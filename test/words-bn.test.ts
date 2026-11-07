import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { BN_NAMES, banglaWords } from '../src';

describe('banglaWords: integers', () => {
  it.each([
    [0, 'শূন্য'],
    [1, 'এক'],
    [2, 'দুই'],
    [5, 'পাঁচ'],
    [9, 'নয়'],
    [10, 'দশ'],
    [11, 'এগারো'],
    [12, 'বারো'],
    [15, 'পনেরো'],
    [19, 'উনিশ'],
    [20, 'বিশ'],
    [21, 'একুশ'],
    [25, 'পঁচিশ'],
    [29, 'ঊনত্রিশ'],
    [37, 'সাঁইত্রিশ'],
    [42, 'বিয়াল্লিশ'],
    [49, 'ঊনপঞ্চাশ'],
    [53, 'তিপ্পান্ন'],
    [64, 'চৌষট্টি'],
    [79, 'ঊনআশি'],
    [89, 'ঊননব্বই'],
    [99, 'নিরানব্বই'],
    [100, 'একশত'],
    [101, 'একশত এক'],
    [110, 'একশত দশ'],
    [250, 'দুইশত পঞ্চাশ'],
    [999, 'নয়শত নিরানব্বই'],
    [1000, 'এক হাজার'],
    [1001, 'এক হাজার এক'],
    [1250, 'এক হাজার দুইশত পঞ্চাশ'],
    [10000, 'দশ হাজার'],
    [99999, 'নিরানব্বই হাজার নয়শত নিরানব্বই'],
    [100000, 'এক লক্ষ'],
    [105000, 'এক লক্ষ পাঁচ হাজার'],
    [125000, 'এক লক্ষ পঁচিশ হাজার'],
    [1000000, 'দশ লক্ষ'],
    [9999999, 'নিরানব্বই লক্ষ নিরানব্বই হাজার নয়শত নিরানব্বই'],
    [10000000, 'এক কোটি'],
    [12345678, 'এক কোটি তেইশ লক্ষ পঁয়তাল্লিশ হাজার ছয়শত আটাত্তর'],
    [100000000, 'দশ কোটি'],
    [999999999, 'নিরানব্বই কোটি নিরানব্বই লক্ষ নিরানব্বই হাজার নয়শত নিরানব্বই'],
    [1000000000, 'একশত কোটি'],
    [100000000000, 'দশ হাজার কোটি'],
    [1000000000000, 'এক লক্ষ কোটি'],
    [10000000000000, 'দশ লক্ষ কোটি'],
    [100000000000000, 'এক কোটি কোটি'],
  ])('banglaWords(%s)', (n, expected) => {
    expect(banglaWords(n)).toBe(expected);
  });

  it('handles bigint and string inputs of any size', () => {
    expect(banglaWords(10n ** 14n)).toBe('এক কোটি কোটি');
    expect(banglaWords('100000000000000')).toBe('এক কোটি কোটি');
    expect(banglaWords(10n ** 21n)).toBe('এক কোটি কোটি কোটি');
    expect(banglaWords('১২৩')).toBe('একশত তেইশ');
    expect(banglaWords('  42 ')).toBe('বিয়াল্লিশ');
  });

  it('expands exponent notation', () => {
    expect(banglaWords(1e21)).toBe(banglaWords('1000000000000000000000'));
    expect(banglaWords('1.5e3')).toBe('এক হাজার পাঁচশত');
    expect(banglaWords('25e-1')).toBe('দুই দশমিক পাঁচ');
  });

  it('reads 70 lakh crore', () => {
    expect(banglaWords(70000000000000n)).toBe('সত্তর লক্ষ কোটি');
  });
});

describe('banglaWords: options', () => {
  it('uses লাখ when requested', () => {
    expect(banglaWords(100000, { lakh: 'লাখ' })).toBe('এক লাখ');
    expect(banglaWords(2550000, { lakh: 'লাখ' })).toBe('পঁচিশ লাখ পঞ্চাশ হাজার');
  });
  it('uses the short hundred form when requested', () => {
    expect(banglaWords(250, { hundred: 'শ' })).toBe('দুইশ পঞ্চাশ');
    expect(banglaWords(100, { hundred: 'শ' })).toBe('একশ');
  });
  it('supports custom negative and decimal words', () => {
    expect(banglaWords(-3, { negativeWord: 'মাইনাস' })).toBe('মাইনাস তিন');
    expect(banglaWords(1.5, { decimalWord: 'পয়েন্ট' })).toBe('এক পয়েন্ট পাঁচ');
  });
});

describe('banglaWords: decimals and negatives', () => {
  it.each([
    [3.14, 'তিন দশমিক এক চার'],
    [0.5, 'শূন্য দশমিক পাঁচ'],
    ['0.05', 'শূন্য দশমিক শূন্য পাঁচ'],
    ['10.50', 'দশ দশমিক পাঁচ শূন্য'],
    [1250.75, 'এক হাজার দুইশত পঞ্চাশ দশমিক সাত পাঁচ'],
    [-5, 'ঋণাত্মক পাঁচ'],
    [-0.5, 'ঋণাত্মক শূন্য দশমিক পাঁচ'],
    [-100000, 'ঋণাত্মক এক লক্ষ'],
    ['-০', 'শূন্য'],
    [-0, 'শূন্য'],
    ['.5', 'শূন্য দশমিক পাঁচ'],
    ['৩.১৪', 'তিন দশমিক এক চার'],
  ])('banglaWords(%s)', (n, expected) => {
    expect(banglaWords(n)).toBe(expected);
  });
});

describe('banglaWords: errors', () => {
  it.each([[NaN], [Infinity], ['abc'], [''], ['1.2.3'], ['--1']])('rejects %s', (v) => {
    expect(() => banglaWords(v as number)).toThrow();
  });
});

describe('banglaWords: tables and properties', () => {
  it('has 100 distinct names', () => {
    expect(BN_NAMES).toHaveLength(100);
    expect(new Set(BN_NAMES).size).toBe(100);
  });

  it('property: every non-negative integer yields non-empty Bangla output', () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 0n, max: 10n ** 30n }), (n) => {
        const w = banglaWords(n);
        expect(w.length).toBeGreaterThan(0);
        expect(w).not.toMatch(/[0-9]/);
        expect(w).not.toMatch(/\s{2,}/);
        expect(w).toBe(w.trim());
      }),
    );
  });

  it('property: negatives are the positive words with a prefix', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 2_000_000_000 }), (n) => {
        expect(banglaWords(-n)).toBe('ঋণাত্মক ' + banglaWords(n));
      }),
    );
  });

  it('property: number and string inputs agree', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }), (n) => {
        expect(banglaWords(n)).toBe(banglaWords(String(n)));
        expect(banglaWords(n)).toBe(banglaWords(BigInt(n)));
      }),
    );
  });
});
