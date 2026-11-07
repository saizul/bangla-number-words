# Contributing

Thanks for helping improve bangla-number-words.

## Setup

```bash
git clone <your fork>
cd bangla-number-words
npm install
```

## Workflow

```bash
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # vitest (unit and property tests)
npm run build      # tsup, ESM + CJS + types
```

## Guidelines

- Keep the library dependency free at runtime.
- Add tests for every behavior change. Numeric functions should have a
  table of known values and, where a round trip exists, a fast-check property.
- Bangla spellings: if you propose a different standard spelling, cite a
  dictionary or Bangla Academy reference in the pull request and prefer adding
  an option over changing the default.
- Calendar changes must keep the documented rules (see README) and the
  reference-date tests passing.
- Write clear commit messages and keep pull requests focused.

## Reporting bugs

Open an issue with the input, the output you got and the output you expected.
