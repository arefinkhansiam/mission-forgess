// Verified reference data. Every value lists its NASA source.
// Planet values: NASA NSSDCA Planetary Fact Sheet. Mean longitudes (J2000): NASA/JPL "Approximate Positions of the Planets".
export const SOURCES = {
  factsheet: "NASA NSSDCA Planetary Fact Sheet — nssdc.gsfc.nasa.gov/planetary/factsheet",
  jplElements: "NASA/JPL Approximate Positions of the Planets — ssd.jpl.nasa.gov/planets/approx_pos.html",
  orion: "NASA Orion Reference Guide — nasa.gov/orion",
  sls: "NASA Space Launch System Reference Guide — nasa.gov/sls",
  rl10: "NASA Glenn / Aerojet Rocketdyne RL10 specifications",
  nstar: "NASA Dawn mission — NSTAR ion propulsion (jpl.nasa.gov/missions/dawn)",
  nerva: "NASA Glenn — NERVA nuclear thermal rocket program history",
  mmrtg: "NASA Radioisotope Power Systems — MMRTG fact sheet (rps.nasa.gov)",
  iss: "NASA International Space Station Facts and Figures",
  hubble: "NASA Hubble Space Telescope — Quick Facts",
  jwst: "NASA James Webb Space Telescope — webb.nasa.gov",
  ceres: "NASA Dawn mission / Ceres in Depth — science.nasa.gov",
};

export type BodyId = "Sun" | "Mercury" | "Venus" | "Earth" | "Moon" | "Mars" | "Ceres" | "Jupiter" | "Saturn" | "Uranus" | "Neptune";

export type Body = {
  id: BodyId; kind: string; diameterKm: number; au: number; periodDays: number; gravity: number;
  L0: number | null; color: string; color2: string; why: string; atmosphere: "thick" | "thin" | "none" | "gas";
};

// au = mean distance from Sun (Moon: from Earth, in AU). L0 = mean longitude at J2000 (deg).
export const BODIES: Record<BodyId, Body> = {
  Sun: { id: "Sun", kind: "G-type main-sequence star", diameterKm: 1392700, au: 0, periodDays: 0, gravity: 274, L0: null, color: "#ffd27a", color2: "#ff9d2e", why: "Source of solar power — array output falls with the square of distance.", atmosphere: "gas" },
  Mercury: { id: "Mercury", kind: "Terrestrial planet", diameterKm: 4879, au: 0.387, periodDays: 88.0, gravity: 3.7, L0: 252.25, color: "#9c9189", color2: "#6f6660", why: "Deep in the Sun's gravity well — reaching it costs more Δv than Jupiter.", atmosphere: "none" },
  Venus: { id: "Venus", kind: "Terrestrial planet", diameterKm: 12104, au: 0.723, periodDays: 224.7, gravity: 8.9, L0: 181.98, color: "#e3c48d", color2: "#b58f55", why: "Common gravity-assist target for inner-system trajectories.", atmosphere: "thick" },
  Earth: { id: "Earth", kind: "Terrestrial planet — home", diameterKm: 12756, au: 1.0, periodDays: 365.2, gravity: 9.8, L0: 100.46, color: "#2f6fd6", color2: "#3a8f4a", why: "Mission control: every command and signal starts here.", atmosphere: "thick" },
  Moon: { id: "Moon", kind: "Natural satellite of Earth", diameterKm: 3475, au: 0.00257, periodDays: 27.3, gravity: 1.6, L0: null, color: "#b9b6b0", color2: "#77736d", why: "Artemis destination and proving ground for deep-space systems.", atmosphere: "none" },
  Mars: { id: "Mars", kind: "Terrestrial planet", diameterKm: 6792, au: 1.524, periodDays: 687.0, gravity: 3.7, L0: 355.45, color: "#c1502e", color2: "#8a3a22", why: "Thin atmosphere: parachutes help but cannot land you alone.", atmosphere: "thin" },
  Ceres: { id: "Ceres", kind: "Dwarf planet — main asteroid belt", diameterKm: 939, au: 2.77, periodDays: 1682, gravity: 0.28, L0: null, color: "#8d8a86", color2: "#5f5c59", why: "Visited by NASA's ion-powered Dawn spacecraft (2015–2018).", atmosphere: "none" },
  Jupiter: { id: "Jupiter", kind: "Gas giant", diameterKm: 142984, au: 5.204, periodDays: 4331, gravity: 23.1, L0: 34.4, color: "#d8b48a", color2: "#a26f47", why: "Sunlight is ~4% of Earth's — Juno needs huge solar arrays.", atmosphere: "gas" },
  Saturn: { id: "Saturn", kind: "Gas giant", diameterKm: 120536, au: 9.573, periodDays: 10747, gravity: 9.0, L0: 49.94, color: "#e6d09a", color2: "#b39a62", why: "Cassini relied on RTG power this far from the Sun.", atmosphere: "gas" },
  Uranus: { id: "Uranus", kind: "Ice giant", diameterKm: 51118, au: 19.165, periodDays: 30589, gravity: 8.7, L0: 313.23, color: "#9fd8e0", color2: "#6fb3c0", why: "Visited once, by Voyager 2 in 1986.", atmosphere: "gas" },
  Neptune: { id: "Neptune", kind: "Ice giant", diameterKm: 49528, au: 30.178, periodDays: 59800, gravity: 11.0, L0: 304.88, color: "#3f64d8", color2: "#2a44a0", why: "Signals take over 4 hours to reach Earth from here.", atmosphere: "gas" },
};

export const PLANET_ORDER: BodyId[] = ["Mercury", "Venus", "Earth", "Mars", "Ceres", "Jupiter", "Saturn", "Uranus", "Neptune"];

export const SPACECRAFT_OBJECTS = [
  { id: "ISS", kind: "Crewed orbital laboratory", detail: "~420,000 kg, orbits ~400 km above Earth", why: "Humanity's permanent outpost; debris-avoidance maneuvers are routine.", source: SOURCES.iss },
  { id: "Hubble", kind: "Space telescope", detail: "11,110 kg, orbits ~540 km above Earth", why: "Serviced five times by astronauts — proof that in-space repair works.", source: SOURCES.hubble },
  { id: "JWST", kind: "Infrared space telescope", detail: "Orbits Sun–Earth L2, ~1.5 million km away", why: "Operates at L2 where Earth and Sun stay behind its sunshield.", source: SOURCES.jwst },
];

export const AU_KM = 149_597_870.7;
export const LIGHT_KM_S = 299_792.458;

const J2000 = Date.UTC(2000, 0, 1, 12);
export const daysSinceJ2000 = (ms: number) => (ms - J2000) / 86_400_000;

/** Heliocentric angle (rad) using circular orbit + mean longitude (JPL approximate elements). */
export function bodyAngle(id: BodyId, days: number) {
  const b = BODIES[id];
  if (!b.periodDays) return 0;
  const L0 = b.L0 ?? 0;
  return ((L0 + (360 * days) / b.periodDays) * Math.PI) / 180;
}

/** Visual radius: distances compressed with a square-root scale for viewing. Real AU kept for all calculations. */
export const visRadius = (au: number) => 6 * Math.sqrt(au);
export const visSize = (id: BodyId) => (id === "Sun" ? 1.4 : 0.1 + 0.2 * Math.pow(BODIES[id].diameterKm / 12756, 0.45));

/** Real distance (km) between two heliocentric positions given in AU + angle. */
export function distanceKm(au1: number, a1: number, au2: number, a2: number) {
  const dx = au1 * Math.cos(a1) - au2 * Math.cos(a2), dy = au1 * Math.sin(a1) - au2 * Math.sin(a2);
  return Math.hypot(dx, dy) * AU_KM;
}
