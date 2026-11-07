const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'] as const;

/** Replace every ASCII digit (0-9) in the input with its Bangla counterpart. */
export function toBanglaDigits(input: string | number | bigint): string {
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)] as string);
}

/** Replace every Bangla digit (০-৯) in the input with its ASCII counterpart. */
export function toEnglishDigits(input: string | number | bigint): string {
  return String(input).replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09e6));
}

/** True when the string contains at least one Bangla digit. */
export function hasBanglaDigits(input: string): boolean {
  return /[০-৯]/.test(input);
}

/** True when the string consists only of Bangla digits (and is non-empty). */
export function isBanglaDigits(input: string): boolean {
  return /^[০-৯]+$/.test(input);
}
