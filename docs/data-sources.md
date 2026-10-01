# Data Provenance

| Data / Component | Source | Usage | Type |
|---|---|---|---|
| APOD | `api.nasa.gov/planetary/apod` | Home screen "NASA Data Demo" feed | NASA live API |
| NeoWs (today's close approaches) | `api.nasa.gov/neo/rest/v1/feed` | Home screen "NASA Data Demo" feed | NASA live API |
| DONKI solar flares | `api.nasa.gov/DONKI/FLR` | Home feed + GO/NO-GO launch poll (space-weather station) | NASA live API |
| NASA Image and Video Library | `images-api.nasa.gov/search` | Mission brief destination imagery | NASA live API |
| JPL Horizons vectors | `ssd.jpl.nasa.gov/api/horizons.api` | Live planet positions panel on route map | JPL live API |
| NASA Blue Marble texture | NASA Visible Earth (stored locally) | 3D Earth / home globe | NASA image asset |
| Moon, Mars, Ceres, Jupiter, Saturn portraits | NASA Image Library (stored locally) | Destination cards | NASA image asset |
| Planet diameter, distance (AU), period, gravity | NASA NSSDCA Planetary Fact Sheets | `src/lib/nasa-data.ts`, simulation | NASA-published reference data |
| RL10 / NSTAR / NERVA Isp and thrust | NASA/manufacturer published specs | Engine choice, Δv calculation | NASA published specification |
| NERVA mass, some component masses | Mission Forge | Mass budget | Game estimate |
| Per-destination Δv and transit days | Rounded from public mission figures | Mission planning | Game estimate (simplified) |
| Tsiolkovsky rocket equation | Physics | `analyze()` in `src/lib/mission-sim.ts` | Physics calculation |
| Inverse-square solar flux | Physics | Solar power estimate | Physics calculation |
| Route multipliers (safe / fast / science / risky) | Mission Forge | Route choice | Game estimate |
| Readiness score, science score, hazard penalties | Mission Forge | Launch check, outcomes | Game mechanic |
| Mission hazards, damage, rescue kits | Mission Forge | Flight / rescue gameplay | Game mechanic |
| Spacecraft 3D models | Built in code (Three.js primitives) | Hangar, flight | In-house asset |
| Outer-planet 3D textures in universe view | Generated in code | Universe scene | Procedural content |
| Dr. Ayesha mentor voice | Browser SpeechSynthesis | Narration | Browser feature |

## Inactive / future integrations
The server proxy (`src/lib/nasa.functions.ts`) also supports **NASA EPIC**, **Mars Rover Photos**, **JPL SBDB** and **JPL Sentry**. These are **not connected to any screen** today and should not be considered live features.

## Fallback
All NASA/JPL calls go through one server function (`getNasa`) with a database cache. If a source fails, the UI shows clearly labeled **DEMO DATA** instead of presenting it as a NASA observation.
