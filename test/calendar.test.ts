import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  banglaMonthLength,
  banglaToDate,
  banglaToGregorian,
  formatBanglaDate,
  gregorianToBangla,
  isBanglaLeapYear,
  isPohelaBoishakh,
} from '../src';

type Case = [string, number, number, number];

describe('gregorianToBangla: reference dates', () => {
  const cases: Case[] = [
    ['2024-04-14', 1431, 1, 1],
    ['2024-04-13', 1430, 12, 30],
    ['2023-04-14', 1430, 1, 1],
    ['2023-04-13', 1429, 12, 30],
    ['2025-04-14', 1432, 1, 1],
    ['2000-04-14', 1407, 1, 1],
    ['2024-05-14', 1431, 1, 31],
    ['2024-05-15', 1431, 2, 1],
    ['2024-06-15', 1431, 3, 1],
    ['2024-07-16', 1431, 4, 1],
    ['2024-08-16', 1431, 5, 1],
    ['2024-09-16', 1431, 6, 1],
    ['2024-10-16', 1431, 6, 31],
    ['2024-10-17', 1431, 7, 1],
    ['2024-11-16', 1431, 8, 1],
    ['2024-12-16', 1431, 9, 1],
    ['1971-12-16', 1378, 9, 1],
    ['2025-01-15', 1431, 10, 1],
    ['2025-02-14', 1431, 11, 1],
    ['2025-03-14', 1431, 11, 29],
    ['2025-03-15', 1431, 12, 1],
    ['2025-04-13', 1431, 12, 30],
    ['2024-02-14', 1430, 11, 1],
    ['2024-02-29', 1430, 11, 16],
    ['2024-03-14', 1430, 11, 30],
    ['2024-03-15', 1430, 12, 1],
    ['2021-03-26', 1427, 12, 12],
    ['1970-01-01', 1376, 9, 17],
    ['2000-01-01', 1406, 9, 17],
  ];
  it.each(cases)('%s = %i-%i-%i', (iso, y, m, d) => {
    const b = gregorianToBangla(iso);
    expect([b.year, b.month, b.day]).toEqual([y, m, d]);
  });
});

describe('gregorianToBangla: names and weekdays', () => {
  it('names the first day of the year', () => {
    const b = gregorianToBangla('2024-04-14');
    expect(b.monthName).toBe('বৈশাখ');
    expect(b.monthNameEn).toBe('Boishakh');
    expect(b.weekday).toBe(0);
    expect(b.weekdayName).toBe('রবিবার');
    expect(b.weekdayNameEn).toBe('Sunday');
    expect(b.season).toBe('গ্রীষ্ম');
  });

  it.each([
    ['1970-01-01', 'বৃহস্পতিবার'],
    ['1971-12-16', 'বৃহস্পতিবার'],
    ['2000-01-01', 'শনিবার'],
    ['2024-12-16', 'সোমবার'],
    ['2024-02-21', 'বুধবার'],
    ['2021-03-26', 'শুক্রবার'],
    ['2024-04-15', 'সোমবার'],
    ['2024-04-16', 'মঙ্গলবার'],
  ])('weekday of %s is %s', (iso, name) => {
    expect(gregorianToBangla(iso).weekdayName).toBe(name);
  });

  it.each([
    ['2024-04-14', 'গ্রীষ্ম'],
    ['2024-06-15', 'বর্ষা'],
    ['2024-07-16', 'বর্ষা'],
    ['2024-08-16', 'শরৎ'],
    ['2024-09-16', 'শরৎ'],
    ['2024-11-16', 'হেমন্ত'],
    ['2025-01-15', 'শীত'],
    ['2025-03-15', 'বসন্ত'],
  ])('season of %s is %s', (iso, season) => {
    expect(gregorianToBangla(iso).season).toBe(season);
  });

  it('accepts Date objects (local time) and plain objects', () => {
    expect(gregorianToBangla(new Date(2024, 3, 14)).day).toBe(1);
    expect(gregorianToBangla({ year: 2024, month: 4, day: 14 }).year).toBe(1431);
    expect(gregorianToBangla('2024-04-14T10:00:00Z').month).toBe(1);
  });

  it('rejects invalid input', () => {
    expect(() => gregorianToBangla('2024-02-30')).toThrow(RangeError);
    expect(() => gregorianToBangla('2023-02-29')).toThrow(RangeError);
    expect(() => gregorianToBangla('hello')).toThrow(TypeError);
    expect(() => gregorianToBangla(new Date(NaN))).toThrow(RangeError);
    expect(() => gregorianToBangla({ year: 2024, month: 13, day: 1 })).toThrow(RangeError);
    expect(() => gregorianToBangla({ year: 2024.5, month: 1, day: 1 })).toThrow(TypeError);
  });
});

describe('month lengths and leap years', () => {
  it('first six months have 31 days', () => {
    for (let m = 1; m <= 6; m++) expect(banglaMonthLength(1431, m)).toBe(31);
  });
  it('Kartik, Agrahayan, Poush, Magh and Choitro have 30 days', () => {
    for (const m of [7, 8, 9, 10, 12]) expect(banglaMonthLength(1431, m)).toBe(30);
  });
  it('Falgun has 29 days, 30 in leap years', () => {
    expect(banglaMonthLength(1431, 11)).toBe(29);
    expect(banglaMonthLength(1430, 11)).toBe(30);
    expect(isBanglaLeapYear(1430)).toBe(true);
    expect(isBanglaLeapYear(1431)).toBe(false);
    expect(isBanglaLeapYear(1426)).toBe(true);
    expect(isBanglaLeapYear(1406)).toBe(true);
    expect(isBanglaLeapYear(1306)).toBe(false);
  });
  it('rejects bad months', () => {
    expect(() => banglaMonthLength(1431, 0)).toThrow(RangeError);
    expect(() => banglaMonthLength(1431, 13)).toThrow(RangeError);
  });
  it('years have 365 or 366 days', () => {
    for (let y = 1400; y < 1440; y++) {
      let total = 0;
      for (let m = 1; m <= 12; m++) total += banglaMonthLength(y, m);
      expect(total).toBe(isBanglaLeapYear(y) ? 366 : 365);
    }
  });
});

describe('banglaToGregorian', () => {
  it.each([
    [1431, 1, 1, 2024, 4, 14],
    [1431, 9, 1, 2024, 12, 16],
    [1430, 11, 30, 2024, 3, 14],
    [1430, 12, 30, 2024, 4, 13],
    [1378, 9, 1, 1971, 12, 16],
    [1432, 1, 1, 2025, 4, 14],
  ])('%i-%i-%i = %i-%i-%i', (y, m, d, gy, gm, gd) => {
    expect(banglaToGregorian({ year: y, month: m, day: d })).toEqual({ year: gy, month: gm, day: gd });
  });

  it('rejects out-of-range days', () => {
    expect(() => banglaToGregorian({ year: 1431, month: 11, day: 30 })).toThrow(RangeError);
    expect(() => banglaToGregorian({ year: 1431, month: 1, day: 32 })).toThrow(RangeError);
    expect(() => banglaToGregorian({ year: 1431, month: 1, day: 0 })).toThrow(RangeError);
    expect(() => banglaToGregorian({ year: 0, month: 1, day: 1 })).toThrow(RangeError);
  });

  it('banglaToDate returns a local-midnight Date', () => {
    const d = banglaToDate({ year: 1431, month: 1, day: 1 });
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2024, 3, 14, 0]);
  });
});

describe('round trips', () => {
  it('property: gregorian -> bangla -> gregorian is the identity', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1600, max: 2600 }), fc.integer({ min: 1, max: 12 }), fc.integer({ min: 1, max: 28 }), (year, month, day) => {
        const b = gregorianToBangla({ year, month, day });
        expect(banglaToGregorian(b)).toEqual({ year, month, day });
      }),
    );
  });

  it('property: bangla -> gregorian -> bangla is the identity', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1000, max: 2000 }), fc.integer({ min: 1, max: 12 }), fc.integer({ min: 1, max: 29 }), (year, month, day) => {
        const g = banglaToGregorian({ year, month, day });
        const b = gregorianToBangla(g);
        expect([b.year, b.month, b.day]).toEqual([year, month, day]);
      }),
    );
  });

  it('property: consecutive days advance the Bangla date by one day', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 40000 }), (offset) => {
        const a = new Date(Date.UTC(1950, 0, 1) + offset * 86400000);
        const b = new Date(a.getTime() + 86400000);
        const x = gregorianToBangla({ year: a.getUTCFullYear(), month: a.getUTCMonth() + 1, day: a.getUTCDate() });
        const y = gregorianToBangla({ year: b.getUTCFullYear(), month: b.getUTCMonth() + 1, day: b.getUTCDate() });
        if (x.day < x.daysInMonth) {
          expect([y.year, y.month, y.day]).toEqual([x.year, x.month, x.day + 1]);
        } else {
          expect(y.day).toBe(1);
          expect(y.month).toBe(x.month === 12 ? 1 : x.month + 1);
          expect(y.year).toBe(x.month === 12 ? x.year + 1 : x.year);
        }
        expect(y.weekday).toBe((x.weekday + 1) % 7);
      }),
    );
  });

  it('property: 1 Boishakh is always 14 April', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1000, max: 2200 }), (year) => {
        const g = banglaToGregorian({ year, month: 1, day: 1 });
        expect([g.month, g.day]).toEqual([4, 14]);
        expect(g.year).toBe(year + 593);
      }),
    );
  });
});

describe('formatBanglaDate', () => {
  it('formats in Bangla digits by default', () => {
    expect(formatBanglaDate('2024-04-14')).toBe('১ বৈশাখ ১৪৩১');
    expect(formatBanglaDate('2024-12-16')).toBe('১ পৌষ ১৪৩১');
  });
  it('supports weekday, ordinal day, season and ASCII digits', () => {
    expect(formatBanglaDate('2024-04-14', { weekday: true })).toBe('রবিবার, ১ বৈশাখ ১৪৩১');
    expect(formatBanglaDate('2024-04-14', { ordinalDay: true })).toBe('১লা বৈশাখ ১৪৩১');
    expect(formatBanglaDate('2024-04-14', { season: true })).toBe('১ বৈশাখ ১৪৩১ (গ্রীষ্ম)');
    expect(formatBanglaDate('2024-04-14', { digits: 'en' })).toBe('1 বৈশাখ 1431');
    expect(formatBanglaDate('2024-04-17', { ordinalDay: true })).toBe('৪ঠা বৈশাখ ১৪৩১');
  });
  it('detects Pohela Boishakh', () => {
    expect(isPohelaBoishakh('2024-04-14')).toBe(true);
    expect(isPohelaBoishakh('2024-04-15')).toBe(false);
    expect(isPohelaBoishakh('2024-04-13')).toBe(false);
  });
});
