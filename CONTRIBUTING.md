# Contributing

1. Fork and clone, then `npm install` and `cp .env.example .env`.
2. Create a branch, make your change, run `npm run build`.
3. Open a pull request describing what changed and why.

Rules:
- Never commit secrets or a real `.env`.
- NASA/JPL calls go only through `getNasa` in `src/lib/nasa.functions.ts`.
- UI text goes through `t()` in `src/locales/resources.ts`; numbers stay in code.
- Label non-NASA numbers as game estimates and fallback data as DEMO DATA.
- Update `docs/data-sources.md` when data sources change.
