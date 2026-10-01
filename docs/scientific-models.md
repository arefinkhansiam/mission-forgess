# Scientific Models

Mission Forge is an educational simulation. The models below are used for the game's mission simulation (`src/lib/mission-sim.ts`), not for real mission planning.

## Tsiolkovsky Rocket Equation (physics)

Δv = Isp × g₀ × ln(m₀ / mf)

- `Isp` — specific impulse of the chosen engine (RL10 ≈ 462 s, NSTAR ≈ 3100 s, NERVA ≈ 841 s — published values)
- `g₀` = 9.80665 m/s²
- `m₀` — wet mass (structure + tanks + fuel + subsystems + instruments)
- `mf` — dry mass after propellant is used

The resulting available Δv is compared with the destination's required Δv to produce a margin.

## Inverse-Square Solar Flux (physics)

Solar power scales with 1 / r² where r is distance from the Sun in AU. Solar-wing output at the destination = output at 1 AU ÷ r². RTGs are not affected by distance.

## Route and transfer estimates (simplified)

- Required Δv per destination and transit days are **rounded, simplified game values** inspired by public mission figures, not trajectory solutions.
- Route multipliers (safe, fast, science, risky) are **game estimates**.
- The route map draws simplified curves. Planet positions come from JPL Horizons when live; otherwise they are labeled DEMO DATA.

## What is not physics
Readiness score, science score, hazard penalties, damage and rescue outcomes are **Mission Forge game mechanics**. See `gameplay.md`.
