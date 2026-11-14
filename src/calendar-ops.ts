import {
  BANGLA_MONTHS,
  BANGLA_MONTHS_EN,
  BANGLA_WEEKDAYS,
  banglaMonthLength,
  banglaToGregorian,
  civilFromDays,
  daysFromCivil,
  gregorianToBangla,
  weekdayOf,
} from './calendar';
import type { YMD } from './calendar';
import { toEnglishDigits } from './digits';
import { englishOrdinalSuffix } from './ordinal';

/** Day number (days since 1970-01-01) of a validated Bangla date. */
function banglaDayNumber(bn: YMD): number {
  const g = banglaToGregorian(bn);
  return daysFromCivil(g.year, g.month, g.day);
}

function banglaFromDayNumber(days: number): YMD {
  const b = gregorianToBangla(civilFromDays(days));
  return { year: b.year, month: b.month, day: b.day };
}

function assertInteger(n: number, name: string): void {
  if (!Number.isSafeInteger(n)) throw new TypeError(`${name} must be a safe integer`);
}

/**
 * Add (or subtract, with a negative `days`) a number of days to a Bangla date.
 *
 * @example addBanglaDays({ year: 1430, month: 12, day: 30 }, 1) // { year: 1431, month: 1, day: 1 }
 */
export function addBanglaDays(bn: YMD, days: number): YMD {
  assertInteger(days, 'days');
  return banglaFromDayNumber(banglaDayNumber(bn) + days);
}

/**
 * Add calendar months to a Bangla date. When the target month is shorter the
 * day is clamped to its last day (31 Ashwin + 1 month = 30 Kartik).
 */
export function addBanglaMonths(bn: YMD, months: number): YMD {
  assertInteger(months, 'months');
  banglaToGregorian(bn);
  const index = bn.year * 12 + (bn.month - 1) + months;
  const year = Math.floor(index / 12);
  const month = index - year * 12 + 1;
  const day = Math.min(bn.day, banglaMonthLength(year, month));
  banglaToGregorian({ year, month, day });
  return { year, month, day };
}

/** Add Bangla years; 30 Falgun of a leap year becomes 29 Falgun in a common year. */
export function addBanglaYears(bn: YMD, years: number): YMD {
  assertInteger(years, 'years');
  return addBanglaMonths(bn, years * 12);
}

/** Signed number of days from `from` to `to` (positive when `to` is later). */
export function banglaDaysBetween(from: YMD, to: YMD): number {
  return banglaDayNumber(to) - banglaDayNumber(from);
}

/** Compare two Bangla dates: -1 when `a` is earlier, 1 when later, 0 when equal. */
export function compareBanglaDates(a: YMD, b: YMD): -1 | 0 | 1 {
  const diff = banglaDaysBetween(b, a);
  return diff < 0 ? -1 : diff > 0 ? 1 : 0;
}

export interface BanglaCalendarDay {
  /** Day of the Bangla month, 1-31. */
  day: number;
  /** 0 = Sunday ... 6 = Saturday */
  weekday: number;
  /** The same day in the Gregorian calendar. */
  gregorian: YMD;
}

export interface BanglaMonthCalendar {
  year: number;
  month: number;
  monthName: string;
  monthNameEn: string;
  daysInMonth: number;
  /** First weekday of each row (0 = Sunday ... 6 = Saturday). */
  weekStart: number;
  /** Rows of seven cells; cells outside the month are `null`. */
  weeks: (BanglaCalendarDay | null)[][];
}

export interface BanglaMonthCalendarOptions {
  /** First column of the grid, 0 = Sunday ... 6 = Saturday. Default 0. */
  weekStart?: number;
}

/**
 * Build a month grid for a Bangla month, ready to render as a wall calendar.
 *
 * @example banglaMonthCalendar(1431, 1, { weekStart: 6 }).weeks[0]
 */
export function banglaMonthCalendar(
  year: number,
  month: number,
  options: BanglaMonthCalendarOptions = {},
): BanglaMonthCalendar {
  const weekStart = options.weekStart ?? 0;
  if (!Number.isInteger(weekStart) || weekStart < 0 || weekStart > 6) {
    throw new RangeError('weekStart must be 0-6');
  }
  const first = banglaDayNumber({ year, month, day: 1 });
  const daysInMonth = banglaMonthLength(year, month);
  const lead = (weekdayOf(first) - weekStart + 7) % 7;
  const cells: (BanglaCalendarDay | null)[] = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    const n = first + day - 1;
    cells.push({ day, weekday: weekdayOf(n), gregorian: civilFromDays(n) });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (BanglaCalendarDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return {
    year,
    month,
    monthName: BANGLA_MONTHS[month - 1] as string,
    monthNameEn: BANGLA_MONTHS_EN[month - 1] as string,
    daysInMonth,
    weekStart,
    weeks,
  };
}

const MONTH_ALIASES: readonly (readonly string[])[] = [
  ['বৈশাখ', 'boishakh', 'baishakh', 'boisakh', 'baisakh', 'boishak'],
  ['জ্যৈষ্ঠ', 'জৈষ্ঠ', 'জৈষ্ঠ্য', 'জ্যৈষ্ঠ্য', 'joishtho', 'jyoishtho', 'jaishtha', 'jyaistha', 'jyoishto', 'joishto'],
  ['আষাঢ়', 'আষাড়', 'asharh', 'ashar', 'asar', 'ashadh', 'asadh'],
  ['শ্রাবণ', 'srabon', 'shrabon', 'shraban', 'sraban'],
  ['ভাদ্র', 'bhadro', 'bhadra', 'vadro'],
  ['আশ্বিন', 'ashwin', 'ashshin', 'aswin', 'ashvin', 'ashin'],
  ['কার্তিক', 'kartik', 'karthik', 'kartick'],
  ['অগ্রহায়ণ', 'অঘ্রাণ', 'অগ্রহায়ন', 'agrahayan', 'ogrohayon', 'agrahayon', 'aghrayan', 'ograhayan'],
  ['পৌষ', 'poush', 'pous', 'paush', 'push'],
  ['মাঘ', 'magh'],
  ['ফাল্গুন', 'ফাগুন', 'falgun', 'phalgun', 'falgoon'],
  ['চৈত্র', 'choitro', 'chaitra', 'choitra', 'chaitro', 'chaitr'],
];

const WEEKDAY_ALIASES: readonly (readonly string[])[] = [
  ['রবিবার', 'রোববার', 'রবি', 'sunday', 'sun'],
  ['সোমবার', 'সোম', 'monday', 'mon'],
  ['মঙ্গলবার', 'মঙ্গল', 'tuesday', 'tue', 'tues'],
  ['বুধবার', 'বুধ', 'wednesday', 'wed'],
  ['বৃহস্পতিবার', 'বৃহস্পতি', 'thursday', 'thu', 'thur', 'thurs'],
  ['শুক্রবার', 'শুক্র', 'friday', 'fri'],
  ['শনিবার', 'শনি', 'saturday', 'sat'],
];

function buildLookup(table: readonly (readonly string[])[]): Map<string, number> {
  const map = new Map<string, number>();
  table.forEach((names, i) => {
    for (const name of names) map.set(name.normalize('NFC'), i);
  });
  return map;
}

const MONTH_LOOKUP = buildLookup(MONTH_ALIASES);
const WEEKDAY_LOOKUP = buildLookup(WEEKDAY_ALIASES);

/** Bangla day suffix written by `banglaDayOrdinal` (১লা, ২রা, ৪ঠা, ৫ই, ১৯শে). */
function banglaDaySuffix(day: number): string {
  return day === 1 ? 'লা' : day === 2 || day === 3 ? 'রা' : day === 4 ? 'ঠা' : day <= 18 ? 'ই' : 'শে';
}

const ERA_SUFFIX = /\s*(?:বঙ্গাব্দ|বঙ্গাব্দে|সন|সাল|b\.?\s?s\.?|bangabda|bongabdo)$/u;
const DATE_PATTERN =
  /^(?:(\S+?)\s*[,،]?\s+)?(\d{1,2})(লা|রা|ঠা|ই|শে|st|nd|rd|th)?\s*[,.\-/\s]\s*(\S+?)\s*[,.\-/\s]\s*(\d{1,4})$/u;
const NUMERIC_PATTERN = /^(\d{1,4})[-/.](\d{1,2})[-/.](\d{1,2})$/;

export interface ParseBanglaDateOptions {
  /**
   * When the text names a weekday, throw if it does not match the date.
   * Default true.
   */
  checkWeekday?: boolean;
}

/**
 * Parse a Bangla calendar date written in Bangla or English back into
 * `{ year, month, day }`. Accepts the output of `formatBanglaDate` and common
 * hand-written variants:
 *
 * - `"১লা বৈশাখ ১৪৩১"`, `"রবিবার, ১ বৈশাখ ১৪৩১ (গ্রীষ্ম)"`, `"১ বৈশাখ ১৪৩১ বঙ্গাব্দ"`
 * - `"1 Boishakh 1431"`, `"1st Baishakh, 1431 BS"`, `"Sunday, 14 Poush 1431"`
 * - numeric year-month-day: `"1431-01-01"`, `"১৪৩১/৯/১"`
 *
 * Throws `TypeError` for text it cannot read and `RangeError` for dates that
 * do not exist (32 Boishakh, 30 Falgun in a common year), a day suffix that
 * does not fit the day (২লা) or a weekday that does not match.
 */
export function parseBanglaDate(text: string, options: ParseBanglaDateOptions = {}): YMD {
  if (typeof text !== 'string') throw new TypeError('Expected a string');
  let s = toEnglishDigits(text.normalize('NFC')).trim().replace(/\s+/g, ' ').toLowerCase();
  s = s.replace(/\s*\([^)]*\)$/u, '').replace(ERA_SUFFIX, '').trim();
  if (s === '') throw new TypeError('Expected a Bangla date, got an empty string');

  const numeric = NUMERIC_PATTERN.exec(s);
  if (numeric) {
    const ymd = { year: Number(numeric[1]), month: Number(numeric[2]), day: Number(numeric[3]) };
    if (ymd.month < 1 || ymd.month > 12) throw new RangeError(`Month must be 1-12, got ${ymd.month}`);
    banglaToGregorian(ymd);
    return ymd;
  }

  const m = DATE_PATTERN.exec(s);
  if (!m) throw new TypeError(`Unrecognised Bangla date: ${text}`);
  const [, weekdayText, dayText, suffix, monthText, yearText] = m;
  const monthIndex = MONTH_LOOKUP.get(monthText as string);
  if (monthIndex === undefined) throw new TypeError(`Unknown Bangla month: ${monthText}`);
  const ymd = { year: Number(yearText), month: monthIndex + 1, day: Number(dayText) };

  if (suffix) {
    const expected = /^[a-z]/.test(suffix) ? englishOrdinalSuffix(ymd.day) : banglaDaySuffix(ymd.day);
    if (suffix !== expected) {
      throw new RangeError(`Suffix "${suffix}" does not fit day ${ymd.day} (expected "${expected}")`);
    }
  }

  const days = banglaDayNumber(ymd);

  if (weekdayText !== undefined) {
    const weekday = WEEKDAY_LOOKUP.get(weekdayText);
    if (weekday === undefined) throw new TypeError(`Unknown weekday: ${weekdayText}`);
    if (options.checkWeekday !== false && weekday !== weekdayOf(days)) {
      const actual = BANGLA_WEEKDAYS[weekdayOf(days)] as string;
      throw new RangeError(`Weekday mismatch: ${text.trim()} falls on ${actual}, not ${weekdayText}`);
    }
  }
  return ymd;
}

/** Like `parseBanglaDate` but returns `null` instead of throwing. */
export function tryParseBanglaDate(text: string, options: ParseBanglaDateOptions = {}): YMD | null {
  try {
    return parseBanglaDate(text, options);
  } catch {
    return null;
  }
}
