# bangla-number-words

Numbers to Bangla and English words, Taka amounts for invoices and cheques, lakh/crore formatting, digit conversion and the Bangla (Bangabda) calendar. Zero runtime dependencies, strict TypeScript, ESM and CommonJS.

[বাংলা](#বাংলা) | English

```bash
npm install bangla-number-words
```

## Features

- Bangla words in the Bangladeshi system: হাজার, লক্ষ (or লাখ), কোটি, with crore repetition above 99 crore ("দশ হাজার কোটি", "এক কোটি কোটি")
- Decimals (দশমিক), negatives, arbitrary size via `bigint` or numeric strings
- Ordinals: প্রথম, দ্বিতীয় ... দশম, then `তম`; short forms (১ম, ২য়, ৩য়, ৪র্থ), date forms (১লা, ২রা)
- English words in the South Asian system (thousand, lakh, crore) or the international system
- Taka for invoices and cheques, in Bangla and English
- Lakh/crore grouping (`1,23,45,678`) in Bangla or English digits and parsing back
- Compact notation for dashboards and headlines: `12.5 Lakh`, `১২.৫ লক্ষ`, `৳3.45Cr`, and parsing back
- Bangla calendar conversion with month, weekday and season names, date parsing (`১লা বৈশাখ ১৪৩১`, `1st Baishakh 1431`), day/month/year arithmetic and month grids


## Install from GitHub Packages

Releases are also published to [GitHub Packages](https://github.com/saizul/bangla-number-words/pkgs/npm/bangla-number-words) as `@saizul/bangla-number-words`:

```bash
echo "@saizul:registry=https://npm.pkg.github.com" >> .npmrc
npm install @saizul/bangla-number-words
```

GitHub Packages needs a personal access token with `read:packages` in your `~/.npmrc` (`//npm.pkg.github.com/:_authToken=YOUR_TOKEN`).

## Usage

```ts
import {
  banglaWords, englishWords, takaWords,
  formatNumber, parseNumber, toBanglaDigits,
  gregorianToBangla, formatBanglaDate,
} from 'bangla-number-words';

banglaWords(125000);          // "এক লক্ষ পঁচিশ হাজার"
banglaWords(3.14);            // "তিন দশমিক এক চার"
banglaWords(-5);              // "ঋণাত্মক পাঁচ"
banglaWords(10n ** 14n);      // "এক কোটি কোটি"
banglaWords(100000, { lakh: 'লাখ' }); // "এক লাখ"

englishWords(1234567);        // "Twelve Lakh Thirty Four Thousand Five Hundred Sixty Seven"
englishWords(1234567, { system: 'international' });
// "One Million Two Hundred Thirty Four Thousand Five Hundred Sixty Seven"

takaWords(1250.5);
// "এক হাজার দুইশত পঞ্চাশ টাকা পঞ্চাশ পয়সা মাত্র"
takaWords(1250.5, { lang: 'en' });
// "One Thousand Two Hundred Fifty Taka and Fifty Paisa Only"

formatNumber(12345678);                    // "1,23,45,678"
wordsToNumber('এক হাজার দুইশত'); // 1200 (উল্টো রূপান্তর; বড় সংখ্যায় wordsToNumberString)
formatNumber(12345678, { digits: 'bn' });  // "১,২৩,৪৫,৬৭৮"
parseNumber('১,২৩,৪৫,৬৭৮.৫০');            // 12345678.5
toBanglaDigits(2026);                      // "২০২৬"

formatBanglaDate('2024-04-14', { weekday: true }); // "রবিবার, ১ বৈশাখ ১৪৩১"
```

CommonJS works too: `const { banglaWords } = require('bangla-number-words');`

### Input types

Every function that accepts a number takes `number | bigint | string`. Strings may use Bangla digits. Use strings or `bigint` for values beyond `Number.MAX_SAFE_INTEGER`; JavaScript numbers lose precision there.

### Words

| Function | Options |
| --- | --- |
| `banglaWords(n, opts)` | `lakh: 'লক্ষ' \| 'লাখ'`, `hundred: 'শত' \| 'শ'`, `negativeWord`, `decimalWord` |
| `englishWords(n, opts)` | `system: 'indian' \| 'international'`, `case: 'title' \| 'lower' \| 'upper' \| 'sentence'`, `hyphenate`, `useAnd`, `negativeWord`, `decimalWord` |

The international system supports values below 10^36.

### Ordinals

```ts
banglaOrdinalWords(1);   // "প্রথম"
banglaOrdinalWords(11);  // "এগারোতম"
banglaOrdinalShort(4);   // "৪র্থ"
banglaDayOrdinal(19);    // "১৯শে"
englishOrdinalWords(21); // "Twenty First"
englishOrdinalShort(22); // "22nd"
englishOrdinalSuffix(113); // "th"
englishOrdinalWords(21, { case: 'lower', hyphenate: true }); // "twenty-first"
englishOrdinalWords(100, { case: 'lower' });                 // "one hundredth"

// one entry point for both languages and both styles
formatOrdinal(11);                                  // "11th"
formatOrdinal(3, { style: 'words' });               // "Third"
formatOrdinal(4, { locale: 'bn' });                 // "৪র্থ"
formatOrdinal(1, { locale: 'bn', style: 'words' }); // "প্রথম"
```

Ordinals need a positive integer (a `RangeError` is thrown for zero, negatives and fractions). Bangla digits and numeric strings are accepted as input.

### Taka

`takaWordsBn`, `takaWordsEn` and `takaWords` round to two decimals (half up). Options: `majorUnit`, `minorUnit`, `suffix` (`''` to omit), `showZeroMinor`, plus the word options above and `negativeWord`/`joiner` for English.

### Formatting and parsing

`formatNumber(n, { digits, grouping, minimumFractionDigits, maximumFractionDigits, separator, decimalSeparator })`, `formatCurrency(n)` (`৳12,34,567.89`), `parseNumber(text)` (NaN on failure) and `parseNumberString(text)` (canonical string or `null`, exact for huge values).

### Compact notation (thousand, lakh, crore)

```ts
formatCompact(1250000);                                  // "12.5 Lakh"
formatCompact(1250000, { locale: 'bn' });                // "১২.৫ লক্ষ"
formatCompact(34500000, { style: 'short' });             // "3.45Cr"
formatCompact(34500000, { symbol: '৳', locale: 'bn' });  // "৳৩.৪৫ কোটি"
formatCompact(1500);                                     // "1.5 Thousand"
formatCompact(45000, { thousand: false });               // "45,000"
formatCompact(99999.6, { maximumFractionDigits: 0 });    // "1 Lakh"
formatCompact(123456789012n);                            // "12,345.68 Crore"
formatCompact(100000, { locale: 'bn', lakh: 'লাখ' });     // "১ লাখ"
formatCompact(250000, { units: { lakh: 'Lac' } });       // "2.5 Lac"

parseCompact('১২.৫ লক্ষ');        // 1250000
parseCompact('৳3.45Cr');          // 34500000
parseCompactString('2.5 crore');  // "25000000" (exact string, null when invalid)
```

| Option | Default | Meaning |
| --- | --- | --- |
| `locale` | `'en'` | `'en'` (Thousand, Lakh, Crore) or `'bn'` (হাজার, লক্ষ, কোটি) |
| `digits` | follows `locale` | `'bn'` or `'en'` digits for the number |
| `style` | `'long'` | `'short'` gives `K`, `L`, `Cr` with no space (English only) |
| `maximumFractionDigits` | `2` | rounds half-up; trailing zeros are dropped |
| `minimumFractionDigits` | `0` | pads with zeros (`"12.50 Lakh"`) |
| `thousand` | `true` | `false` writes values below one lakh in full |
| `lakh` | `'লক্ষ'` | `'লাখ'` for the colloquial Bangla word |
| `units` | | replace any label: `{ thousand, lakh, crore }` |
| `symbol` | `''` | prefix such as `'৳'`, placed after the minus sign |

Values below 1,000 keep their own digits (`formatCompact(999)` is `"999"`), and anything from one crore up is expressed in crore with lakh/crore grouping. The parser accepts English and Bangla digits and these units in any letter case: `K`, `Thousand`, `হাজার`, `L`, `Lac`, `Lakh`, `লক্ষ`, `লাখ`, `Cr`, `Crore`, `কোটি` (plural `s` allowed), with an optional `৳`, `Tk` or `BDT` prefix.

### Bangla calendar

```ts
gregorianToBangla('2024-04-14');
// { year: 1431, month: 1, day: 1, monthName: 'বৈশাখ', weekdayName: 'রবিবার', season: 'গ্রীষ্ম', ... }
banglaToGregorian({ year: 1431, month: 9, day: 1 }); // { year: 2024, month: 12, day: 16 }
formatBanglaDate('2024-12-16', { ordinalDay: true }); // "১লা পৌষ ১৪৩১"
```

Dates may be a `Date` (interpreted in local time), an ISO `YYYY-MM-DD` string or `{ year, month, day }`.

#### Parsing, date arithmetic and month grids

```ts
parseBanglaDate('রবিবার, ১লা বৈশাখ ১৪৩১');   // { year: 1431, month: 1, day: 1 }
parseBanglaDate('1st Baishakh, 1431 BS');    // { year: 1431, month: 1, day: 1 }
tryParseBanglaDate('৩২ বৈশাখ ১৪৩১');         // null

addBanglaDays({ year: 1430, month: 12, day: 30 }, 1);   // { year: 1431, month: 1, day: 1 }
addBanglaMonths({ year: 1431, month: 6, day: 31 }, 1);  // { year: 1431, month: 7, day: 30 } (clamped)
addBanglaYears({ year: 1430, month: 11, day: 30 }, 1);  // { year: 1431, month: 11, day: 29 }
banglaDaysBetween({ year: 1431, month: 1, day: 1 }, { year: 1432, month: 1, day: 1 }); // 365
compareBanglaDates(a, b);                                // -1, 0 or 1

const cal = banglaMonthCalendar(1431, 1, { weekStart: 6 }); // Saturday-first grid
cal.weeks; // rows of 7 cells: { day, weekday, gregorian } or null outside the month
```

`parseBanglaDate` reads everything `formatBanglaDate` writes (any combination of `weekday`, `ordinalDay`, `season` and digit script) plus common hand-written forms: Bangla or English digits, Bangla or romanised month names with spelling variants (জ্যৈষ্ঠ/জৈষ্ঠ্য, Boishakh/Baishakh, Choitro/Chaitra, ...), day suffixes (১লা, ২১শে, 1st, 22nd), an optional weekday, a trailing `বঙ্গাব্দ`/`সন`/`BS`, and numeric `1431-01-01`. It throws `TypeError` for text it cannot read and `RangeError` for dates that do not exist, a suffix that does not fit the day (`২লা`), or a weekday that does not match the date (pass `{ checkWeekday: false }` to ignore the weekday).

`addBanglaMonths` and `addBanglaYears` clamp the day to the last day of the target month, so month arithmetic never produces an invalid date.

#### Calendar rules

This package implements the revised Bangladeshi national calendar (the Bangla Academy reform, with the later revision of month lengths), where Pohela Boishakh always falls on 14 April:

- The year begins on 14 April (1 Boishakh). Bangla year = Gregorian year - 593 from 14 April onward.
- Boishakh to Ashwin (the first six months) have 31 days.
- Kartik, Agrahayan, Poush, Magh and Choitro have 30 days.
- Falgun has 29 days, or 30 in a leap year. Bangla year B is a leap year when Gregorian year B + 594 is a leap year (the year in which that Falgun falls).

Under these rules 14 April is always 1 Boishakh, 14 February is 1 Falgun, 15 March is 1 Choitro, and 16 December 2024 is 1 Poush 1431. The tests pin these reference dates. If an official gazette in your jurisdiction differs for a specific year, please open an issue with a citation. The rules are a civil calendar convention, not an astronomical or lunar calendar; it does not compute traditional (Hindu) Bengali calendar dates used in West Bengal.

> **Note:** the rules above are implemented from publicly documented descriptions of the revised calendar and verified against well-known reference dates (14 April = 1 Boishakh, 16 December = 1 Poush). Please cross-check with the official calendar for legal or government use.

## Development

```bash
npm install
npm run lint && npm test && npm run build
```

See [CONTRIBUTING.md](CONTRIBUTING.md). Licensed under MIT, by [Saizul Amin](https://saizul.com).

---

## বাংলা

সংখ্যাকে বাংলা ও ইংরেজি কথায় রূপান্তর, চেক ও ইনভয়েসের জন্য টাকার অঙ্ক কথায়, লক্ষ/কোটি হিসাবে কমা বসানো, বাংলা-ইংরেজি অঙ্ক রূপান্তর এবং বাংলা সন (বঙ্গাব্দ) ক্যালেন্ডার। কোনো রানটাইম ডিপেন্ডেন্সি নেই।

```bash
npm install bangla-number-words
```

### ব্যবহার

```ts
import { banglaWords, wordsToNumber, takaWords, formatNumber, parseNumber, formatBanglaDate } from 'bangla-number-words';

banglaWords(125000);   // "এক লক্ষ পঁচিশ হাজার"
banglaWords(3.14);     // "তিন দশমিক এক চার"
takaWords(1250.5);     // "এক হাজার দুইশত পঞ্চাশ টাকা পঞ্চাশ পয়সা মাত্র"
takaWords(1250.5, { lang: 'en' }); // "One Thousand Two Hundred Fifty Taka and Fifty Paisa Only"
formatNumber(12345678, { digits: 'bn' }); // "১,২৩,৪৫,৬৭৮"
parseNumber('১,২৩,৪৫,৬৭৮');              // 12345678
formatBanglaDate('2024-04-14');           // "১ বৈশাখ ১৪৩১"
```

### বৈশিষ্ট্য

- সংক্ষিপ্ত রূপ: `formatCompact(1250000, { locale: 'bn' })` দেয় "১২.৫ লক্ষ"; `parseCompact('১২.৫ লক্ষ')` দেয় 1250000
- হাজার, লক্ষ (বা লাখ), কোটি; ৯৯ কোটির বেশি হলে কোটি পুনরাবৃত্তি ("দশ হাজার কোটি")
- দশমিক, ঋণাত্মক সংখ্যা, `bigint` ও স্ট্রিং ইনপুটে যেকোনো বড় সংখ্যা
- ক্রমবাচক সংখ্যা: প্রথম, দ্বিতীয়, তৃতীয় ... দশম, এরপর "তম"; সংক্ষিপ্ত রূপ ১ম, ২য়, ৩য়, ৪র্থ; তারিখের রূপ ১লা, ২রা
- ইংরেজিতে দক্ষিণ এশীয় পদ্ধতি (thousand, lakh, crore) অথবা আন্তর্জাতিক পদ্ধতি
- টাকার অঙ্ক কথায় (বাংলা ও ইংরেজি), ইউনিট ও শেষ শব্দ কনফিগার করা যায়
- বাংলা সন: গ্রেগরিয়ান থেকে বঙ্গাব্দ এবং উল্টোটা, মাস, বার ও ঋতুর নাম
- বাংলা তারিখ পার্স করা (`parseBanglaDate('১লা বৈশাখ ১৪৩১')`), দিন/মাস/বছর যোগ-বিয়োগ, দুই তারিখের ব্যবধান এবং মাসের ক্যালেন্ডার গ্রিড (`banglaMonthCalendar`)

### বাংলা সনের নিয়ম

সংশোধিত বাংলাদেশ পঞ্জিকার নিয়ম অনুসরণ করা হয়েছে: ১ বৈশাখ প্রতি বছর ১৪ এপ্রিল। বৈশাখ থেকে আশ্বিন, প্রথম ছয় মাস ৩১ দিন। কার্তিক, অগ্রহায়ণ, পৌষ, মাঘ ও চৈত্র ৩০ দিন। ফাল্গুন ২৯ দিন, অধিবর্ষে ৩০ দিন (বঙ্গাব্দ B-এর ফাল্গুন যে গ্রেগরিয়ান বছরে পড়ে, অর্থাৎ B + ৫৯৪, সেটি অধিবর্ষ হলে)। এই নিয়মে ১৬ ডিসেম্বর ২০২৪ = ১ পৌষ ১৪৩১। টেস্টে এই রেফারেন্স তারিখগুলো যাচাই করা আছে।

### লাইসেন্স

MIT, [সাইজুল আমিন](https://saizul.com)।
