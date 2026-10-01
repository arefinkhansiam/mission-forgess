# Mission Forge interactive experience

## Goal
Recreate the referenced Mission Forge interface as a connected cinematic sci-fi mission simulator. Each reference state becomes a real screen with working controls, shared mission state, responsive HUD layouts, and rendered visual scenes rather than a collage or embedded screenshot.

## Screens and flow
1. **Main menu** — brand mark, ambient space scene, New Mission, Continue, Tutorial, Settings, Quit.
2. **Mission selection** — Moon, Mars, Asteroid, Jupiter, and Black Hole cards with risk and duration details.
3. **Route planning** — orbital map, route alternatives, risk/cost comparison, and active route selection.
4. **Spacecraft builder** — selectable engine/system options, spacecraft view, live mass/fuel/power/crew stats.
5. **Mission check** — readiness bars, warnings, and launch eligibility derived from the build choices.
6. **Launch sequence** — staged countdown/checklist and animated liftoff scene.
7. **Earth mission control** — trajectory view, system telemetry, mission timing, and switch-to-cockpit control.
8. **Cockpit mode** — immersive forward view, navigation instruments, support telemetry, and command buttons.
9. **Explore / obstacle** — asteroid-field navigation event with selectable actions and consequences.
10. **Failure state** — communication/power/thermal diagnosis leading into rescue planning.
11. **Rescue planning** — required instruments, craft stats, route choice, and plan confirmation.
12. **Rendezvous and repair** — staged approach/docking/repair sequence with visible progress.
13. **Landing sequence** — atmospheric entry checklist, landing-zone selection, and descent progression.
14. **Mission report / redesign** — performance score, category metrics, lessons learned, replay and redesign paths.

## Visual implementation
- Match the references’ near-black navy surfaces, cyan edge lighting, thin luminous borders, compact typography, tight HUD density, and selective green/amber/red status colors.
- Build a reusable visual system for panels, tabs, icon controls, meters, chips, warnings, navigation rails, telemetry tables, and progress states.
- Use generated cinematic space imagery for large visual environments and focused 3D/WebGL scenes for orbital maps, ship inspection, and mission movement where interaction adds value.
- Keep motion restrained and functional: radar sweeps, telemetry drift, route pulses, staged progress, launch vibration, and status transitions.
- Preserve desktop composition while converting dense multi-column layouts into readable stacked/mobile HUD views on small screens.

## Functionality and state
- Maintain selected mission, route, ship configuration, readiness, mission stage, encounter choice, rescue loadout, landing progress, and report score across the full flow.
- Make Back, Next, Launch, Continue, repair, landing, replay, and redesign controls functional.
- Calculate spacecraft stats, risk warnings, readiness, and final score from player choices so screens respond to decisions.
- Save the current run locally so Continue works after refresh; no account or shared data is required.

## Technical approach
- Use TanStack routes for every major screen and type-safe links for normal navigation.
- Use React state plus a small persistent mission store shared across routes.
- Use React Three Fiber for interactive 3D areas, with DOM overlays for HUD text and controls.
- Source or generate cohesive spacecraft/planet imagery and never include the uploaded reference boards in the app itself.
- Add unique page metadata for every screen.

## Validation
- Verify the full route sequence and all primary controls in the browser.
- Check desktop and the current 390×844 mobile viewport for clipping, overlap, and legibility.
- Confirm 3D areas render visibly, animate, and produce no console or missing-asset errors.
