# Limitations

Mission Forge is an educational game, not a mission-planning tool.

## Physics and data
- Δv per destination and transit times are rounded, simplified figures, not computed trajectories.
- Route multipliers (safe / fast / science / risky) are game values.
- Some component masses (NERVA engine, tanks, shield, battery, rescue kits) are game estimates.
- The 3D solar system uses compressed distances so planets fit on screen.
- The route map uses a simplified path, not a SPICE or Horizons trajectory. Horizons feeds only the positions panel.
- The launch sequence runs on a compressed timeline.

## NASA/JPL data
- Five sources are live on screens (APOD, NeoWs, DONKI FLR, Image Library, JPL Horizons). Only DONKI affects gameplay.
- EPIC, Mars Rover Photos, JPL SBDB and JPL Sentry are in the server proxy but unused.
- Without `NASA_API_KEY` the server uses NASA's rate-limited `DEMO_KEY`. Failures show DEMO DATA.

## Game mechanics
- Readiness, science score, hazards, damage and rescue are our own rules.
- Most GO/NO-GO station thresholds are not NASA flight rules.

## Technical
- Performance depends on the device GPU. No frame-rate or resolution is guaranteed.
- The mentor voice uses the browser's speech synthesis; voice quality and language support vary by browser.
- On phones in portrait, the game rotates into a landscape frame.
- Lint currently reports pre-existing formatting errors (Prettier); the production build passes.
