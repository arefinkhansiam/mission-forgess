# Mission Forge

An educational space mission design game: build a spacecraft, plan a mission, launch it in 3D, and see whether the physics works.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Build](https://img.shields.io/badge/build-vite%20build%20passing-brightgreen.svg)](docs/development.md)
[![Live demo](https://img.shields.io/badge/live%20demo-mission--forge--replicant.lovable.app-0b3d91.svg)](https://mission-forge-replicant.lovable.app)

NASA Space Apps Challenge 2026 — Space Mission Design Game — Team Ghost Hunter.

## Judge Quick Start

**Live:** https://mission-forge-replicant.lovable.app (best in landscape on phones)

**60-second demo path**
1. Home: tap start, pick **Mars**, pick an objective.
2. Choose a route and watch the route preview.
3. Accept the budget, fuel, power, comms and instrument defaults, then review the overview.
4. Pick a craft preset, look around the 3D hangar, open the readiness check.
5. Run the GO/NO-GO poll (uses live DONKI solar-flare data), launch.
6. In flight, switch cameras, use time warp, answer the hazard pop-up.
7. Watch the landing and read the mission report.

**Live NASA/JPL sources wired into screens:** APOD, NeoWs, DONKI FLR, NASA Image and Video Library, JPL Horizons (details below).

## The Problem
Space mission design means trading off mass, fuel, power, route and risk. Students rarely get to see how these choices affect each other.

## Our Solution
Mission Forge lets players make those tradeoffs themselves and see the result. The game loop:

**Design** (destination, objective) → **Build** (spacecraft in a 3D hangar) → **Plan** (route, fuel, power, comms, instruments) → **Launch** (readiness check, GO/NO-GO, 3D launch) → **Decide** (hazards in flight, rescue if needed) → **Analyze** (landing and mission report).

The rocket equation and solar flux decide whether a design can reach its target.

## Features
- Destinations: Moon, Mars, Ceres, Jupiter, Saturn
- Mission brief and objectives
- Route choice and route preview
- Budget, fuel, power, communications and instrument decisions
- Mission overview
- Spacecraft presets and 3D hangar (engines, tanks, solar wings, RTGs, battery, antennas, shield, instruments)
- Propulsion choice: chemical, ion, nuclear
- Readiness check (any score allows launch)
- GO/NO-GO poll with live DONKI solar-flare data
- 3D launch sequence
- 3D flight with orbit, chase and cockpit cameras and time warp
- Hazard encounters with player decisions
- Docking / rescue mechanic
- Landing sequence and mission report
- NASA Data Demo (APOD, NeoWs, DONKI) and live JPL planet positions
- Learn Lab, Dr. Ayesha mentor with browser text-to-speech, six UI languages

## NASA and JPL Data Sources
All calls run on the server through one function (`getNasa`) with a database cache. If a source fails, the screen shows a **DEMO DATA** label.

| Source | Provides | Screen | Live / fallback |
|---|---|---|---|
| [NASA APOD](https://api.nasa.gov/) | Astronomy picture of the day | Home, NASA Data Demo | Live, DEMO DATA on failure |
| [NeoWs](https://api.nasa.gov/) | Today's near-Earth object approaches | Home, NASA Data Demo | Live, DEMO DATA on failure |
| [DONKI FLR](https://api.nasa.gov/) | Solar flares | Home feed, GO/NO-GO poll | Live, DEMO DATA on failure |
| [NASA Image and Video Library](https://images.nasa.gov) | Destination imagery | Mission brief | Live, DEMO DATA on failure |
| [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) | Planet position vectors | Route map positions panel | Live, DEMO DATA on failure |

EPIC, Mars Rover Photos, JPL SBDB and JPL Sentry exist in the server proxy but are **inactive**: no screen uses them.

Only DONKI affects gameplay (one GO/NO-GO station). The NASA Data Demo is kept separate from the simulation. Full provenance: [docs/data-sources.md](docs/data-sources.md).

## Not NASA Data
These are Mission Forge game mechanics or estimates:
- Readiness score, science score and mission scoring
- Route multipliers and simplified transfer times / Δv
- Component masses NASA does not publish (for example NERVA mass, tanks, rescue kits)
- Hazard events, damage values and rescue scenarios
- Most GO/NO-GO station thresholds (not NASA flight rules)
- 3D spacecraft models and procedural planet textures (built in code)

See [docs/gameplay.md](docs/gameplay.md), [docs/scientific-models.md](docs/scientific-models.md) and [docs/limitations.md](docs/limitations.md).

## Architecture
Two separate layers: the NASA/JPL data layer and the game simulation. See [docs/architecture.md](docs/architecture.md).

## Tech Stack
React 19, TanStack Start v1 (SSR and server functions), Vite, Three.js via React Three Fiber, Zustand, Tailwind CSS v4, i18next. Postgres backend used only for the NASA response cache. Built for an edge/Worker runtime.

## Screenshots
Placeholders until PNGs are uploaded. See [screenshots/README.md](screenshots/README.md).

| | | |
|---|---|---|
| ![Home screen with rotating Earth](screenshots/home.png) | ![Mission brief with destination imagery](screenshots/brief.png) | ![3D spacecraft builder in the hangar](screenshots/builder.png) |
| ![Route choice and route preview](screenshots/route.png) | ![3D launch sequence](screenshots/launch.png) | ![Mission hazard decision pop-up](screenshots/hazard.png) |
| ![Landing sequence](screenshots/landing.png) | ![Mission report](screenshots/report.png) | ![NASA Data Demo and data sources](screenshots/data-sources.png) |

## Local Setup
Requirements: Node.js 20+ and npm (a `bun.lock` is also included).

```bash
git clone https://github.com/arefinkhansiam/mission-forges.git
cd mission-forges
npm install
cp .env.example .env
npm run dev        # development
npm run build      # production build
npm run preview    # preview the build
npm run lint       # lint
```

More: [docs/development.md](docs/development.md). Contributing: [CONTRIBUTING.md](CONTRIBUTING.md).

## Environment Variables
| Name | Where | Purpose |
|---|---|---|
| `NASA_API_KEY` | Server only | NASA API key; falls back to NASA's public `DEMO_KEY` if unset |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` | Browser (publishable) | Backend client |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | Server | Backend client during SSR |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only, secret | NASA response cache |

The NASA key is not a `VITE_` variable, so it never reaches the browser. Never commit a real `.env`.

## AI Usage
AI-assisted tools were used during the development of Mission Forge for implementation, debugging, problem-solving, documentation, and other tasks documented in [AI_USE.md](./AI_USE.md).

The team reviewed and integrated AI-assisted output and remained responsible for final project decisions.

Full disclosure: [View AI Usage & Prompt Disclosure](./AI_USE.md) · Short form: [docs/nasa-ai-disclosure.md](docs/nasa-ai-disclosure.md)

## Team and Roles
Team Ghost Hunter

| Name | Role | GitHub |
|---|---|---|
| Arefin Khan Siam | Team Lead | [@arefinkhansiam](https://github.com/arefinkhansiam) |
| Melita Mehzabin Neha | _add role_ | _add link_ |
| Angkon Roy | _add role_ | _add link_ |
| Rizvi Hasan | _add role_ | _add link_ |
| Taspiha Tabassum | _add role_ | _add link_ |

## Attribution
Mission Forge is an independent project created for the NASA Space Apps Challenge. NASA and JPL data/services are used where indicated. This project is not an official NASA product and is not endorsed by NASA.

NASA imagery and third-party credits: [docs/credits.md](docs/credits.md).

## License
Source code: [MIT](LICENSE). NASA/JPL content is excluded from this license.
