import * as THREE from "three";
import { BODIES, bodyAngle, daysSinceJ2000, distanceKm, visRadius, type BodyId, AU_KM } from "../../lib/nasa-data";
import { MISSIONS, type Design } from "../../lib/mission-sim";

// Per-frame mutable state shared between the 3D scene and the HUD (read by HUD at a few Hz).
export const rt = {
  days: daysSinceJ2000(Date.now()),
  departDays: 0,
  progress: 0,
  warp: 1,
  shipPos: new THREE.Vector3(),
  shipDir: new THREE.Vector3(1, 0, 0),
  shipAU: 1,
  shipAngle: 0,
  yaw: 0,
  pitch: 0,
  launchT: 0,
  scan: null as null | { id: BodyId; km: number },
  thrust: 0,
};

const MOON_VIS = 0.9;
export const moonAngle = (days: number) => (2 * Math.PI * days) / BODIES.Moon.periodDays;

export function bodyVisPos(id: BodyId, days: number, out = new THREE.Vector3()) {
  if (id === "Sun") return out.set(0, 0, 0);
  if (id === "Moon") {
    bodyVisPos("Earth", days, out);
    const a = moonAngle(days);
    return out.add(new THREE.Vector3(Math.cos(a) * MOON_VIS, 0, -Math.sin(a) * MOON_VIS));
  }
  const a = bodyAngle(id, days), r = visRadius(BODIES[id].au);
  return out.set(Math.cos(a) * r, 0, -Math.sin(a) * r);
}

/** Transfer path from Earth (at departure) to target body (at arrival), in view coordinates. */
export function pathPoint(d: Design, t: number, departDays: number, flightDays: number, out = new THREE.Vector3()) {
  const target = MISSIONS[d.mission].body;
  const arrive = departDays + flightDays;
  if (target === "Moon") {
    const e = bodyVisPos("Earth", departDays + flightDays * t);
    const a0 = moonAngle(arrive) - Math.PI * 0.9, a1 = moonAngle(arrive);
    const a = a0 + (a1 - a0) * t, r = 0.34 + (MOON_VIS - 0.34) * (1 - Math.cos(Math.PI * t)) / 2;
    return out.set(e.x + Math.cos(a) * r, Math.sin(Math.PI * t) * 0.08, e.z - Math.sin(a) * r);
  }
  const s = bodyAngle("Earth", departDays);
  let e = bodyAngle(target, arrive) - s;
  e = ((e % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  if (e < 0.5 * Math.PI) e += 2 * Math.PI;
  const r1 = 1, r2 = BODIES[target].au;
  let au = r1 + (r2 - r1) * (1 - Math.cos(Math.PI * t)) / 2;
  if (d.route === "risky") au *= 1 - 0.22 * Math.sin(Math.PI * t);
  if (d.route === "fast") au *= 1 + 0.12 * Math.sin(Math.PI * t);
  const ang = s + e * t, r = visRadius(au) + 0.45 * (1 - t);
  const y = d.route === "science" ? Math.sin(Math.PI * t) * 1.2 : Math.sin(Math.PI * t) * 0.25;
  return out.set(Math.cos(ang) * r, y, -Math.sin(ang) * r);
}

export function pathAU(d: Design, t: number, departDays: number, flightDays: number) {
  const target = MISSIONS[d.mission].body;
  if (target === "Moon") return { au: 1, angle: bodyAngle("Earth", departDays + flightDays * t), km: 6771 + (384400 - 6771) * t };
  const s = bodyAngle("Earth", departDays);
  let e = bodyAngle(target, departDays + flightDays) - s;
  e = ((e % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  if (e < 0.5 * Math.PI) e += 2 * Math.PI;
  const r2 = BODIES[target].au;
  let au = 1 + (r2 - 1) * (1 - Math.cos(Math.PI * t)) / 2;
  if (d.route === "risky") au *= 1 - 0.22 * Math.sin(Math.PI * t);
  if (d.route === "fast") au *= 1 + 0.12 * Math.sin(Math.PI * t);
  const angle = s + e * t, now = departDays + flightDays * t;
  const km = distanceKm(au, angle, 1, bodyAngle("Earth", now));
  return { au, angle, km };
}

/** Nearest body to a heliocentric position (real km). */
export function nearestBody(au: number, angle: number, days: number, exclude: BodyId[] = []) {
  let best: { id: BodyId; km: number } | null = null;
  for (const id of Object.keys(BODIES) as BodyId[]) {
    if (id === "Moon" || exclude.includes(id)) continue;
    const km = id === "Sun" ? au * AU_KM : distanceKm(au, angle, BODIES[id].au, bodyAngle(id, days));
    if (!best || km < best.km) best = { id, km };
  }
  return best!;
}

import { useEffect as _ue, useState as _us } from "react";
/** Re-render the calling component at a fixed rate (for values read from rt). */
export function useTick(hz = 8) {
  const [, set] = _us(0);
  _ue(() => { const id = window.setInterval(() => set((x) => x + 1), 1000 / hz); return () => window.clearInterval(id); }, [hz]);
}
