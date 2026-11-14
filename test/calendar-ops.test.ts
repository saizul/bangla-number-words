import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  addBanglaDays,
  addBanglaMonths,
  addBanglaYears,
  banglaDaysBetween,
  banglaMonthCalendar,
  banglaMonthLength,
  banglaToGregorian,
  compareBanglaDates,
  formatBanglaDate,
  parseBanglaDate,
  tryParseBanglaDate,
} from '../src';

const banglaDate = fc
  .record({
    year: fc.integer({ min: 1300, max: 1600 }),
    month: fc.integer({ min: 1, max: 12 }),
    day: fc.integer({ min: 1, max: 31 }),
  })
  .map(({ year, month, day }) => ({ year, month, day: Math.min(day, banglaMonthLength(year, month)) }));

const iso = ({ year, month, day }: { year: number; month: number; day: number }): string =>
  `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

describe('addBanglaDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addBanglaDays({ year: 1430, month: 12, day: 30 }, 1)).toEqual({ year: 1431, month: 1, day: 1 });
    expect(addBanglaDays({ year: 1431, month: 1, day: 31 }, 1)).toEqual({ year: 1431, month: 2, day: 1 });
    expect(addBanglaDays({ year: 1431, month: 1, day: 1 }, -1)).toEqual({ year: 1430, month: 12, day: 30 });
    expect(addBanglaDays({ year: 1431, month: 1, day: 1 }, 0)).toEqual({ year: 1431, month: 1, day: 1 });
  });

  it('handles 30 Falgun in a leap year', () => {
    // Falgun 1430 falls in Feb-Mar 2024, a leap year.
    expect(addBanglaDays({ year: 1430, month: 11, day: 29 }, 1)).toEqual({ year: 1430, month: 11, day: 30 });
    expect(addBanglaDays({ year: 1431, month: 11, day: 29 }, 1)).toEqual({ year: 1431, month: 12, day: 1 });
  });

  it('rejects invalid input', () => {
    expect(() => addBanglaDays({ year: 1431, month: 1, day: 32 }, 1)).toThrow(RangeError);
    expect(() => addBanglaDays({ year: 1431, month: 1, day: 1 }, 1.5)).toThrow(TypeError);
  });

  it('round-trips with banglaDaysBetween (property)', () => {
    fc.assert(
      fc.property(banglaDate, fc.integer({ min: -20000, max: 20000 }), (d, n) => {
        const moved = addBanglaDays(d, n);
        expect(banglaDaysBetween(d, moved)).toBe(n);
        expect(addBanglaDays(moved, -n)).toEqual(d);
      }),
    );
  });
});

describe('addBanglaMonths / addBanglaYears', () => {
  it('clamps to the end of shorter months', () => {
    expect(addBanglaMonths({ year: 1431, month: 6, day: 31 }, 1)).toEqual({ year: 1431, month: 7, day: 30 });
    expect(addBanglaMonths({ year: 1431, month: 10, day: 30 }, 1)).toEqual({ year: 1431, month: 11, day: 29 });
    expect(addBanglaMonths({ year: 1430, month: 10, day: 30 }, 1)).toEqual({ year: 1430, month: 11, day: 30 });
  });

  it('wraps years in both directions', () => {
    expect(addBanglaMonths({ year: 1431, month: 12, day: 15 }, 1)).toEqual({ year: 1432, month: 1, day: 15 });
    expect(addBanglaMonths({ year: 1431, month: 1, day: 15 }, -1)).toEqual({ year: 1430, month: 12, day: 15 });
    expect(addBanglaMonths({ year: 1431, month: 3, day: 5 }, -27)).toEqual({ year: 1428, month: 12, day: 5 });
  });

  it('adds years and clamps 30 Falgun', () => {
    expect(addBanglaYears({ year: 1430, month: 11, day: 30 }, 1)).toEqual({ year: 1431, month: 11, day: 29 });
    expect(addBanglaYears({ year: 1431, month: 1, day: 1 }, -10)).toEqual({ year: 1421, month: 1, day: 1 });
  });

  it('always produces a valid date (property)', () => {
    fc.assert(
      fc.property(banglaDate, fc.integer({ min: -600, max: 600 }), (d, n) => {
        const r = addBanglaMonths(d, n);
        expect(() => banglaToGregorian(r)).not.toThrow();
        expect((r.year * 12 + r.month) - (d.year * 12 + d.month)).toBe(n);
      }),
    );
  });
});

describe('banglaDaysBetween / compareBanglaDates', () => {
  it('counts the days in a Bangla year', () => {
    expect(banglaDaysBetween({ year: 1430, month: 1, day: 1 }, { year: 1431, month: 1, day: 1 })).toBe(366);
    expect(banglaDaysBetween({ year: 1431, month: 1, day: 1 }, { year: 1432, month: 1, day: 1 })).toBe(365);
    expect(banglaDaysBetween({ year: 1432, month: 1, day: 1 }, { year: 1431, month: 1, day: 1 })).toBe(-365);
  });

  it('compares dates', () => {
    const a = { year: 1431, month: 1, day: 1 };
    const b = { year: 1431, month: 9, day: 1 };
    expect(compareBanglaDates(a, b)).toBe(-1);
    expect(compareBanglaDates(b, a)).toBe(1);
    expect(compareBanglaDates(a, { ...a })).toBe(0);
  });
});

describe('banglaMonthCalendar', () => {
  it('lays out Boishakh 1431 starting on Sunday', () => {
    const cal = banglaMonthCalendar(1431, 1);
    expect(cal.monthName).toBe('বৈশাখ');
    expect(cal.monthNameEn).toBe('Boishakh');
    expect(cal.daysInMonth).toBe(31);
    // 14 April 2024 was a Sunday, so 1 Boishakh is the first cell.
    expect(cal.weeks[0]?.[0]).toEqual({ day: 1, weekday: 0, gregorian: { year: 2024, month: 4, day: 14 } });
    expect(cal.weeks).toHaveLength(5);
    expect(cal.weeks.every((w) => w.length === 7)).toBe(true);
  });

  it('honours weekStart (Saturday-first grids)', () => {
    const cal = banglaMonthCalendar(1431, 1, { weekStart: 6 });
    expect(cal.weekStart).toBe(6);
    expect(cal.weeks[0]?.[0]).toBeNull();
    expect(cal.weeks[0]?.[1]?.day).toBe(1);
  });

  it('contains every day exactly once in weekday order (property)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1300, max: 1600 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 0, max: 6 }),
        (year, month, weekStart) => {
          const cal = banglaMonthCalendar(year, month, { weekStart });
          const days = cal.weeks.flat().filter((c) => c !== null);
          expect(days.map((d) => d.day)).toEqual(Array.from({ length: cal.daysInMonth }, (_, i) => i + 1));
          cal.weeks.forEach((week) =>
            week.forEach((cell, col) => {
              if (cell) expect(cell.weekday).toBe((weekStart + col) % 7);
            }),
          );
          expect(days[0]?.gregorian).toEqual(banglaToGregorian({ year, month, day: 1 }));
        },
      ),
    );
  });

  it('rejects a bad weekStart or month', () => {
    expect(() => banglaMonthCalendar(1431, 1, { weekStart: 7 })).toThrow(RangeError);
    expect(() => banglaMonthCalendar(1431, 13)).toThrow(RangeError);
  });
});

describe('parseBanglaDate', () => {
  it.each([
    ['১ বৈশাখ ১৪৩১', { year: 1431, month: 1, day: 1 }],
    ['১লা বৈশাখ ১৪৩১', { year: 1431, month: 1, day: 1 }],
    ['রবিবার, ১ বৈশাখ ১৪৩১', { year: 1431, month: 1, day: 1 }],
    ['রবিবার, ১লা বৈশাখ ১৪৩১ (গ্রীষ্ম)', { year: 1431, month: 1, day: 1 }],
    ['১ পৌষ ১৪৩১ বঙ্গাব্দ', { year: 1431, month: 9, day: 1 }],
    ['২১শে ফাল্গুন ১৪৩০', { year: 1430, month: 11, day: 21 }],
    ['৪ঠা জৈষ্ঠ্য ১৪৩১', { year: 1431, month: 2, day: 4 }],
    ['1 Boishakh 1431', { year: 1431, month: 1, day: 1 }],
    ['1st Baishakh, 1431 BS', { year: 1431, month: 1, day: 1 }],
    ['  22nd   Chaitra  1430 ', { year: 1430, month: 12, day: 22 }],
    ['Monday, 1 Poush 1431', { year: 1431, month: 9, day: 1 }],
    ['13 asharh 1431', { year: 1431, month: 3, day: 13 }],
    ['1431-01-01', { year: 1431, month: 1, day: 1 }],
    ['১৪৩১/৯/১', { year: 1431, month: 9, day: 1 }],
  ])('parses %s', (text, expected) => {
    expect(parseBanglaDate(text)).toEqual(expected);
  });

  it('accepts decomposed and precomposed nukta letters', () => {
    const decomposed = '১ আষাঢ় ১৪৩১'.normalize('NFD');
    expect(parseBanglaDate(decomposed)).toEqual({ year: 1431, month: 3, day: 1 });
  });

  it('round-trips formatBanglaDate output (property)', () => {
    fc.assert(
      fc.property(banglaDate, fc.boolean(), fc.boolean(), fc.boolean(), fc.boolean(), (d, wd, ord, season, en) => {
        const text = formatBanglaDate(iso(banglaToGregorian(d)), {
          weekday: wd,
          ordinalDay: ord,
          season,
          digits: en ? 'en' : 'bn',
        });
        expect(parseBanglaDate(text)).toEqual(d);
      }),
    );
  });

  it('rejects dates that do not exist', () => {
    expect(() => parseBanglaDate('৩২ বৈশাখ ১৪৩১')).toThrow(RangeError);
    expect(() => parseBanglaDate('30 Falgun 1431')).toThrow(RangeError);
    expect(() => parseBanglaDate('1431-13-01')).toThrow(RangeError);
  });

  it('rejects a mismatched suffix or weekday', () => {
    expect(() => parseBanglaDate('২লা বৈশাখ ১৪৩১')).toThrow(RangeError);
    expect(() => parseBanglaDate('2st Boishakh 1431')).toThrow(RangeError);
    expect(() => parseBanglaDate('সোমবার, ১ বৈশাখ ১৪৩১')).toThrow(/রবিবার/);
    expect(parseBanglaDate('সোমবার, ১ বৈশাখ ১৪৩১', { checkWeekday: false })).toEqual({ year: 1431, month: 1, day: 1 });
  });

  it('rejects unreadable text', () => {
    expect(() => parseBanglaDate('')).toThrow(TypeError);
    expect(() => parseBanglaDate('১ জানুয়ারি ১৪৩১')).toThrow(/Unknown Bangla month/);
    expect(() => parseBanglaDate('someday, 1 Boishakh 1431')).toThrow(/Unknown weekday/);
    expect(() => parseBanglaDate('hello')).toThrow(TypeError);
    expect(() => parseBanglaDate(42 as unknown as string)).toThrow(TypeError);
  });

  it('tryParseBanglaDate returns null instead of throwing', () => {
    expect(tryParseBanglaDate('১ বৈশাখ ১৪৩১')).toEqual({ year: 1431, month: 1, day: 1 });
    expect(tryParseBanglaDate('৩২ বৈশাখ ১৪৩১')).toBeNull();
    expect(tryParseBanglaDate('nonsense')).toBeNull();
  });
});
