export interface EnglishWordsToNumberOptions {
  /** Words that mark a negative number. Default ['minus', 'negative']. */
  negativeWords?: readonly string[];
  /** Word between integer and fraction. Default 'point'. */
  decimalWord?: string;
}

const UNITS = new Map<string, number>(
  [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
  ].map((w, i) => [w, i]),
);
const TENS = new Map<string, number>(
  ['twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'].map((w, i) => [w, (i + 2) * 10]),
);
const INTERNATIONAL = [
  'thousand', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion',
  'sextillion', 'septillion', 'octillion', 'nonillion', 'decillion',
] as const;
const SCALES = new Map<string, bigint>(INTERNATIONAL.map((w, i) => [w, 1000n ** BigInt(i + 1)]));
const LAKH = 100000n;
const CRORE = 10000000n;
const SCALE_ALIASES: Readonly<Record<string, string>> = {
  thousands: 'thousand',
  lac: 'lakh',
  lacs: 'lakh',
  lakhs: 'lakh',
  crores: 'crore',
};

function fail(text: string): never {
  throw new TypeError(`Cannot parse English number words: ${JSON.stringify(text)}`);
}

type Last = 'none' | 'unit' | 'teen' | 'tens' | 'hundred' | 'scale';

function parseInteger(tokens: string[], original: string): bigint {
  if (tokens.length === 1 && tokens[0] === 'zero') return 0n;
  let total = 0n; // value committed by scale words
  let group = 0n; // value since the last scale word (0..999 plus "twelve hundred" style)
  let last: Last = 'none';
  let hundredInGroup = false;
  let lastScale: bigint | undefined; // smallest scale used since the last crore, for ordering
  let indian = false;
  let western = false;

  for (const raw of tokens) {
    const tok = SCALE_ALIASES[raw] ?? raw;
    const unit = UNITS.get(tok);
    const tens = TENS.get(tok);
    if (unit !== undefined) {
      if (unit === 0) fail(original);
      if (unit >= 10 ? last === 'unit' || last === 'teen' || last === 'tens' : last === 'unit' || last === 'teen') {
        fail(original);
      }
      group += BigInt(unit);
      last = unit >= 10 ? 'teen' : 'unit';
    } else if (tens !== undefined) {
      if (last === 'unit' || last === 'teen' || last === 'tens') fail(original);
      group += BigInt(tens);
      last = 'tens';
    } else if (tok === 'hundred') {
      // "five hundred", "twelve hundred"; not "hundred" alone or "five hundred hundred".
      if (hundredInGroup || group === 0n || group >= 100n || last === 'none' || last === 'scale') fail(original);
      group *= 100n;
      hundredInGroup = true;
      last = 'hundred';
    } else if (tok === 'crore') {
      indian = true;
      // Crores multiply everything said so far ("ten thousand crore", "one crore crore").
      if (total + group === 0n) fail(original);
      total = (total + group) * CRORE;
      group = 0n;
      hundredInGroup = false;
      lastScale = CRORE;
      last = 'scale';
    } else if (tok === 'lakh' || SCALES.has(tok)) {
      const scale = tok === 'lakh' ? LAKH : (SCALES.get(tok) as bigint);
      if (tok === 'lakh') indian = true;
      else if (tok !== 'thousand') western = true;
      if (group === 0n || (lastScale !== undefined && scale >= lastScale)) fail(original);
      total += group * scale;
      group = 0n;
      hundredInGroup = false;
      lastScale = scale;
      last = 'scale';
    } else {
      fail(original);
    }
  }
  if (indian && western) fail(original);
  return total + group;
}

/**
 * Parse English number words into an exact decimal string. The reverse of
 * `englishWords`, for both the South Asian system (thousand, lakh, crore) and
 * the international system (million, billion ...).
 *
 * Case-insensitive. Accepts hyphens ("twenty-one"), commas, "and", the plural
 * and "lac" spellings of lakh and crore, and a trailing "only" as written on
 * cheques. Throws a TypeError for anything that is not a well-formed number.
 *
 * @example englishWordsToNumberString('Twelve Lakh Thirty Four Thousand') // "1234000"
 */
export function englishWordsToNumberString(text: string, options: EnglishWordsToNumberOptions = {}): string {
  const negativeWords = (options.negativeWords ?? ['minus', 'negative']).map((w) => w.toLowerCase());
  const decimalWord = (options.decimalWord ?? 'point').toLowerCase();
  const words = text
    .toLowerCase()
    .replace(/[,\-‐–]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words[words.length - 1] === 'only') words.pop();
  if (words.length === 0) fail(text);

  let negative = false;
  if (negativeWords.includes(words[0] as string)) {
    negative = true;
    words.shift();
  }

  const dot = words.indexOf(decimalWord);
  const intWords = (dot === -1 ? words : words.slice(0, dot)).filter((w) => w !== 'and');
  const fracWords = dot === -1 ? [] : words.slice(dot + 1);
  if (intWords.length === 0 || (dot !== -1 && fracWords.length === 0)) fail(text);
  if (words[0] === 'and') fail(text);

  const int = parseInteger(intWords, text);
  let frac = '';
  for (const w of fracWords) {
    const d = w === 'oh' ? 0 : UNITS.get(w);
    if (d === undefined || d > 9) fail(text);
    frac += String(d);
  }

  const value = int.toString() + (frac ? '.' + frac : '');
  const isZero = int === 0n && /^0*$/.test(frac);
  return (negative && !isZero ? '-' : '') + value;
}

/**
 * Parse English number words into a JavaScript number.
 * Throws a RangeError when the value is not exactly representable; use
 * `englishWordsToNumberString` for very large numbers.
 *
 * @example englishWordsToNumber('One Million Two Hundred Thousand') // 1200000
 */
export function englishWordsToNumber(text: string, options: EnglishWordsToNumberOptions = {}): number {
  const s = englishWordsToNumberString(text, options);
  const n = Number(s);
  if (!Number.isFinite(n) || (!s.includes('.') && !Number.isSafeInteger(n))) {
    throw new RangeError(`Value is too large for a JavaScript number: ${s}. Use englishWordsToNumberString().`);
  }
  return n;
}
