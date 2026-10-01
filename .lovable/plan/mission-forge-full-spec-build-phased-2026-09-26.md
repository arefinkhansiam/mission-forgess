# Mission Forge — full spec build (phased)

The existing game (one 3D screen, shared mission store, Blue Marble Earth, Orion-style ship, mission → route → build → launch → flight → failure → rescue → landing → report) is the starting point. We extend it phase by phase from the spec's §58 order, keeping it playable after each phase.

## This first batch (Phases 1–2, plus square viewport)

1. **Square game viewport (§3)** — the game renders inside a centered 1:1 square on phones/tablets and portrait screens; on PC landscape it expands to a wider view with mouse/keyboard. Removes the current "rotate the whole screen 90°" behavior on phones, since the spec wants vertical/square play.
2. **Game shell cleanup (§4, §49, §51, §52)** — one simple global nav (Home, Missions, Learn, Passport, Settings), one icon set, one type scale, audit every screen for overlapping or dead buttons.
3. **NASA data layer (§A, §D)** — turn on Lovable Cloud and add server-side NASA calls with caching, so the key never reaches the browser:
   - APOD (home/loading art), EPIC (Earth Control), NeoWs + SBDB + Sentry (asteroid mission), DONKI (space-weather challenges), Mars Rover Photos (Mars scans), Image Library (hangar cards), JPL Horizons (planet positions for the route map).
   - Each call is cached in the database; on failure or quota exhaustion it serves last-known-good or hand-written demo data, and the UI shows a `DEMO DATA` tag.
   - Planet constants stay hand-encoded from the NASA Fact Sheet (§C), each with its source.
4. **Settings** — quality LOW/MEDIUM/HIGH/ULTRA with auto-detect.

## Later batches (one or two phases per turn)

- Phase 3: Learn screens, Dr. Ayesha guide, browser voice, language switch
- Phase 4–7: mission list + brief with real NASA data, route planner on Horizons positions, builder with the rocket-equation Δv explainer, validation + launch
- Phase 8–12: cockpit, Earth Control with EPIC Earth, DONKI-driven challenges and decisions, Moon/Mars landing on USGS textures, rescue
- Phase 13–16: autopsy, black-box replay, what-if, World Saver, report/passport/career with save
- Phase 17: performance, polish, QA checklist (§57)

## What I need from you

- A free NASA API key from api.nasa.gov. Until you add it, the game runs on `DEMO_KEY` (30 calls/hour) and cached/demo data.
- Official NASA 3D models (§B1) must be downloaded and converted ahead of time; I'll source what's reachable, and anything I can't get stays as the current Orion-inspired model, labeled as such.

## Technical details

- Server functions (`createServerFn`) proxy NASA endpoints; a `nasa_cache` table (key, payload, fetched_at, ttl) stores responses; readers are public, writes are server-only.
- `NASA_API_KEY` stored as a secret; falls back to `DEMO_KEY`.
- Square viewport via CSS `aspect-ratio: 1` container with `min(100vw, 100dvh)` sizing; PC landscape media query widens it.
- All phases remain inside the existing single-screen store and Canvas, per project rules.
