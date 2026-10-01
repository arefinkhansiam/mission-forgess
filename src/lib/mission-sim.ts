// Deterministic engineering model. Physics: Tsiolkovsky rocket equation, inverse-square solar flux.
// Component specs cite NASA sources (see nasa-data.ts). Values marked "game estimate" are simplifications.
import { BODIES, SOURCES, type BodyId } from "./nasa-data";

export type EngineId = "chemical" | "ion" | "nuclear";
export type MissionId = "Moon" | "Mars" | "Venus" | "Mercury" | "Ceres" | "Jupiter" | "Saturn";
export type RouteId = "safe" | "fast" | "science" | "risky";
export type EncounterChoice = "shield" | "boost" | "reroute";
export type Instrument = "camera" | "spectrometer" | "radiation";

export const G0 = 9.80665;
export const DRY_BASE = 6000; // kg crew/avionics module — game estimate
export const TANK_PROP = 9000; // kg propellant per tank — game estimate
export const TANK_DRY = 900;
export const WING_MASS = 190;
export const WING_KW = 2.75; // kW per wing at 1 AU (Orion ESM: 4 wings ≈ 11 kW)
export const RTG_KW = 0.11; // MMRTG ≈ 110 W, 45 kg
export const RTG_MASS = 45;
export const LAUNCH_LIMIT = 95000; // SLS Block 1: 95 t to low Earth orbit
export const BASE_DRAW = 0.35; // kW avionics + life support baseline — game estimate

export const ENGINES: Record<EngineId, { name: string; isp: number; mass: number; kw: number; thrust: string; note: string; source: string }> = {
  chemical: { name: "RL10 cryogenic", isp: 462, mass: 301, kw: 0.05, thrust: "110 kN", note: "High thrust, burns propellant fast", source: SOURCES.rl10 },
  ion: { name: "NSTAR ion", isp: 3100, mass: 50, kw: 2.3, thrust: "0.09 N", note: "10× more efficient, needs 2.3 kW each, very slow", source: SOURCES.nstar },
  nuclear: { name: "NERVA nuclear thermal", isp: 841, mass: 10000, kw: 0.5, thrust: "333 kN", note: "Efficient and powerful, but very heavy", source: SOURCES.nerva },
};

export const INSTRUMENTS: Record<Instrument, { name: string; mass: number; kw: number; science: number }> = {
  camera: { name: "Imaging camera", mass: 150, kw: 0.05, science: 35 },
  spectrometer: { name: "Spectrometer", mass: 320, kw: 0.1, science: 45 },
  radiation: { name: "Radiation monitor", mass: 90, kw: 0.02, science: 15 },
};

// Δv from low Earth orbit to target orbit — approximate values from NASA/JPL Δv budgets.
export const MISSIONS: Record<MissionId, { body: BodyId; dv: number; days: number; hazard: number; title: string; brief: string }> = {
  Moon: { body: "Moon", dv: 4.0, days: 3, hazard: 0.1, title: "Lunar Reconnaissance", brief: "Reach lunar orbit and land near the south pole." },
  Venus: { body: "Venus", dv: 3.8, days: 146, hazard: 0.28, title: "Venus Atmospheric Probe", brief: "Probe the dense runaway greenhouse atmosphere and survey the volcanic surface." },
  Mars: { body: "Mars", dv: 5.7, days: 259, hazard: 0.25, title: "Mars Science Mission", brief: "Hohmann transfer to Mars, study the atmosphere and surface." },
  Mercury: { body: "Mercury", dv: 11.2, days: 105, hazard: 0.48, title: "Mercury Hermean Explorer", brief: "Brave extreme solar flux and radiation to map Mercury's ancient craters and magnetic field." },
  Ceres: { body: "Ceres", dv: 9.5, days: 1300, hazard: 0.45, title: "Asteroid Belt Survey", brief: "Follow Dawn to the dwarf planet Ceres through the main belt." },
  Jupiter: { body: "Jupiter", dv: 6.9, days: 997, hazard: 0.4, title: "Jupiter Atmospheric Probe", brief: "Deliver a probe into Jupiter's atmosphere, like Galileo in 1995." },
  Saturn: { body: "Saturn", dv: 7.3, days: 2200, hazard: 0.35, title: "Saturn System Flyby", brief: "Cross the outer system and drop a probe into Saturn." },
};

export const ROUTES: Record<RouteId, { name: string; dv: number; time: number; hazard: number; science: number; note: string }> = {
  safe: { name: "Hohmann transfer", dv: 1.05, time: 1.0, hazard: 0.6, science: 0.8, note: "Minimum-energy ellipse, predictable" },
  fast: { name: "Fast transfer", dv: 1.3, time: 0.65, hazard: 0.9, science: 0.8, note: "Burns more Δv, less time exposed" },
  science: { name: "Science flyby", dv: 1.12, time: 1.15, hazard: 1.2, science: 1.4, note: "Detours past extra targets" },
  risky: { name: "Gravity assist", dv: 0.88, time: 1.1, hazard: 1.7, science: 1.1, note: "Saves Δv, tight navigation" },
};

export type Design = {
  mission: MissionId; route: RouteId; engine: EngineId; engines: number; tanks: number; wings: number;
  rtgs: number; antennas: number; shield: boolean; battery: boolean; instruments: Instrument[]; fuel: number;
};

export function analyze(d: Design) {
  const e = ENGINES[d.engine], m = MISSIONS[d.mission], r = ROUTES[d.route];
  const instMass = d.instruments.reduce((s, k) => s + INSTRUMENTS[k].mass, 0);
  const dry = DRY_BASE + e.mass * d.engines + d.tanks * TANK_DRY + d.wings * WING_MASS + d.rtgs * RTG_MASS + d.antennas * 120 + (d.shield ? 1300 : 0) + (d.battery ? 600 : 0) + instMass;
  const propellant = (d.tanks * TANK_PROP * d.fuel) / 100;
  const wet = dry + propellant;
  const dv = (e.isp * G0 * Math.log(wet / dry)) / 1000;
  const required = m.dv * r.dv;
  const dvMargin = (dv - required) / required;
  const au = d.mission === "Moon" ? 1 : BODIES[m.body].au;
  const avg = (1 + au) / 2; // average heliocentric distance over transfer
  const solarFactor = 1 / (avg * avg);
  const generation = +(d.wings * WING_KW * solarFactor + d.rtgs * RTG_KW).toFixed(2);
  const draw = +(BASE_DRAW + e.kw * d.engines + d.antennas * 0.08 + d.instruments.reduce((s, k) => s + INSTRUMENTS[k].kw, 0)).toFixed(2);
  const powerMargin = (generation - draw) / draw;
  const speedF = d.engine === "ion" ? 1.35 : d.engine === "nuclear" ? 0.8 : 1;
  const days = Math.max(1, Math.round(m.days * r.time * speedF));
  const hazard = Math.min(0.95, m.hazard * r.hazard);
  const science = Math.round(Math.min(100, d.instruments.reduce((s, k) => s + INSTRUMENTS[k].science, 0) * r.science));
  const issues: { tone: "danger" | "warning"; text: string }[] = [];
  if (wet > LAUNCH_LIMIT) issues.push({ tone: "danger", text: `Too heavy for SLS: ${fmt(wet)} kg > ${fmt(LAUNCH_LIMIT)} kg to orbit.` });
  if (dvMargin < 0) issues.push({ tone: "danger", text: `Not enough Δv: ${dv.toFixed(2)} of ${required.toFixed(2)} km/s needed.` });
  else if (dvMargin < 0.1) issues.push({ tone: "warning", text: "Δv margin under 10% — detours could strand you." });
  if (powerMargin < 0) issues.push({ tone: "danger", text: `Power deficit: ${generation} kW generated, ${draw} kW needed${au > 2 ? " — sunlight is weak out there" : ""}.` });
  else if (powerMargin < 0.15) issues.push({ tone: "warning", text: "Thin power margin." });
  if (hazard > 0.3 && !d.shield) issues.push({ tone: "warning", text: "High debris hazard and no Whipple shield." });
  if (d.antennas < 2) issues.push({ tone: "warning", text: "Single antenna — no communications redundancy." });
  if (science === 0) issues.push({ tone: "warning", text: "No instruments — the mission returns no science." });
  const canLaunch = !issues.some((i) => i.tone === "danger");
  const readiness = Math.max(1, Math.min(100, Math.round(70 + Math.min(dvMargin, 0.25) * 80 + Math.min(powerMargin, 0.5) * 20 - issues.length * 8 - (canLaunch ? 0 : 30))));
  return { dry, propellant, wet, dv, required, dvMargin, generation, draw, powerMargin, days, hazard, science, issues, canLaunch, readiness, solarFactor };
}

export type Outcome = { hull: number; comms: number; power: number; dvLeft: number; failed: boolean; causes: string[]; log: string; science: number; choice: EncounterChoice };

export function resolveEncounter(d: Design, choice: EncounterChoice, dvSpent: number): Outcome {
  const a = analyze(d);
  let hull = 100, dvLeft = a.dv - a.required - dvSpent, science = a.science, log = "";
  if (choice === "shield") {
    const dmg = Math.round(a.hazard * (d.shield ? 35 : 110));
    hull -= dmg;
    log = d.shield ? `Whipple shield absorbed the impacts (hull −${dmg}%).` : `No shield: debris punctured the hull (−${dmg}%).`;
  } else if (choice === "boost") {
    const dmg = Math.round(a.hazard * 40);
    dvLeft -= 1.2; hull -= dmg;
    log = `1.2 km/s burn shortened exposure. Hull −${dmg}%.`;
  } else {
    dvLeft -= 0.6; science = Math.round(science * 0.85); hull -= 5;
    log = "Reroute avoided the field: −0.6 km/s and fewer science targets.";
  }
  const hit = hull < 75;
  const comms = hit && d.antennas < 2 ? 5 : hit ? 70 : 100;
  let power = Math.round(Math.max(0, Math.min(100, 70 + a.powerMargin * 60)));
  if (hit) power -= d.battery ? 10 : 35;
  const causes: string[] = [];
  if (hull < 45) causes.push("hull");
  if (comms < 20) causes.push("comms");
  if (power < 30) causes.push("power");
  if (dvLeft < 0) causes.push("fuel");
  return { hull: Math.max(0, hull), comms, power: Math.max(0, power), dvLeft, failed: causes.length > 0, causes, log, science, choice };
}

export const CAUSE_TEXT: Record<string, string> = { hull: "Hull breach", comms: "Communication lost", power: "Power critical", fuel: "Out of Δv — stranded" };
export const ROOT_CAUSE: Record<string, string> = { hull: "Shielding insufficient for the route hazard", comms: "Single antenna with no backup", power: "Thin power margin and no battery reserve", fuel: "Δv margin too small for the maneuver" };

export const RESCUE_KITS: Record<string, { name: string; mass: number }> = {
  comms: { name: "Communication repair kit", mass: 180 },
  power: { name: "Power module", mass: 900 },
  fuel: { name: "Propellant transfer tank", mass: 4000 },
  hull: { name: "Hull patch + robotic arm", mass: 1200 },
};

export function rescuePlan(kit: string[], mission: MissionId) {
  const payload = kit.reduce((a, k) => a + (RESCUE_KITS[k]?.mass ?? 0), 0);
  const dry = 5000 + payload, prop = 30000;
  const dv = (462 * G0 * Math.log((dry + prop) / dry)) / 1000;
  const required = Math.min(MISSIONS[mission].dv * 0.8, 6.2);
  return { payload, wet: dry + prop, dv, required, ok: dv >= required };
}

export function landingStages(body: BodyId) {
  const atm = BODIES[body].atmosphere;
  if (atm === "gas") return ["Probe release", "Atmospheric entry", "Heat shield jettison", "Parachute deploy", "Data relay"];
  if (atm === "none") return ["Deorbit burn", "Braking burn", "Pitch-over", "Terminal descent", "Touchdown"];
  return ["Deorbit burn", "Atmospheric entry", "Parachute deploy", "Heat shield jettison", "Powered descent", "Touchdown"];
}

export function finalScore(d: Design, o: Outcome | null, rescued: boolean, landingErrors: number) {
  const a = analyze(d);
  const safety = o ? Math.round((o.hull + o.comms + o.power) / 3) : 95;
  const resources = Math.max(0, Math.min(100, Math.round(50 + (o ? o.dvLeft / a.required : a.dvMargin) * 250)));
  const landing = Math.max(0, 100 - landingErrors * 25);
  const science = o ? o.science : a.science;
  const objective = o?.failed ? (rescued ? 70 : 20) : 100;
  const total = Math.round(objective * 0.3 + science * 0.2 + safety * 0.2 + resources * 0.15 + landing * 0.15);
  return { total, objective, science, safety, resources, landing };
}

export const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
