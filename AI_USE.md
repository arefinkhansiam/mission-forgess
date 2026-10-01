# Mission Forge — AI Usage Disclosure

Mission Forge is an independent NASA Space Apps Challenge 2026 project by Team Ghost Hunter. This file documents AI assistance honestly. Items the repository cannot prove are marked **[TEAM TO CONFIRM]**.

## 1. AI Tools Used

| Tool | Status | Purpose | Work assisted | How output was used | Reviewed by team |
|---|---|---|---|---|---|
| Lovable (AI app builder) | Verified — this project was built in Lovable | Application development | Code generation, UI implementation, debugging, 3D scenes, NASA/JPL data-layer code, translations, repository documentation | Generated code and docs were run in the preview, then kept, changed, or discarded on team direction | Yes — team directed every change and tested in the preview |
| Claude | [TEAM TO CONFIRM] | Pitch script and documentation review | [TEAM TO CONFIRM] | [TEAM TO CONFIRM] | [TEAM TO CONFIRM] |
| AI voiceover tool | [TEAM TO CONFIRM] | [TEAM TO CONFIRM] | [TEAM TO CONFIRM] | [TEAM TO CONFIRM] | [TEAM TO CONFIRM] |
| AI image / scene generation tool | [TEAM TO CONFIRM] | [TEAM TO CONFIRM] | [TEAM TO CONFIRM] | [TEAM TO CONFIRM] | [TEAM TO CONFIRM] |
| Any other AI tool (e.g. Antigravity, ChatGPT, Gemini) | [TEAM TO CONFIRM] | [TEAM TO CONFIRM] | [TEAM TO CONFIRM] | [TEAM TO CONFIRM] | [TEAM TO CONFIRM] |

## 2. AI Prompts Used

### Verbatim prompts

[TEAM: paste real prompts from Lovable chat history here, with date]

### Representative prompts (NOT verbatim)

Not all historical AI prompts were preserved during development. The examples below are representative prompts describing the major categories of AI-assisted work performed on Mission Forge and are not presented as a complete verbatim transcript.

| AI Tool | Representative Prompt | Purpose / Reasoning | Output Used For |
|---|---|---|---|
| Lovable | "Build and modify Mission Forge as an interactive space mission design game for the NASA Space Apps Challenge Space Mission Design Game challenge. Preserve the existing architecture and implement the requested mission-planning and simulation functionality." | Application implementation | Mission store, planning screens, hangar, flight, landing, rescue, report |
| Lovable | "Improve the Mission Forge interface so students can understand mission planning, spacecraft configuration, launch, hazards, landing, and mission reports while preserving existing functionality." | Make complex concepts easier to understand | HUD screens, landscape game frame, mentor panel |
| Lovable | "Integrate the relevant NASA/JPL data source into the Mission Forge data layer. Clearly distinguish live NASA/JPL data from fallback/demo data and never present game-generated values as NASA observations." | External data integration with provenance | `getNasa` server function, cache, DEMO DATA labels |
| Lovable | "Implement the Tsiolkovsky rocket equation in the Mission Forge mission simulation and clearly distinguish scientific calculations from simplified game mechanics." | Scientific model | `analyze()` in `src/lib/mission-sim.ts` |
| Lovable | "Inspect the current implementation for errors, identify the cause, and fix the issue without breaking existing Mission Forge functionality." | Debugging | Bug fixes, layout fixes |
| Lovable | "Review the Mission Forge repository and create accurate documentation describing architecture, NASA/JPL data sources, scientific models, gameplay mechanics, setup instructions, and attribution." | Documentation | README, `docs/`, this file |

## 3. Why AI Was Used

- Speed up prototyping within the hackathon timeline
- Handle repetitive implementation (screens, translations, styling)
- Help find and fix bugs
- Explore UI/UX layouts
- Organize technical documentation
- Turn the team's product ideas into working code

AI was a development assistant. It was **not** the authority for NASA data or science values.

## 4. Data and Information Used With AI

**Public / project information given to Lovable:** Mission Forge source code, the team's written requirements and screen-flow descriptions, UI reference images supplied by the team, public NASA/JPL API endpoint documentation, and project architecture.

**Sensitive information:** [TEAM TO CONFIRM] — the team must confirm whether any secret was ever shared with an AI tool. In the repository, the NASA key is read only on the server from an environment variable; no secret values are committed (`.env.example` holds placeholders).

**AI vs. NASA data:** AI helped write code that fetches NASA/JPL data at runtime. No AI model analyzes or alters live NASA data inside the running app.

## 5. Human Team Contribution

The team decided: the project concept and challenge interpretation; the gameplay loop (destination → objective → route → resources → craft → readiness → GO/NO-GO → launch → flight → hazards → landing → rescue → report); spacecraft configuration and decision systems; the rescue-mission idea; which NASA/JPL sources to use; the rule that real data and game mechanics must be labeled separately; visual direction; testing; final feature choices; integration; and the final submission.

## 6. Human Review and Validation

AI output was reviewed, tested in the live preview, changed, or rejected before being kept. AI output was not automatically treated as authoritative. NASA/JPL values and scientific claims are checked against NASA sources where applicable (see `docs/data-sources.md`). Game mechanics are reviewed as Mission Forge's own rules and labeled "game estimate".

## 7. AI, NASA Data, and Simulation Separation

Current code (today):

```text
NASA APOD / NeoWs / DONKI FLR / Image Library / JPL Horizons
        |
getNasa server function (src/lib/nasa.functions.ts) + nasa_cache table
        |  (labeled DEMO DATA fallback on failure)
        v
NASA Data Demo (home feed, mission brief imagery, live positions, GO/NO-GO space weather)
```

```text
Human-designed gameplay (src/stores/mission-store.ts)
   -> Scientific calculations (Tsiolkovsky, inverse-square flux in src/lib/mission-sim.ts)
   -> Mission Forge simulation (analyze(), readiness, hazards)
   -> Player decisions -> Mission outcome -> Mission report
```

Only DONKI flare data affects gameplay (the GO/NO-GO poll). EPIC, Mars Rover Photos, JPL SBDB and JPL Sentry exist in the proxy but are unused.

Categories: **NASA/JPL live data** (APIs above); **NASA-published reference values** (NSSDCA planet facts, engine Isp/thrust); **physics calculations** (equations); **game estimates** (masses, route multipliers, Δv simplifications); **gameplay mechanics** (readiness, scoring, damage, rescue); **AI-assisted development** (the code itself). AI assistance does not turn gameplay values into NASA data.

Update this section after data-integration changes.

## 8. AI-Generated Content and Assets

| Item | Status |
|---|---|
| Code | AI-assisted (Lovable), team-directed and reviewed |
| Documentation | AI-assisted (Lovable), team-reviewed |
| UI text and translations (6 languages) | AI-assisted (Lovable) |
| NASA images (Blue Marble, planet portraits) | NASA assets — not AI-generated |
| 3D spacecraft, launch pad, procedural planet textures | Built in code (Three.js primitives / canvas) — not AI image generation |
| `src/assets/mission-launch.jpg` | Removed (unused by any screen); origin was unconfirmed |
| 24 promo scenes | [TEAM TO CONFIRM: AI-generated? tool?] |
| Voiceover | [TEAM TO CONFIRM: AI-generated? tool?] |
| Team photos | [TEAM TO CONFIRM: AI-generated? tool?] |
| Logo | [TEAM TO CONFIRM: AI-generated? tool?] |
| Dr. Ayesha text-to-speech | [TEAM TO CONFIRM: AI-generated? tool?] (code uses the browser's built-in speech synthesis) |

## 9. Summary Table

| AI Tool | Task | Prompt | Data/Context Provided | Why AI Was Used | Human Contribution |
|---|---|---|---|---|---|
| Lovable | App code, UI, 3D, data layer | Representative prompt — not verbatim (Section 2) | Source code, requirements, reference images, public API docs | Speed and implementation help | Concept, design decisions, testing, acceptance |
| Lovable | Debugging | Representative prompt — not verbatim | Source code, error logs | Faster fixes | Reported issues, verified fixes |
| Lovable | Documentation | Representative prompt — not verbatim | Repository contents | Organize docs | Reviewed accuracy |
| Claude | Pitch script, doc review | [TEAM TO CONFIRM] | [TEAM TO CONFIRM] | [TEAM TO CONFIRM] | [TEAM TO CONFIRM] |

A short version for the submission form is in [docs/nasa-ai-disclosure.md](docs/nasa-ai-disclosure.md).
