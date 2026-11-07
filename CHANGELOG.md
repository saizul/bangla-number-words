# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-11-07

### Added
- Bangla number words in the Bangladeshi system (হাজার, লক্ষ/লাখ, কোটি with
  repetition above 99 crore), decimals (দশমিক) and negatives.
- Bangla and English ordinals (প্রথম, দ্বিতীয় ... generic "তম" rule, 1st/2nd/3rd).
- English words in the South Asian system (thousand, lakh, crore) and an
  international system option.
- Taka amounts in words for invoices and cheques, Bangla and English, with
  configurable units, suffix and casing.
- Number formatting with lakh/crore grouping in Bangla or English digits,
  parsing formatted strings back to numbers, digit conversion helpers.
- Bangla (Bangabda) calendar conversion based on the revised Bangladesh
  calendar, with Bangla month, weekday and season names.
- ESM and CommonJS builds with bundled TypeScript types.
