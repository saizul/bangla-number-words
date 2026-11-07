import { toBanglaDigits } from './digits';
import { banglaDayOrdinal } from './ordinal';

/**
 * Revised Bangladesh calendar (Bangabda).
 *
 * - The year starts on 14 April (1 Boishakh) every year.
 * - Boishakh to Ashwin (the first six months) have 31 days.
 * - Kartik, Agrahayan, Poush, Magh and Choitro have 30 days.
 * - Falgun has 29 days, or 30 days in a leap year.
 * - A Bangla year B is a leap year when the Gregorian year B + 594 is a leap
 *   year (that is the year in which its Falgun falls).
 * - Bangla year = Gregorian year - 593 from 14 April onward.
 */
export const BANGLA_MONTHS = [
  'বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন',
  'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র',
] as const;

export const BANGLA_MONTHS_EN = [
  'Boishakh', 'Joishtho', 'Asharh', 'Srabon', 'Bhadro', 'Ashwin',
  'Kartik', 'Agrahayan', 'Poush', 'Magh', 'Falgun', 'Choitro',
] as const;

export const BANGLA_WEEKDAYS = [
  'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার',
] as const;

export const BANGLA_WEEKDAYS_EN = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;

/** The six Bangla seasons (ঋতু), two months each starting at Boishakh. */
export const BANGLA_SEASONS = ['গ্রীষ্ম', 'বর্ষা', 'শরৎ', 'হেমন্ত', 'শীত', 'বসন্ত'] as const;

/** Offset between a Bangla year and the Gregorian year in which it begins. */
const YEAR_OFFSET = 593;

export interface YMD {
  year: number;
  /** 1-12 */
  month: number;
  day: number;
}

export type DateInput = Date | string | YMD;

export interface BanglaDate extends YMD {
  monthName: string;
  monthNameEn: string;
  /** 0 = Sunday ... 6 = Saturday */
  weekday: number;
  weekdayName: string;
  weekdayNameEn: string;
  season: string;
  isLeapYear: boolean;
  daysInMonth: number;
}

function isGregorianLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** Days since 1970-01-01 for a proleptic Gregorian date (no Date quirks). */
function daysFromCivil(y: number, m: number, d: number): number {
  const yy = m <= 2 ? y - 1 : y;
  const era = Math.floor(yy / 400);
  const yoe = yy - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

function civilFromDays(z0: number): YMD {
  const z = z0 + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const month = mp < 10 ? mp + 3 : mp - 9;
  const year = yoe + era * 400 + (month <= 2 ? 1 : 0);
  return { year, month, day };
}

function assertGregorian({ year, month, day }: YMD): void {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new TypeError('Date parts must be integers');
  }
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) {
    throw new RangeError(`Date out of range: ${year}-${month}-${day}`);
  }
  const back = civilFromDays(daysFromCivil(year, month, day));
  if (back.year !== year || back.month !== month || back.day !== day) {
    throw new RangeError(`Invalid Gregorian date: ${year}-${month}-${day}`);
  }
}

function toYMD(input: DateInput): YMD {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) throw new RangeError('Invalid Date');
    return { year: input.getFullYear(), month: input.getMonth() + 1, day: input.getDate() };
  }
  if (typeof input === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/.exec(input.trim());
    if (!m) throw new TypeError(`Expected an ISO date (YYYY-MM-DD), got: ${input}`);
    return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
  }
  return input;
}

/** True when the given Bangla year has a 30-day Falgun. */
export function isBanglaLeapYear(banglaYear: number): boolean {
  return isGregorianLeap(banglaYear + YEAR_OFFSET + 1);
}

/** Number of days in a Bangla month (1-12) of the given Bangla year. */
export function banglaMonthLength(banglaYear: number, month: number): number {
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError('Month must be 1-12');
  if (month <= 6) return 31;
  if (month === 11) return isBanglaLeapYear(banglaYear) ? 30 : 29;
  return 30;
}

function weekdayOf(days: number): number {
  return (((days + 4) % 7) + 7) % 7;
}

/**
 * Convert a Gregorian date (Date in local time, ISO "YYYY-MM-DD" string or
 * `{ year, month, day }`) to the Bangla calendar.
 */
export function gregorianToBangla(input: DateInput): BanglaDate {
  const g = toYMD(input);
  assertGregorian(g);
  const days = daysFromCivil(g.year, g.month, g.day);
  const startYear = g.month > 4 || (g.month === 4 && g.day >= 14) ? g.year : g.year - 1;
  let offset = days - daysFromCivil(startYear, 4, 14);
  const year = startYear - YEAR_OFFSET;
  let month = 1;
  while (offset >= banglaMonthLength(year, month)) {
    offset -= banglaMonthLength(year, month);
    month++;
  }
  const weekday = weekdayOf(days);
  return {
    year,
    month,
    day: offset + 1,
    monthName: BANGLA_MONTHS[month - 1] as string,
    monthNameEn: BANGLA_MONTHS_EN[month - 1] as string,
    weekday,
    weekdayName: BANGLA_WEEKDAYS[weekday] as string,
    weekdayNameEn: BANGLA_WEEKDAYS_EN[weekday] as string,
    season: BANGLA_SEASONS[Math.floor((month - 1) / 2)] as string,
    isLeapYear: isBanglaLeapYear(year),
    daysInMonth: banglaMonthLength(year, month),
  };
}

/** Convert a Bangla date to the Gregorian calendar. */
export function banglaToGregorian({ year, month, day }: YMD): YMD {
  if (!Number.isInteger(year) || year < 1 || year > 9406) throw new RangeError('Bangla year out of range');
  const length = banglaMonthLength(year, month);
  if (!Number.isInteger(day) || day < 1 || day > length) {
    throw new RangeError(`Day must be 1-${length} for month ${month} of ${year}`);
  }
  let offset = day - 1;
  for (let m = 1; m < month; m++) offset += banglaMonthLength(year, m);
  return civilFromDays(daysFromCivil(year + YEAR_OFFSET, 4, 14) + offset);
}

/** Convert a Bangla date to a JS Date at local midnight. */
export function banglaToDate(bn: YMD): Date {
  const g = banglaToGregorian(bn);
  const d = new Date(2000, g.month - 1, g.day);
  d.setFullYear(g.year);
  return d;
}

export interface FormatBanglaDateOptions {
  /** Digit script. Default 'bn'. */
  digits?: 'bn' | 'en';
  /** Prefix the weekday name: "রবিবার, ১ বৈশাখ ১৪৩১". */
  weekday?: boolean;
  /** Use the day ordinal: "১লা বৈশাখ ১৪৩১". */
  ordinalDay?: boolean;
  /** Append the season name in parentheses. */
  season?: boolean;
}

/**
 * Format a date in the Bangla calendar.
 *
 * @example formatBanglaDate('2024-04-14') // "১ বৈশাখ ১৪৩১"
 */
export function formatBanglaDate(input: DateInput, options: FormatBanglaDateOptions = {}): string {
  const b = gregorianToBangla(input);
  const useBn = options.digits !== 'en';
  const num = (n: number): string => (useBn ? toBanglaDigits(n) : String(n));
  const dayText = options.ordinalDay
    ? banglaDayOrdinal(b.day, { digits: useBn ? 'bn' : 'en' })
    : num(b.day);
  let out = `${dayText} ${b.monthName} ${num(b.year)}`;
  if (options.weekday) out = `${b.weekdayName}, ${out}`;
  if (options.season) out += ` (${b.season})`;
  return out;
}

/** True when the Gregorian date is Pohela Boishakh (14 April). */
export function isPohelaBoishakh(input: DateInput): boolean {
  const b = gregorianToBangla(input);
  return b.month === 1 && b.day === 1;
}
