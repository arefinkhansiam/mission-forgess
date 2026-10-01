# Architecture

Stack: React 19, TanStack Start v1 (SSR + server functions), Vite, Three.js via React Three Fiber, Zustand, Tailwind CSS v4, i18next. Backend: Postgres (via Supabase client) used only for the NASA response cache.

## NASA data layer

```text
NASA / JPL APIs
      |
Data Integration Layer   (src/lib/nasa.functions.ts -> getNasa server function,
      |                   nasa_cache table, labeled DEMO DATA fallback)
      v
NASA Data Demo            (NasaFeed, MissionBrief imagery, LivePositions, GoPoll space weather)
```

## Game simulation layer

```text
User -> Mission Planning -> Spacecraft Configuration -> Physics Calculations
     -> Mission Simulation -> Player Decisions -> Mission Outcome -> Mission Report
```

The layers are intentionally separated: the NASA layer never supplies game scores, and game estimates are never labeled as NASA data.

## Key files
- `src/stores/mission-store.ts` — single game store, all phases
- `src/lib/mission-sim.ts` — physics + game mechanics (`analyze()`)
- `src/lib/nasa-data.ts` — reference planetary data and source list
- `src/lib/nasa.functions.ts` — server-side NASA/JPL proxy (keys stay on the server)
- `src/components/game/` — 3D scenes (`Universe`, `Stages`, `Spacecraft`) and HUD screens
- `src/locales/resources.ts` — UI translations
