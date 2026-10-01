import { GameScreens } from "./GameScreens";
import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Compass, Crosshair, Database, Eye, FastForward, Flame as FlameIcon, Info, Radio, RefreshCcw, Rocket, Satellite, ScanLine, Settings, ShieldCheck, Wrench, X, Zap } from "lucide-react";
import { AU_KM, BODIES, LIGHT_KM_S, SOURCES, SPACECRAFT_OBJECTS, PLANET_ORDER } from "../../lib/nasa-data";
import { analyze, CAUSE_TEXT, ENGINES, finalScore, fmt, G0, INSTRUMENTS, landingStages, LAUNCH_LIMIT, MISSIONS, RESCUE_KITS, rescuePlan, resolveEncounter, ROOT_CAUSE, ROUTES, RTG_KW, WING_KW, type EngineId, type Instrument, type MissionId, type RouteId, type EncounterChoice } from "../../lib/mission-sim";
import { MissionBrief } from "./MissionBrief";
import { GoPoll } from "./GoPoll";
import { designOf, useMissionStore, type Phase } from "../../stores/mission-store";
import { launchProfile } from "./Stages";
import { pathAU, rt, useTick } from "./runtime";

const PHASE_TITLE: Record<Phase, string> = { menu: "", missions: "Mission Selection", brief: "Mission Brief", route: "Route Planning", routePreview: "Route Preview", objectives: "Mission Objectives", budget: "Mission Budget", fuel: "Fuel Plan", power: "Power Plan", comms: "Communications", instruments: "Instruments", overview: "Mission Overview", craft: "Spacecraft Selection", build: "Spacecraft Builder", check: "Mission Check", launch: "Launch Sequence", flight: "Deep Space Flight", encounter: "Hazard Encounter", failure: "Failure & Black Box", rescue: "Rescue Mission", docking: "Rendezvous & Repair", landing: "Entry, Descent & Landing", report: "Mission Report" };

function Panel({ children, className = "", title, icon }: { children: ReactNode; className?: string; title?: string; icon?: ReactNode }) {
  return <section className={`mf-panel pointer-events-auto p-3 sm:p-4 ${className}`}>{title && <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.18em] text-cyan-soft">{icon}{title}</h3>}{children}</section>;
}
function Btn({ children, onClick, tone = "primary", disabled, icon, className = "" }: { children: ReactNode; onClick?: () => void; tone?: "primary" | "ghost" | "danger"; disabled?: boolean | undefined; icon?: ReactNode; className?: string }) {
  const t = tone === "primary" ? "bg-primary text-primary-foreground shadow-[0_0_24px_color-mix(in_oklab,var(--primary)_45%,transparent)]" : tone === "danger" ? "bg-danger/85 text-foreground" : "bg-secondary/80 text-foreground hover:bg-secondary";
  return <button disabled={disabled} onClick={onClick} className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-xs font-bold uppercase tracking-[0.14em] transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 ${t} ${className}`}>{icon}{children}</button>;
}
function Bar({ label, value, tone = "primary", right }: { label: string; value: number; tone?: "primary" | "success" | "warning" | "danger"; right?: string }) {
  const c = { primary: "bg-primary", success: "bg-success", warning: "bg-warning", danger: "bg-danger" }[tone];
  return <div className="text-[13px]"><div className="mb-1 flex justify-between text-muted-foreground"><span>{label}</span><span className="mf-mono text-foreground">{right ?? `${Math.round(value)}%`}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full ${c} transition-all duration-500`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div></div>;
}
function Row({ k, v, tone = "" }: { k: string; v: ReactNode; tone?: string }) { return <div className="flex justify-between gap-3 text-[13px]"><span className="text-muted-foreground">{k}</span><b className={`mf-mono font-normal ${tone}`}>{v}</b></div>; }
function Tip({ children }: { children: ReactNode }) { return <p className="mt-3 flex gap-2 rounded-lg bg-primary/10 p-2.5 text-[10.5px] leading-4 text-cyan-soft"><Info size={13} className="mt-0.5 shrink-0 text-primary" /><span>{children}</span></p>; }
function Stepper({ label, value, min, max, onChange, sub }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; sub?: string }) {
  return <div className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2"><div><b className="block text-xs">{label}</b>{sub && <small className="text-[13px] text-muted-foreground">{sub}</small>}</div><div className="flex items-center gap-2"><button aria-label={`Remove ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="grid size-8 place-items-center rounded-md bg-background/60 text-lg disabled:opacity-30">−</button><span className="mf-mono w-5 text-center">{value}</span><button aria-label={`Add ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)} className="grid size-8 place-items-center rounded-md bg-background/60 text-lg disabled:opacity-30">+</button></div></div>;
}
function Toggle({ label, on, onClick, sub }: { label: string; on: boolean; onClick: () => void; sub?: string }) {
  return <button onClick={onClick} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${on ? "bg-primary/20" : "bg-secondary/60"}`}><span><b className="block text-xs">{label}</b>{sub && <small className="text-[13px] text-muted-foreground">{sub}</small>}</span><span className={`relative h-5 w-9 rounded-full transition ${on ? "bg-primary" : "bg-background/70"}`}><span className={`absolute top-0.5 size-4 rounded-full bg-foreground transition-all ${on ? "left-4" : "left-0.5"}`} /></span></button>;
}
const toneOf = (v: number, g = 60, o = 30) => (v >= g ? "success" : v >= o ? "warning" : "danger") as "success" | "warning" | "danger";

export function Logo({ big = false }: { big?: boolean }) {
  return (
    <div className="flex items-center gap-3 select-none">
      <svg viewBox="0 0 64 64" className={big ? "size-16 sm:size-20" : "size-8"} aria-hidden>
        <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--cyan-soft)" /><stop offset="1" stopColor="var(--primary)" /></linearGradient></defs>
        <circle cx="32" cy="32" r="11" fill="url(#lg)" />
        <ellipse cx="32" cy="32" rx="28" ry="10" fill="none" stroke="url(#lg)" strokeWidth="2.5" transform="rotate(-28 32 32)" />
        <path d="M50 13 l4 -4 l1 6 z" fill="var(--foreground)" />
        <circle cx="10" cy="44" r="2.4" fill="var(--foreground)" />
      </svg>
      <div className="leading-none">
        <div className={`font-bold tracking-[0.22em] text-foreground ${big ? "text-4xl sm:text-6xl" : "text-sm"}`} style={{ textShadow: "0 0 24px color-mix(in oklab, var(--primary) 60%, transparent)" }}>MISSION<span className="text-primary"> FORGE</span></div>
        {big && <div className="mt-3 text-[13px] tracking-[0.42em] text-cyan-soft sm:text-sm">DESIGN · EXPLORE · DECIDE · SURVIVE</div>}
      </div>
    </div>
  );
}

function StatusFeed() {
  const status = useMissionStore((s) => s.status);
  return <div className="pointer-events-none flex flex-col items-end gap-1">{status.map((m, i) => <div key={m.id} className="mf-panel animate-fade-in flex items-center gap-2 px-3 py-1.5 text-[13px]" style={{ opacity: 1 - i * 0.22 }}><span className={`size-1.5 rounded-full ${m.tone === "ok" ? "bg-success" : m.tone === "warn" ? "bg-warning" : m.tone === "danger" ? "bg-danger" : "bg-primary"} ${i === 0 ? "animate-pulse" : ""}`} />{m.text}</div>)}</div>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="pointer-events-auto absolute inset-0 z-30 grid place-items-center bg-background/70 p-4 backdrop-blur-sm"><Panel className="max-h-[85%] w-full max-w-2xl overflow-auto"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold uppercase tracking-[0.2em]">{title}</h2><button aria-label="Close" onClick={onClose} className="grid size-8 place-items-center rounded-md bg-secondary"><X size={16} /></button></div>{children}</Panel></div>;
}

// ---------------- Screens ----------------
function Menu() {
  const s = useMissionStore(); const [modal, setModal] = useState<"data" | "settings" | null>(null);
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-8 p-6 sm:p-12">
      <div className="animate-fade-in"><Logo big /></div>
      <div className="pointer-events-auto flex max-w-xs flex-col gap-2">
        <Btn icon={<Rocket size={15} />} onClick={() => { s.newRun("missions"); s.say("New mission — choose a destination"); }}>Start mission</Btn>
        {s.attempts > 0 && <Btn tone="ghost" icon={<Wrench size={15} />} onClick={() => s.go("build")}>Continue design</Btn>}
        <Btn tone="ghost" icon={<Database size={15} />} onClick={() => setModal("data")}>NASA data sources</Btn>
        <Btn tone="ghost" icon={<Settings size={15} />} onClick={() => setModal("settings")}>Settings</Btn>
      </div>
      <p className="max-w-sm text-[13px] text-muted-foreground">Planet positions shown live from NASA/JPL orbital elements for today's date. Distances are compressed for viewing; all calculations use real values.</p>
      {modal === "data" && <Modal title="NASA Data Center" onClose={() => setModal(null)}>
        <table className="w-full text-left text-[13px]"><thead className="text-muted-foreground"><tr><th className="py-1">Body</th><th>Diameter</th><th>Distance</th><th>Period</th><th>Gravity</th></tr></thead><tbody>{[...PLANET_ORDER, "Moon" as const].map((id) => { const b = BODIES[id]; return <tr key={id} className="mf-mono"><td className="py-1 font-sans">{id}</td><td>{fmt(b.diameterKm)} km</td><td>{id === "Moon" ? "384,400 km" : `${b.au} AU`}</td><td>{b.periodDays} d</td><td>{b.gravity} m/s²</td></tr>; })}</tbody></table>
        <ul className="mt-4 space-y-1 text-[10.5px] text-muted-foreground">{Object.values(SOURCES).map((x) => <li key={x}>• {x}</li>)}</ul>
      </Modal>}
      {modal === "settings" && <Modal title="Settings" onClose={() => setModal(null)}>
        <div className="space-y-2"><Toggle label="High graphics quality" sub="Sharper rendering; turn off on slower phones" on={s.quality === "high"} onClick={() => s.set({ quality: s.quality === "high" ? "low" : "high" })} />
          <Btn tone="danger" className="mt-3" icon={<RefreshCcw size={14} />} onClick={() => { localStorage.removeItem("mission-forge-v3"); location.reload(); }}>Reset all progress</Btn></div>
      </Modal>}
    </div>
  );
}

function Missions() {
  const s = useMissionStore();
  return (
    <Sheet>
      <div className="grid gap-2">{(Object.keys(MISSIONS) as MissionId[]).map((id) => { const m = MISSIONS[id], b = BODIES[m.body]; return (
        <button key={id} onClick={() => { s.set({ mission: id }); s.say(`Target: ${m.body}`); }} className={`flex items-center gap-3 rounded-xl p-3 text-left transition ${s.mission === id ? "bg-primary/25" : "bg-secondary/50 hover:bg-secondary"}`}>
          <span className="size-9 shrink-0 rounded-full" style={{ background: `radial-gradient(circle at 35% 35%, ${b.color}, ${b.color2})` }} />
          <span className="flex-1"><b className="block text-xs">{m.title}</b><small className="text-[13px] text-muted-foreground">{m.brief}</small></span>
          <span className="mf-mono text-right text-[13px] text-muted-foreground">{m.days} d<br />{m.dv} km/s</span>
        </button>); })}</div>
      <Tip>{BODIES[MISSIONS[s.mission].body].why} Δv values are approximate budgets from low Earth orbit.</Tip>
      <Nav back={() => s.go("menu")} next={() => s.go("route")} />
    </Sheet>
  );
}

function RoutePlan() {
  const s = useMissionStore(); const a = analyze(designOf(s));
  return (
    <Sheet>
      <div className="grid gap-2">{(Object.keys(ROUTES) as RouteId[]).map((id) => { const r = ROUTES[id]; const dv = MISSIONS[s.mission].dv * r.dv; return (
        <button key={id} onClick={() => { s.set({ route: id }); s.say(`Trajectory updated — ${r.name}`); }} className={`rounded-xl p-3 text-left transition ${s.route === id ? "bg-primary/25" : "bg-secondary/50 hover:bg-secondary"}`}>
          <div className="flex justify-between text-xs"><b>{r.name}</b><span className="mf-mono">{dv.toFixed(2)} km/s</span></div>
          <div className="mt-1 flex justify-between text-[13px] text-muted-foreground"><span>{r.note}</span><span>{Math.round(MISSIONS[s.mission].days * r.time)} d · risk ×{r.hazard}</span></div>
        </button>); })}</div>
      <Row k="Route hazard" v={`${Math.round(a.hazard * 100)}%`} tone={a.hazard > 0.4 ? "text-danger" : a.hazard > 0.2 ? "text-warning" : "text-success"} />
      <Tip>A Hohmann transfer is the minimum-energy ellipse touching both orbits. The line on the map shows it, using today's real planet positions. Drag to rotate, pinch to zoom.</Tip>
      <Nav back={() => s.go("missions")} next={() => s.go("build")} />
    </Sheet>
  );
}

function Build() {
  const s = useMissionStore(); const a = analyze(designOf(s)); const [tab, setTab] = useState<"prop" | "power" | "sys" | "sci">("prop");
  const tabs = [["prop", "Propulsion"], ["power", "Power"], ["sys", "Systems"], ["sci", "Instruments"]] as const;
  return (
    <Sheet wide>
      <div className="mb-3 flex gap-1 overflow-x-auto">{tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`rounded-md px-3 py-1.5 text-[13px] font-bold uppercase tracking-wider ${tab === k ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground"}`}>{l}</button>)}</div>
      <div className="space-y-2">
        {tab === "prop" && <>
          {(Object.keys(ENGINES) as EngineId[]).map((e) => <button key={e} onClick={() => { s.set({ engine: e }); s.say(`${ENGINES[e].name} installed`); }} className={`w-full rounded-lg p-2.5 text-left ${s.engine === e ? "bg-primary/25" : "bg-secondary/60"}`}><div className="flex justify-between text-xs"><b>{ENGINES[e].name}</b><span className="mf-mono text-[13px]">Isp {ENGINES[e].isp} s · {ENGINES[e].thrust}</span></div><small className="text-[13px] text-muted-foreground">{ENGINES[e].note} · {fmt(ENGINES[e].mass)} kg</small></button>)}
          <Stepper label="Engines" value={s.engines} min={1} max={3} onChange={(v) => s.set({ engines: v })} sub="More engines add mass and power draw" />
          <Stepper label="Propellant tanks" value={s.tanks} min={1} max={4} onChange={(v) => s.set({ tanks: v })} sub="9,000 kg each" />
          <label className="block text-[13px] text-muted-foreground">Fuel load <span className="mf-mono float-right text-foreground">{s.fuel}%</span><input aria-label="Fuel load" type="range" min={20} max={100} value={s.fuel} onChange={(e) => s.set({ fuel: +e.target.value })} className="mt-1 w-full accent-[var(--primary)]" /></label>
        </>}
        {tab === "power" && <>
          <Stepper label="Solar array wings" value={s.wings} min={0} max={6} onChange={(v) => s.set({ wings: v })} sub={`${WING_KW} kW each at 1 AU (Orion ESM)`} />
          <Stepper label="MMRTG units" value={s.rtgs} min={0} max={4} onChange={(v) => s.set({ rtgs: v })} sub={`${RTG_KW * 1000} W each, works anywhere`} />
          <Toggle label="Battery bank" sub="600 kg emergency reserve" on={s.battery} onClick={() => s.set({ battery: !s.battery })} />
        </>}
        {tab === "sys" && <>
          <Stepper label="High-gain antennas" value={s.antennas} min={1} max={2} onChange={(v) => s.set({ antennas: v })} sub="Second antenna = comms redundancy" />
          <Toggle label="Whipple debris shield" sub="1,300 kg — protects against impacts" on={s.shield} onClick={() => s.set({ shield: !s.shield })} />
        </>}
        {tab === "sci" && (Object.keys(INSTRUMENTS) as Instrument[]).map((k) => <Toggle key={k} label={INSTRUMENTS[k].name} sub={`${INSTRUMENTS[k].mass} kg · ${INSTRUMENTS[k].kw * 1000} W · +${INSTRUMENTS[k].science} science`} on={s.instruments.includes(k)} onClick={() => s.toggleInstrument(k)} />)}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-background/40 p-3">
        <Row k="Launch mass" v={`${fmt(a.wet)} kg`} tone={a.wet > LAUNCH_LIMIT ? "text-danger" : ""} /><Row k="Dry mass" v={`${fmt(a.dry)} kg`} />
        <Row k="Δv" v={`${a.dv.toFixed(2)} / ${a.required.toFixed(2)}`} tone={a.dvMargin < 0 ? "text-danger" : a.dvMargin < 0.1 ? "text-warning" : "text-success"} /><Row k="Power" v={`${a.generation} / ${a.draw} kW`} tone={a.powerMargin < 0 ? "text-danger" : "text-success"} />
        <Row k="Flight time" v={`${fmt(a.days)} d`} /><Row k="Science" v={a.science} />
      </div>
      <Tip>Δv = Isp × g₀ × ln(m₀ / m_f). Every kilogram of dry mass reduces Δv, and extra fuel gives less and less, because fuel also has to lift fuel.</Tip>
      <Nav back={() => s.go("route")} next={() => s.go("check")} />
    </Sheet>
  );
}

function CheckS() {
  const s = useMissionStore(); const a = analyze(designOf(s)); const [pollOk, setPollOk] = useState(false);
  return (
    <Sheet className="mf-check-sheet">
      <div className="mb-4 flex items-center gap-4"><div className={`grid size-20 shrink-0 place-items-center rounded-full ${a.canLaunch ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>{a.canLaunch ? <Check size={38} /> : <X size={38} />}</div><div><div className={`text-xl font-bold tracking-widest ${a.canLaunch ? "text-success" : "text-danger"}`}>{a.canLaunch ? "MISSION READY" : "HIGH-RISK MISSION"}</div><div className="mf-mono text-sm text-muted-foreground">Readiness {a.readiness} / 100 · game estimate</div></div></div>
      <div className="space-y-3">
        <Bar label="Launch mass" value={(a.wet / LAUNCH_LIMIT) * 100} tone={a.wet > LAUNCH_LIMIT ? "danger" : "success"} right={`${fmt(a.wet)} / ${fmt(LAUNCH_LIMIT)} kg`} />
        <Bar label="Δv margin" value={50 + a.dvMargin * 250} tone={a.dvMargin < 0 ? "danger" : a.dvMargin < 0.1 ? "warning" : "success"} right={`${Math.round(a.dvMargin * 100)}%`} />
        <Bar label="Power margin" value={50 + a.powerMargin * 100} tone={a.powerMargin < 0 ? "danger" : a.powerMargin < 0.15 ? "warning" : "success"} right={`${Math.round(a.powerMargin * 100)}%`} />
        <Bar label="Route hazard" value={a.hazard * 100} tone={a.hazard > 0.4 ? "danger" : a.hazard > 0.2 ? "warning" : "success"} />
      </div>
      <div className="mt-3 space-y-1.5">{a.issues.map((i) => <div key={i.text} className={`flex gap-2 rounded-lg p-2 text-[13px] ${i.tone === "danger" ? "bg-danger/15 text-danger" : "bg-warning/10 text-warning"}`}><AlertTriangle size={13} className="mt-0.5 shrink-0" />{i.text}</div>)}</div>
      <GoPoll onReady={setPollOk} />
      <Nav back={() => s.go("build")} next={() => { rt.launchT = 0; s.say("Launch sequence initiated", "warn"); s.go("launch"); }} nextLabel={a.canLaunch ? "Launch" : "Launch with risk"} disabled={!pollOk} />
    </Sheet>
  );
}

function LaunchHud() {
  useTick(8); const s = useMissionStore(); const t = rt.launchT; const p = launchProfile(t);
  const steps: [number, string][] = [[0, "Systems go"], [3, "Fueling"], [LIFT - 6.6, "Engine start"], [LIFT, "Liftoff"], [18, "Booster separation"], [25, "Core separation"], [28, "Orbit insertion"], [29, "Solar array deploy"]];
  const inOrbit = t > 33;
  const target = MISSIONS[s.mission].body;
  return (
    <>
      <div className="pointer-events-none absolute left-1/2 top-16 -translate-x-1/2 text-center"><div className="mf-mono text-4xl font-bold sm:text-6xl" style={{ textShadow: "0 0 30px var(--primary)" }}>{t < LIFT ? `T−${Math.ceil(LIFT - t)}` : `T+${fmtTime(p.real)}`}</div></div>
      <Sheet>
        <div className="space-y-1.5">{steps.map(([at, l]) => <div key={l} className={`flex items-center gap-2 text-xs ${t >= at ? "text-foreground" : "text-muted-foreground/60"}`}><span className={`grid size-4 place-items-center rounded-full ${t >= at ? "bg-success/25 text-success" : "bg-secondary"}`}>{t >= at && <Check size={10} />}</span>{l}</div>)}</div>
        <div className="mt-3 grid grid-cols-2 gap-2"><Row k="Altitude" v={`${p.altKm.toFixed(1)} km`} /><Row k="Velocity" v={`${p.velKms.toFixed(2)} km/s`} /></div>
        <Tip>{inOrbit ? "In orbit at ~7.8 km/s. The Orion service module's four solar wings unfold once the fairings are gone." : "SLS Block 1 produces 8.8 million pounds of thrust at liftoff — 4 RS-25 engines plus 2 solid rocket boosters."}</Tip>
        <div className="mt-3 flex justify-end gap-2">
          {!inOrbit && <Btn tone="ghost" icon={<FastForward size={14} />} onClick={() => { rt.launchT = 28; }}>Skip to orbit</Btn>}
          {inOrbit && <Btn icon={<FlameIcon size={14} />} onClick={() => { rt.departDays = rt.days; rt.progress = 0; rt.warp = 1; s.say(target === "Moon" ? "Trans-lunar injection burn" : `Trans-${target} injection burn`, "warn"); s.go("flight"); }}>{target === "Moon" ? "Trans-lunar injection" : "Injection burn"}</Btn>}
        </div>
      </Sheet>
    </>
  );
}
const LIFT = 10;
const fmtTime = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

function useTelemetry() {
  const s = useMissionStore(); const d = designOf(s); const a = analyze(d); const e = ENGINES[d.engine];
  const target = MISSIONS[s.mission].body;
  const p = pathAU(d, rt.progress, rt.departDays, a.days);
  const moon = target === "Moon";
  const GM = moon ? 398600.4 : 1.32712e11;
  const r = moon ? p.km : p.au * AU_KM, aT = moon ? (6771 + 384400) / 2 : ((1 + BODIES[target].au) / 2) * AU_KM;
  const vel = Math.sqrt(Math.max(0, GM * (2 / r - 1 / aT)));
  const dvUsed = a.required * (0.6 + 0.4 * (rt.progress >= 1 ? 1 : 0)) + s.dvSpent;
  const mNow = a.wet * Math.exp((-dvUsed * 1000) / (e.isp * G0));
  const fuelPct = Math.max(0, ((mNow - a.dry) / a.propellant) * 100);
  const au = moon ? 1 : p.au;
  const kw = d.wings * WING_KW / (au * au) + d.rtgs * RTG_KW;
  const tempC = 278 / Math.sqrt(au) - 273;
  const hull = s.outcome?.hull ?? 100, comms = s.outcome?.comms ?? 100;
  return { vel, km: p.km, fuelPct, kw, draw: a.draw, tempC, delay: p.km / LIGHT_KM_S, day: rt.progress * a.days, dvLeft: a.dv - dvUsed, hull, comms, a };
}

function Telemetry() {
  const t = useTelemetry();
  const cells: [string, string, string?][] = [["Velocity", `${t.vel.toFixed(2)} km/s`], ["From Earth", t.km > 1e6 ? `${(t.km / 1e6).toFixed(1)} M km` : `${fmt(t.km)} km`], ["Mission day", `${t.day.toFixed(1)} / ${t.a.days}`], ["Fuel", `${t.fuelPct.toFixed(0)}%`, t.fuelPct < 15 ? "text-warning" : ""], ["Δv left", `${t.dvLeft.toFixed(2)} km/s`, t.dvLeft < 0 ? "text-danger" : ""], ["Power", `${t.kw.toFixed(2)} / ${t.draw} kW`, t.kw < t.draw ? "text-danger" : ""], ["Temp (eq.)", `${t.tempC.toFixed(0)} °C`], ["Comms delay", t.delay < 60 ? `${t.delay.toFixed(1)} s` : `${(t.delay / 60).toFixed(1)} min`, t.comms < 20 ? "text-danger" : ""]];
  return <div className="mf-panel pointer-events-auto grid grid-cols-4 gap-x-3 gap-y-1.5 p-2.5 sm:grid-cols-8">{cells.map(([k, v, c]) => <div key={k}><div className="text-[13px] uppercase tracking-wider text-muted-foreground">{k}</div><div className={`mf-mono text-[13px] sm:text-xs ${c ?? ""}`}>{v}</div></div>)}</div>;
}

function ScanCard() {
  const s = useMissionStore(); const [locked, setLocked] = useState(false);
  const sc = rt.scan; if (!sc) return null;
  const b = BODIES[sc.id];
  const near = rt.progress < 0.04 ? SPACECRAFT_OBJECTS[Math.min(2, Math.floor(rt.progress / 0.014))] : null;
  return (
    <div className="mf-panel pointer-events-auto w-64 animate-fade-in p-3">
      <div className="mb-1 flex items-center gap-2 text-[13px] uppercase tracking-[0.18em] text-primary"><ScanLine size={12} className="animate-pulse" />Object detected</div>
      {near && <div className="mb-2 rounded-md bg-primary/10 p-2 text-[10.5px]"><b className="flex items-center gap-1 text-xs"><Satellite size={12} />{near.id}</b><span className="text-muted-foreground">{near.kind} · {near.detail}</span></div>}
      <b className="text-sm">{b.id}</b>
      <div className="text-[13px] text-muted-foreground">{b.kind}</div>
      <Row k="Distance" v={sc.km > 1e6 ? `${(sc.km / 1e6).toFixed(2)} M km` : `${fmt(sc.km)} km`} />
      {locked && <div className="mt-1 space-y-0.5"><Row k="Diameter" v={`${fmt(b.diameterKm)} km`} /><Row k="Gravity" v={`${b.gravity} m/s²`} />{b.periodDays > 0 && <Row k="Orbital period" v={`${b.periodDays} d`} />}</div>}
      <p className="mt-2 text-[10.5px] leading-4 text-cyan-soft">{b.why}</p>
      <div className="mt-2 flex items-center justify-between"><small className="text-[13px] text-muted-foreground">Source: NASA NSSDCA</small><button onClick={() => { setLocked(!locked); if (!locked) s.say(`Scan complete: ${b.id}`, "ok"); }} className="rounded-md bg-primary/20 px-2 py-1 text-[13px] font-bold uppercase text-primary">{locked ? "Less" : "Full scan"}</button></div>
    </div>
  );
}

function Flight() {
  useTick(4); const s = useMissionStore(); const d = designOf(s); const a = analyze(d);
  const [warp, setWarp] = useState(rt.warp);
  const spare = a.dv - a.required - s.dvSpent;
  return (
    <>
      <div className="pointer-events-none absolute left-3 top-16 hidden sm:block"><ScanCard /></div>
      <div className="absolute inset-x-2 bottom-2 flex flex-col gap-2 sm:inset-x-4 sm:bottom-4">
        <div className="sm:hidden"><ScanCard /></div>
        <Telemetry />
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5">
          <Btn tone={s.cam === "chase" ? "primary" : "ghost"} icon={<Radio size={14} />} onClick={() => { s.set({ cam: "chase" }); s.say("Earth mission control view"); }}>Mission control</Btn>
          <Btn tone={s.cam === "cockpit" ? "primary" : "ghost"} icon={<Eye size={14} />} onClick={() => { rt.yaw = 0; rt.pitch = 0; s.set({ cam: "cockpit" }); s.say("Cockpit view — drag to look around"); }}>Cockpit</Btn>
          {[1, 5, 20].map((w) => <Btn key={w} tone={warp === w ? "primary" : "ghost"} onClick={() => { rt.warp = w; setWarp(w); s.say(`Time warp ${w}×`); }}>{w}×</Btn>)}
          <Btn tone="ghost" icon={<FlameIcon size={14} />} disabled={spare < 0.1} onClick={() => { s.set({ dvSpent: s.dvSpent + 0.1 }); rt.progress = Math.min(0.999, rt.progress + 0.03); s.say("Course correction burn: −0.10 km/s", "warn"); }}>Burn</Btn>
        </div>
      </div>
    </>
  );
}

function Encounter() {
  const s = useMissionStore(); const d = designOf(s); const a = analyze(d); const o = s.outcome;
  const choices: { id: EncounterChoice; label: string; Icon: typeof ShieldCheck; hint: string }[] = [{ id: "shield", label: "Shield forward", Icon: ShieldCheck, hint: d.shield ? "Hold course behind Whipple shield" : "Hold course — no shield fitted" }, { id: "boost", label: "Boost through", Icon: Zap, hint: "Burn 1.2 km/s to cross fast" }, { id: "reroute", label: "Reroute", Icon: Compass, hint: "Burn 0.6 km/s, lose some targets" }];
  return (
    <Sheet>
      <p className="text-xs text-muted-foreground">Radar shows a debris cloud ahead. Impact risk <b className="text-warning">{Math.round(a.hazard * 100)}%</b>. Spare Δv <b className="mf-mono text-foreground">{(a.dv - a.required - s.dvSpent).toFixed(2)} km/s</b>.</p>
      <div className="mt-3 grid gap-2">{choices.map(({ id, label, Icon, hint }) => <button key={id} disabled={!!o} onClick={() => { const out = resolveEncounter(d, id, s.dvSpent); s.set({ outcome: out }); s.say(out.failed ? "Critical damage sustained" : "Hazard cleared", out.failed ? "danger" : "ok"); }} className={`rounded-lg p-2.5 text-left disabled:opacity-60 ${o?.choice === id ? "bg-primary/25" : "bg-secondary/60 hover:bg-secondary"}`}><b className="flex items-center gap-2 text-xs"><Icon size={14} />{label}</b><small className="text-[13px] text-muted-foreground">{hint}</small></button>)}</div>
      {o && <div className="mt-3 space-y-2"><p className={`text-xs ${o.failed ? "text-danger" : "text-success"}`}>{o.log}</p><Bar label="Hull" value={o.hull} tone={toneOf(o.hull, 70, 45)} /><Bar label="Comms" value={o.comms} tone={toneOf(o.comms)} /><Bar label="Power" value={o.power} tone={toneOf(o.power)} /></div>}
      {o && <Nav next={() => { if (o.failed) { s.say("Black box data recovered", "danger"); s.go("failure"); } else { s.go("flight"); } }} nextLabel={o.failed ? "Black box" : "Continue"} />}
    </Sheet>
  );
}

function Failure() {
  const s = useMissionStore(); const o = s.outcome; if (!o) return null;
  const timeline = [["Decision", `Chose "${o.choice}"`, "T-0:45"], ["Impact", o.log, "T-0:30"], ...o.causes.map((c, i) => ["Critical", CAUSE_TEXT[c] ?? c, `T-0:${String(15 - i * 5).padStart(2, "0")}`]), ["Failure", "Mission objective at risk", "T-0:00"]];
  return (
    <Sheet>
      <div className="mb-3 flex items-center gap-2 rounded-lg bg-danger/20 px-3 py-2 text-sm font-bold text-danger"><AlertTriangle size={16} />Mission failure — {CAUSE_TEXT[o.causes[0] ?? ""]}</div>
      <h4 className="mb-1 text-[13px] uppercase tracking-widest text-muted-foreground">Cause analysis</h4>
      <ul className="space-y-1 text-[13px]">{o.causes.map((c) => <li key={c}>• <span className="text-danger">{CAUSE_TEXT[c]}</span> — {ROOT_CAUSE[c]}</li>)}</ul>
      <h4 className="mb-1 mt-3 text-[13px] uppercase tracking-widest text-muted-foreground">Black box timeline</h4>
      <div className="space-y-1">{timeline.map(([k, v, t], i) => <div key={i} className="flex gap-2 text-[13px]"><span className="mt-1 size-2 shrink-0 rounded-full bg-danger" /><span className="flex-1"><b className="text-danger">{k}</b> <span className="text-muted-foreground">{v}</span></span><span className="mf-mono text-muted-foreground">{t}</span></div>)}</div>
      <Nav back={() => { s.newRun("build"); }} backLabel="Redesign" next={() => s.go("rescue")} nextLabel="Plan rescue" />
    </Sheet>
  );
}

function Rescue() {
  const s = useMissionStore(); const need = s.outcome?.causes ?? []; const plan = rescuePlan(s.rescueKit, s.mission); const covered = need.every((c) => s.rescueKit.includes(c));
  return (
    <Sheet>
      <div className="mb-2 flex flex-wrap gap-1.5">{need.map((c) => <span key={c} className={`rounded-md px-2 py-1 text-[13px] ${s.rescueKit.includes(c) ? "bg-success/20 text-success" : "bg-danger/20 text-danger"}`}>{CAUSE_TEXT[c]}</span>)}</div>
      <div className="space-y-1.5">{Object.entries(RESCUE_KITS).map(([id, k]) => <Toggle key={id} label={k.name} sub={`${fmt(k.mass)} kg`} on={s.rescueKit.includes(id)} onClick={() => s.set({ rescueKit: s.rescueKit.includes(id) ? s.rescueKit.filter((x) => x !== id) : [...s.rescueKit, id] })} />)}</div>
      <div className="mt-3 space-y-1 rounded-lg bg-background/40 p-3"><Row k="Rescue craft mass" v={`${fmt(plan.wet)} kg`} /><Row k="Δv available" v={`${plan.dv.toFixed(2)} km/s`} tone={plan.ok ? "text-success" : "text-danger"} /><Row k="Δv to rendezvous" v={`${plan.required.toFixed(2)} km/s`} /></div>
      {!covered && <p className="mt-2 text-[10.5px] text-danger">Payload doesn't fix every fault.</p>}
      {!plan.ok && <p className="mt-2 text-[10.5px] text-danger">Too heavy — the rescue craft can't reach the target.</p>}
      <Tip>Every kilogram on the rescue craft costs Δv. Bring what fixes the faults and nothing more.</Tip>
      <Nav back={() => s.go("failure")} next={() => { s.say("Rescue craft launched", "warn"); s.go("docking"); }} nextLabel="Build & launch" disabled={!covered || !plan.ok} />
    </Sheet>
  );
}

function Docking() {
  useTick(6); const s = useMissionStore(); const t = rt.launchT;
  const steps: [number, string][] = [[0, "Approach"], [6, "Match rotation"], [11, "Dock"], [13, "Repair systems"], [24, "Systems restored"]];
  return (
    <Sheet>
      <div className="space-y-1.5">{steps.map(([at, l]) => <div key={l} className={`flex items-center gap-2 text-xs ${t >= at ? "" : "text-muted-foreground/60"}`}><span className={`grid size-4 place-items-center rounded-full ${t >= at ? "bg-success/25 text-success" : "bg-secondary"}`}>{t >= at && <Check size={10} />}</span>{l}</div>)}</div>
      <div className="mt-3"><Bar label="Repair" value={Math.max(0, (t - 13) / 11) * 100} tone="primary" /></div>
      <Row k="Docking distance" v={`${Math.max(0, (9 - t) * 1.3 * 1.6).toFixed(1)} m`} />
      <Tip>Hubble was repaired in orbit five times. Docking needs a relative speed of just a few centimeters per second.</Tip>
      <Nav next={() => { s.say("Resuming mission — descent", "ok"); s.go("landing"); }} nextLabel="Descend" disabled={!s.rescued} />
    </Sheet>
  );
}

function Landing() {
  const s = useMissionStore(); const body = MISSIONS[s.mission].body; const stages = landingStages(body);
  const order = useMemo(() => stages.map((_, i) => i).sort((a, b) => ((a * 7 + 3) % stages.length) - ((b * 7 + 3) % stages.length)), [stages]);
  const [msg, setMsg] = useState("Put the stages in the right order.");
  const done = s.landing >= stages.length;
  return (
    <Sheet>
      <p className="mb-2 text-[13px] text-muted-foreground">{msg}</p>
      <div className="grid gap-1.5">{order.map((i) => <button key={i} disabled={done} onClick={() => { if (i === s.landing) { s.set({ landing: s.landing + 1 }); s.say(`${stages[i]}`, "ok"); setMsg(i === stages.length - 1 ? "Landing complete." : `${stages[i]} complete.`); } else { s.set({ landingErrors: s.landingErrors + 1 }); s.say(`Wrong order: ${stages[i]}`, "danger"); setMsg(`${stages[i]} now would be dangerous. Think about the physics.`); } }} className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs ${s.landing > i ? "bg-success/15 text-success" : "bg-secondary/60 hover:bg-secondary"}`}>{stages[i]}{s.landing > i && <Check size={13} />}</button>)}</div>
      <div className="mt-3 grid grid-cols-2 gap-2"><Row k="Altitude" v={`${Math.max(0, 100 - (s.landing / stages.length) * 100).toFixed(0)}%`} /><Row k="Errors" v={s.landingErrors} tone={s.landingErrors ? "text-danger" : "text-success"} /></div>
      <Tip>{BODIES[body].atmosphere === "none" ? `${body} has no atmosphere: parachutes don't work, so engines do all the braking.` : BODIES[body].atmosphere === "gas" ? `${body} has no solid surface, so a probe sends data back until the pressure crushes it.` : "Mars' atmosphere is only ~1% of Earth's, so parachutes slow you down but engines finish the job."}</Tip>
      {done && <Nav next={() => s.go("report")} nextLabel="Mission report" />}
    </Sheet>
  );
}

function Report() {
  const s = useMissionStore(); const d = designOf(s); const a = analyze(d); const sc = finalScore(d, s.outcome, s.rescued, s.landingErrors);
  const lessons = [a.dvMargin < 0.1 ? "Your Δv margin was thin. Engineers usually keep a 10–20% reserve." : "A healthy Δv reserve gave you room for surprises.", s.outcome?.failed ? `The failure came from: ${s.outcome.causes.map((c) => CAUSE_TEXT[c]).join(", ")}. Redundancy would have prevented it.` : "Your design survived the hazard without a rescue.", s.landingErrors ? "Landing steps follow a strict physical order." : "Flawless landing sequence.", BODIES[MISSIONS[s.mission].body].why];
  return (
    <Sheet>
      <div className="flex items-center gap-4"><div className="grid size-24 shrink-0 place-items-center rounded-full bg-primary/15 shadow-[0_0_40px_color-mix(in_oklab,var(--primary)_35%,transparent)]"><div className="text-center"><b className="mf-mono text-3xl">{sc.total}</b><span className="block text-[8px] uppercase tracking-widest text-muted-foreground">Score</span></div></div><div><div className={`text-sm font-bold uppercase tracking-widest ${s.outcome?.failed && !s.rescued ? "text-danger" : "text-success"}`}>{s.outcome?.failed ? (s.rescued ? "Recovered" : "Lost") : "Success"}</div><div className="text-[13px] text-muted-foreground">{MISSIONS[s.mission].title} · {a.days} days</div></div></div>
      <div className="mt-3 space-y-2">{([["Objective", sc.objective], ["Science", sc.science], ["Safety", sc.safety], ["Resources", sc.resources], ["Landing", sc.landing]] as const).map(([k, v]) => <Bar key={k} label={k} value={v} tone={toneOf(v, 75, 45)} />)}</div>
      <ul className="mt-3 space-y-1.5 text-[13px] text-muted-foreground">{lessons.map((l) => <li key={l} className="flex gap-2"><Check size={13} className="mt-0.5 shrink-0 text-success" />{l}</li>)}</ul>
      <div className="mt-4 flex flex-wrap justify-end gap-2"><Btn tone="ghost" onClick={() => s.newRun("missions")}>New destination</Btn><Btn icon={<RefreshCcw size={14} />} onClick={() => s.newRun("build")}>Redesign & retry</Btn></div>
    </Sheet>
  );
}

// ---------------- Layout ----------------
function Sheet({ children, wide = false, className = "" }: { children: ReactNode; wide?: boolean; className?: string }) {
  return <div className={`absolute inset-x-2 bottom-2 max-h-[58%] overflow-y-auto sm:inset-x-auto sm:bottom-4 sm:right-4 sm:top-16 sm:max-h-none ${wide ? "sm:w-[24rem]" : "sm:w-[21rem]"} ${className}`}><Panel>{children}</Panel></div>;
}
function Nav({ back, next, nextLabel = "Next", backLabel = "Back", disabled }: { back?: () => void; next?: () => void; nextLabel?: string; backLabel?: string; disabled?: boolean | undefined }) {
  return <div className="mt-4 flex justify-between gap-2">{back ? <Btn tone="ghost" icon={<ArrowLeft size={14} />} onClick={back}>{backLabel}</Btn> : <span />}{next && <Btn onClick={next} disabled={disabled}>{nextLabel}<ArrowRight size={14} /></Btn>}</div>;
}

export function Hud() {
  const phase = useMissionStore((s) => s.phase), go = useMissionStore((s) => s.go);
  const screens: Partial<Record<Phase, ReactNode>> = { check: <CheckS />, launch: <LaunchHud />, flight: <Flight />, encounter: <Encounter />, failure: <Failure />, rescue: <Rescue />, docking: <Docking />, landing: <Landing />, report: <Report /> };
  if (["menu", "missions", "brief", "route", "routePreview", "objectives", "budget", "fuel", "power", "comms", "instruments", "overview", "craft", "build"].includes(phase)) return <GameScreens phase={phase} />;
  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-foreground">
      {(
        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
          <div className="pointer-events-auto flex items-center gap-3"><button aria-label="Main menu" onClick={() => go("menu")}><Logo /></button><span className="hidden text-[13px] font-bold uppercase tracking-[0.2em] text-cyan-soft sm:inline">{PHASE_TITLE[phase]}</span></div>
          <StatusFeed />
        </div>
      )}
      {screens[phase]}
      {<div className="absolute left-3 top-14 text-[13px] font-bold uppercase tracking-[0.2em] text-cyan-soft sm:hidden">{PHASE_TITLE[phase]}</div>}
      {(phase === "flight" || phase === "encounter") && useMissionStore.getState().cam === "cockpit" && <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary/70"><Crosshair size={28} /></div>}
    </div>
  );
}
