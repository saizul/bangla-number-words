import { BN_NAMES, banglaWords } from './words-bn';

export interface WordsToNumberOptions {
  /** Word that marks a negative number. Default 'ঋণাত্মক'. */
  negativeWord?: string;
  /** Word between integer and fraction. Default 'দশমিক'. */
  decimalWord?: string;
}

const NAME_VALUES = new Map<string, number>(BN_NAMES.map((w, i) => [w, i]));
const HUNDRED_SUFFIXES = ['শত', 'শো', 'শ'] as const;
const SCALES: Readonly<Record<string, bigint>> = {
  হাজার: 1000n,
  লক্ষ: 100000n,
  কোটি: 10000000n,
};

function fail(text: string): never {
  throw new TypeError(`Cannot parse Bangla number words: ${JSON.stringify(text)}`);
}

/** Map spelling variants (লাখ, দুইশ, দুইশো, "দুই শত") onto the canonical form banglaWords() emits. */
function canonicalTokens(tokens: string[], original: string): string[] {
  const out: string[] = [];
  for (const raw of tokens) {
    const tok = raw === 'লাখ' ? 'লক্ষ' : raw;
    if (NAME_VALUES.has(tok) || tok in SCALES) {
      out.push(tok);
      continue;
    }
    let done = false;
    for (const suffix of HUNDRED_SUFFIXES) {
      if (!tok.endsWith(suffix)) continue;
      const base = tok.slice(0, -suffix.length);
      if (base === '') {
        // Detached hundred word: "দুই শত" -> "দুইশত".
        const prev = out.pop();
        if (prev === undefined || !NAME_VALUES.has(prev) || prev === 'শূন্য') fail(original);
        out.push(prev + 'শত');
        done = true;
      } else if (NAME_VALUES.has(base) && base !== 'শূন্য') {
        out.push(base + 'শত');
        done = true;
      }
      if (done) break;
    }
    if (!done) fail(original);
  }
  return out;
}

function parseInteger(tokens: string[], original: string): bigint {
  let total = 0n;
  let pending = 0n;
  for (const tok of tokens) {
    const scale = SCALES[tok];
    if (scale !== undefined) {
      if (tok === 'কোটি') {
        // Crores multiply everything said so far ("দশ হাজার কোটি" = 10,000 crore).
        total = (total + pending) * scale;
      } else {
        if (pending === 0n) fail(original);
        total += pending * scale;
      }
      pending = 0n;
    } else if (tok.endsWith('শত') && !NAME_VALUES.has(tok)) {
      pending += BigInt(NAME_VALUES.get(tok.slice(0, -2)) as number) * 100n;
    } else {
      pending += BigInt(NAME_VALUES.get(tok) as number);
    }
  }
  return total + pending;
}

/**
 * Parse Bangla number words into an exact decimal string. The reverse of
 * `banglaWords`, so any size of number round-trips without precision loss.
 *
 * Accepts the spelling variants লক্ষ/লাখ and শত/শ/শো (attached or detached).
 * Throws a TypeError for anything that is not a well-formed number name.
 *
 * @example wordsToNumberString('এক লক্ষ পঁচিশ হাজার') // "125000"
 */
export function wordsToNumberString(text: string, options: WordsToNumberOptions = {}): string {
  const negativeWord = options.negativeWord ?? 'ঋণাত্মক';
  const decimalWord = options.decimalWord ?? 'দশমিক';
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) fail(text);

  let negative = false;
  if (words[0] === negativeWord) {
    negative = true;
    words.shift();
  }

  const dot = words.indexOf(decimalWord);
  const intWords = dot === -1 ? words : words.slice(0, dot);
  const fracWords = dot === -1 ? [] : words.slice(dot + 1);
  if (intWords.length === 0 || (dot !== -1 && fracWords.length === 0)) fail(text);

  const tokens = canonicalTokens(intWords, text);
  const int = parseInteger(tokens, text);
  let frac = '';
  for (const w of fracWords) {
    const d = NAME_VALUES.get(w);
    if (d === undefined || d > 9) fail(text);
    frac += String(d);
  }

  const value = int.toString() + (frac ? '.' + frac : '');
  // Reject mis-ordered input such as "হাজার এক" by requiring the canonical rendering.
  const given = [...tokens, ...(dot !== -1 ? [decimalWord, ...fracWords] : [])];
  if (banglaWords(value, { decimalWord }) !== given.join(' ')) fail(text);

  const isZero = /^0*$/.test(int.toString()) && /^0*$/.test(frac);
  return (negative && !isZero ? '-' : '') + value;
}

/**
 * Parse Bangla number words into a JavaScript number.
 * Throws a RangeError when the value is not exactly representable; use
 * `wordsToNumberString` for very large numbers.
 *
 * @example wordsToNumber('এক হাজার দুইশত') // 1200
 */
export function wordsToNumber(text: string, options: WordsToNumberOptions = {}): number {
  const s = wordsToNumberString(text, options);
  const n = Number(s);
  if (!Number.isFinite(n) || (!s.includes('.') && !Number.isSafeInteger(n))) {
    throw new RangeError(`Value is too large for a JavaScript number: ${s}. Use wordsToNumberString().`);
  }
  return n;
}
