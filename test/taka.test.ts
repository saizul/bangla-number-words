import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { takaWords, takaWordsBn, takaWordsEn } from '../src';

describe('takaWordsBn', () => {
  it.each([
    [1250.5, 'এক হাজার দুইশত পঞ্চাশ টাকা পঞ্চাশ পয়সা মাত্র'],
    [0, 'শূন্য টাকা মাত্র'],
    [1, 'এক টাকা মাত্র'],
    [100, 'একশত টাকা মাত্র'],
    [0.25, 'পঁচিশ পয়সা মাত্র'],
    [0.01, 'এক পয়সা মাত্র'],
    ['1,250'.replace(',', ''), 'এক হাজার দুইশত পঞ্চাশ টাকা মাত্র'],
    [100000, 'এক লক্ষ টাকা মাত্র'],
    [12345678.99, 'এক কোটি তেইশ লক্ষ পঁয়তাল্লিশ হাজার ছয়শত আটাত্তর টাকা নিরানব্বই পয়সা মাত্র'],
    [10.999, 'এগারো টাকা মাত্র'],
    [10.994, 'দশ টাকা নিরানব্বই পয়সা মাত্র'],
    [0.999, 'এক টাকা মাত্র'],
    [0.1 + 0.2, 'ত্রিশ পয়সা মাত্র'],
    ['৫০০.৫০', 'পাঁচশত টাকা পঞ্চাশ পয়সা মাত্র'],
    [-250, 'ঋণাত্মক দুইশত পঞ্চাশ টাকা মাত্র'],
    [-0.001, 'শূন্য টাকা মাত্র'],
    [1234n, 'এক হাজার দুইশত চৌত্রিশ টাকা মাত্র'],
  ])('takaWordsBn(%s)', (amount, expected) => {
    expect(takaWordsBn(amount)).toBe(expected);
  });

  it('is configurable', () => {
    expect(takaWordsBn(1250.5, { lakh: 'লাখ', hundred: 'শ' })).toBe('এক হাজার দুইশ পঞ্চাশ টাকা পঞ্চাশ পয়সা মাত্র');
    expect(takaWordsBn(5, { suffix: '' })).toBe('পাঁচ টাকা');
    expect(takaWordsBn(5, { suffix: 'শুধু' })).toBe('পাঁচ টাকা শুধু');
    expect(takaWordsBn(5.5, { majorUnit: 'রুপি', minorUnit: 'পয়সা' })).toBe('পাঁচ রুপি পঞ্চাশ পয়সা মাত্র');
    expect(takaWordsBn(5, { showZeroMinor: true })).toBe('পাঁচ টাকা শূন্য পয়সা মাত্র');
    expect(takaWordsBn(200000, { lakh: 'লাখ' })).toBe('দুই লাখ টাকা মাত্র');
  });
});

describe('takaWordsEn', () => {
  it.each([
    [1250.5, 'One Thousand Two Hundred Fifty Taka and Fifty Paisa Only'],
    [0, 'Zero Taka Only'],
    [1, 'One Taka Only'],
    [0.5, 'Fifty Paisa Only'],
    [100, 'One Hundred Taka Only'],
    [100000, 'One Lakh Taka Only'],
    [12345678.99, 'One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight Taka and Ninety Nine Paisa Only'],
    [-250, 'Minus Two Hundred Fifty Taka Only'],
    [2.675, 'Two Taka and Sixty Eight Paisa Only'],
    ['৭৫০', 'Seven Hundred Fifty Taka Only'],
  ])('takaWordsEn(%s)', (amount, expected) => {
    expect(takaWordsEn(amount)).toBe(expected);
  });

  it('is configurable', () => {
    expect(takaWordsEn(1250000, { system: 'international' })).toBe('One Million Two Hundred Fifty Thousand Taka Only');
    expect(takaWordsEn(1250.5, { case: 'lower' })).toBe('one thousand two hundred fifty taka and fifty paisa only');
    expect(takaWordsEn(1250.5, { case: 'upper' })).toBe('ONE THOUSAND TWO HUNDRED FIFTY TAKA AND FIFTY PAISA ONLY');
    expect(takaWordsEn(99.5, { majorUnit: 'BDT', minorUnit: 'Poisha', suffix: 'Net' })).toBe('Ninety Nine BDT and Fifty Poisha Net');
    expect(takaWordsEn(5, { suffix: '' })).toBe('Five Taka');
    expect(takaWordsEn(5, { showZeroMinor: true })).toBe('Five Taka and Zero Paisa Only');
    expect(takaWordsEn(105, { useAnd: true })).toBe('One Hundred and Five Taka Only');
  });
});

describe('takaWords', () => {
  it('defaults to Bangla and can switch to English', () => {
    expect(takaWords(10)).toBe('দশ টাকা মাত্র');
    expect(takaWords(10, { lang: 'en' })).toBe('Ten Taka Only');
  });

  it('property: always ends with the suffix and has no digits', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000_000 }), fc.integer({ min: 0, max: 99 }), (t, p) => {
        const amount = `${t}.${String(p).padStart(2, '0')}`;
        expect(takaWordsBn(amount).endsWith(' মাত্র')).toBe(true);
        expect(takaWordsEn(amount).endsWith(' Only')).toBe(true);
        expect(takaWordsBn(amount)).not.toMatch(/\d/);
      }),
    );
  });
});
