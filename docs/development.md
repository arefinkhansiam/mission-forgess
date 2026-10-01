# Development

Scripts (from `package.json`): `dev`, `build`, `build:dev`, `preview`, `lint`, `format`. Setup steps are in the main README.

```bash
npm install
cp .env.example .env
npm run dev
npm run lint
npm run build
npm run preview
```

## Rules
- NASA/JPL calls only via `getNasa`; read `process.env.NASA_API_KEY` inside the handler.
- All UI text goes through `t()` in `src/locales/resources.ts`; numbers stay in code.
- Label any non-NASA number as a game estimate; label fallback data as DEMO DATA.
- The build targets an edge/Worker runtime; avoid Node-only packages.
