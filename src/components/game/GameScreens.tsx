import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, BookOpen, Check, Compass, Menu, Rocket, Settings2, UserRound, X } from "lucide-react";
import { Button } from "../ui/button";
import { BODIES, SOURCES } from "../../lib/nasa-data";
import { analyze, ENGINES, fmt, INSTRUMENTS, MISSIONS, ROUTES, type EngineId, type Instrument, type MissionId, type RouteId } from "../../lib/mission-sim";
import { designOf, useMissionStore, type Phase } from "../../stores/mission-store";
import { LivePositions } from "./LivePositions";
import { LANGS } from "../../locales/resources";
import { AyeshaAvatar } from "./Ayesha";
import { useVoice, VoiceBar } from "./voice";
import earth from "../../assets/nasa-earth-blue-marble.jpg.asset.json";
import mars from "../../assets/nasa-mars.jpg.asset.json";
import moon from "../../assets/nasa-moon.jpg.asset.json";
import ceres from "../../assets/nasa-ceres.jpg.asset.json";
import jupiter from "../../assets/nasa-jupiter.jpg.asset.json";
import saturn from "../../assets/nasa-saturn.jpg.asset.json";

const images: Record<MissionId, string> = {
  Moon: moon.url,
  Venus: "/images/nasa-venus.svg",
  Mars: mars.url,
  Mercury: "/images/nasa-mercury.svg",
  Ceres: ceres.url,
  Jupiter: jupiter.url,
  Saturn: saturn.url,
};
const ids: MissionId[] = ["Moon", "Venus", "Mars", "Mercury", "Ceres", "Jupiter", "Saturn"];
const steps: Phase[] = ["missions", "brief", "route", "routePreview", "objectives", "budget", "fuel", "power", "comms", "instruments", "overview", "craft", "build", "check"];
const nameKey: Partial<Record<Phase, string>> = { missions: "planet", brief: "mission", route: "routePick", routePreview: "routePreview", objectives: "objectives", budget: "budget", fuel: "fuel", power: "power", comms: "comms", instruments: "instruments", overview: "overview", craft: "craft", build: "build", check: "score" };

function Frame({ phase, children }: { phase: Phase; children: ReactNode }) {
  const s = useMissionStore(); const { t } = useTranslation(); const [menu, setMenu] = useState(false); const [mentor, setMentor] = useState(false);
  const current = steps.indexOf(phase);
  return <div className="gm-screen gm-flow">
    <header className="gm-header">
      <Button variant="ghost" className="gm-mark" onClick={() => s.go("menu")} aria-label={t("ui.game.home")}>◈ <strong>MISSION <span>FORGE</span></strong></Button>
      {current >= 0 && <div className="gm-flow-progress"><span>{String(current + 1).padStart(2, "0")} / {steps.length}</span><div><i style={{ width: `${(current + 1) / steps.length * 100}%` }} /></div><b>{t(`ui.flow.${nameKey[phase]}`)}</b></div>}
      <div className="gm-header-tools"><span className="gm-signal"><i /> NASA / JPL</span><Button variant="ghost" size="icon" onClick={() => setMentor(true)} aria-label={t("ui.ayesha.name")} title={t("ui.ayesha.name")}><UserRound size={19} /></Button><Button variant="ghost" size="icon" onClick={() => setMenu(!menu)} aria-label={t("ui.game.options")}><Menu size={19} /></Button></div>
    </header>
    {children}
    {menu && <div className="gm-backdrop" onClick={() => setMenu(false)}><section className="gm-dialog" onClick={e => e.stopPropagation()}><Button variant="ghost" size="icon" className="gm-close" aria-label={t("ui.learn.close")} onClick={() => setMenu(false)}><X /></Button><h2>{t("ui.game.options")}</h2><label>{t("ui.voice.language")}<select value={s.lang} onChange={e => s.set({ lang: e.target.value as typeof s.lang })}>{LANGS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}</select></label><Button variant="secondary" onClick={() => s.set({ quality: s.quality === "high" ? "low" : "high" })}><Settings2 /> {t("ui.game.graphics")}: {s.quality}</Button><Button variant="secondary" onClick={() => { s.set({ learn: "index" }); setMenu(false); }}><BookOpen /> {t("ui.learn.title")}</Button><p>NASA NSSDCA · NASA/JPL Horizons · NASA Image and Video Library</p></section></div>}
    {mentor && <Mentor onClose={() => setMentor(false)} />}
  </div>;
}

function Mentor({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation(); const voice = useVoice(); const text = t("ayeshaTips.build");
  return <div className="gm-backdrop" onClick={() => { voice.stop(); onClose(); }}><section className="gm-dialog" onClick={e => e.stopPropagation()}><Button variant="ghost" size="icon" className="gm-close" aria-label={t("ui.learn.close")} onClick={() => { voice.stop(); onClose(); }}><X /></Button><div className="gm-mentor-head"><AyeshaAvatar /><div><h2>{t("ui.ayesha.name")}</h2><p>{t("ui.ayesha.role")}</p></div></div><p className="gm-mentor-tip">{text}</p><VoiceBar text={text} voice={voice} /><Button onClick={() => { voice.stop(); onClose(); }}>{t("ui.ayesha.dismiss")}</Button></section></div>;
}

function Actions({ back, next, label, onNext }: { back: Phase; next: Phase; label?: string | undefined; onNext?: (() => void) | undefined }) {
  const s = useMissionStore(); const { t } = useTranslation();
  return <footer className="gm-flow-actions"><Button variant="ghost" onClick={() => s.go(back)}><ArrowLeft /> {t("ui.flow.back")}</Button><Button onClick={() => { onNext?.(); s.go(next); }}>{label ?? t("ui.flow.next")} <ArrowRight /></Button></footer>;
}
function Layout({ phase, title, eyebrow, info, children, back, next, nextLabel, onNext, media }: { phase: Phase; title: string; eyebrow?: string; info?: ReactNode; children: ReactNode; back: Phase; next: Phase; nextLabel?: string; onNext?: () => void; media?: ReactNode }) {
  return <Frame phase={phase}><main className="gm-flow-main"><aside className="gm-flow-panel"><div className="gm-flow-scroll"><p className="gm-kicker">{eyebrow ?? "MISSION FORGE / FLIGHT PLAN"}</p><h1>{title}</h1>{info && <div className="gm-flow-info">{info}</div>}<div className="gm-flow-choices">{children}</div></div><Actions back={back} next={next} label={nextLabel} onNext={onNext} /></aside><div className="gm-flow-stage">{media}</div></main></Frame>;
}
function Start() {
  const s = useMissionStore(); const { t } = useTranslation();
  return <Frame phase="menu"><main className="gm-home"><div className="gm-home-earth" style={{ backgroundImage: `url(${earth.url})` }} aria-label="NASA Blue Marble Earth" /><div className="gm-home-orbit" aria-hidden="true"><span /></div><div className="gm-home-copy"><p className="gm-kicker">NASA-INSPIRED SPACE MISSION SIMULATOR</p><h1>MISSION<br /><em>FORGE</em></h1><div className="gm-actions"><Button size="lg" onClick={() => s.newRun("missions")}><Rocket /> {t("ui.flow.start")} <ArrowRight /></Button><Button variant="secondary" onClick={() => s.set({ learn: "index" })}><BookOpen /> {t("ui.nav.learn")}</Button></div></div>{s.attempts > 0 && <div className="gm-home-readout"><small>{t("ui.home.current")}</small><b>{s.mission}</b><Button variant="ghost" onClick={() => s.go(s.phase === "menu" ? "missions" : s.phase)}>{t("ui.home.continue")} <ArrowRight /></Button></div>}<span className="gm-credit">EARTH TEXTURE: NASA VISIBLE EARTH · BLUE MARBLE</span></main></Frame>;
}
function Planet() {
  const s = useMissionStore(); const { t } = useTranslation(); const [selected, setSelected] = useState<MissionId>(s.mission);
  return <Layout phase="missions" title={t("ui.flow.planet")} back="menu" next="brief" nextLabel={t("ui.flow.mission")} onNext={() => s.set({ mission: selected })} media={<div className="gm-world-portrait"><img src={images[selected]} alt={selected} /><span>NASA IMAGE AND VIDEO LIBRARY</span><h2>{selected}</h2></div>}>
    <div className="gm-world-list">{ids.map(id => <Button key={id} variant="ghost" className={`gm-choice ${selected === id ? "on" : ""}`} onClick={() => setSelected(id)}><img src={images[id]} alt="" /><span>{id}</span>{selected === id && <Check />}</Button>)}</div>
  </Layout>;
}
function Objective() {
  const s = useMissionStore(); const { t } = useTranslation(); const m = MISSIONS[s.mission], b = BODIES[m.body];
  return <Layout phase="brief" title={t("ui.flow.mission")} back="missions" next="route" nextLabel={t("ui.flow.routePick")} media={<div className="gm-world-portrait"><img src={images[s.mission]} alt={s.mission} /><span>NASA IMAGE AND VIDEO LIBRARY</span><h2>{s.mission}</h2></div>}>
    <div className="gm-objective-list">{(["surface", "orbit", "survey"] as const).map(id => <Button key={id} variant="ghost" className={`gm-choice ${s.objective === id ? "on" : ""}`} onClick={() => s.set({ objective: id })}><span>{t(`ui.flow.${id}`)}<small>{id === "surface" && b.atmosphere === "gas" ? t("ui.flow.survey") : m.brief}</small></span>{s.objective === id && <Check />}</Button>)}</div><p className="gm-source">{SOURCES.factsheet}</p>
  </Layout>;
}
function RoutePick() {
  const s = useMissionStore(); const { t } = useTranslation();
  return <Layout phase="route" title={t("ui.flow.routePick")} back="brief" next="routePreview" nextLabel={t("ui.flow.review")} info={MISSIONS[s.mission].title} media={<div className="gm-scene-caption"><Compass size={26} /><span>{t("ui.game.dragMap")}</span><small>NASA/JPL · {t("ui.flow.gameEstimate")}: compressed visual scale</small></div>}>
    {(Object.keys(ROUTES) as RouteId[]).map(id => <Button key={id} variant="ghost" className={`gm-choice ${s.route === id ? "on" : ""}`} onClick={() => s.set({ route: id })}><span>{ROUTES[id].name}<small>{Math.round(MISSIONS[s.mission].days * ROUTES[id].time)} d · {(MISSIONS[s.mission].dv * ROUTES[id].dv).toFixed(2)} km/s</small></span>{s.route === id && <Check />}</Button>)}
  </Layout>;
}
function RoutePreview() {
  const s = useMissionStore(); const { t } = useTranslation(); const a = analyze(designOf(s));
  return <Layout phase="routePreview" title={t("ui.flow.routePreview")} back="route" next="objectives" nextLabel={t("ui.flow.confirmRoute")} info={`${s.mission} · ${ROUTES[s.route].name}`} media={<div className="gm-scene-caption"><Compass size={26} /><span>{t("ui.game.dragMap")}</span><small>NASA/JPL APPROXIMATE ORBITAL ELEMENTS · VISUAL DISTANCE COMPRESSED</small></div>}>
    <div className="gm-stat"><span>{t("ui.game.transit")}</span><b>{a.days} d</b></div><div className="gm-stat"><span>{t("ui.game.required")} Δv</span><b>{a.required.toFixed(2)} km/s</b></div><div className="gm-stat"><span>{t("ui.game.distance")}</span><b>{BODIES[s.mission].au} AU</b></div><LivePositions body={MISSIONS[s.mission].body} />
  </Layout>;
}
function ChoiceStep({ phase }: { phase: "objectives" | "budget" | "fuel" | "power" | "comms" | "instruments" }) {
  const s = useMissionStore(); const { t } = useTranslation(); const a = analyze(designOf(s));
  const chain: Phase[] = ["routePreview", "objectives", "budget", "fuel", "power", "comms", "instruments", "overview"];
  const pos = chain.indexOf(phase); const learn = () => s.set({ learn: phase === "power" || phase === "comms" ? "light" : phase === "objectives" ? "orbit" : "rocket" });
  const step = (label: string, value: number, min: number, max: number, change: (v: number) => void) => <div className="gm-step"><span>{label}</span><Button variant="secondary" size="icon" disabled={value <= min} aria-label={`Remove ${label}`} onClick={() => change(value - 1)}>−</Button><b>{value}</b><Button variant="secondary" size="icon" disabled={value >= max} aria-label={`Add ${label}`} onClick={() => change(value + 1)}>+</Button></div>;
  return <Layout phase={phase} title={t(`ui.flow.${phase}`)} back={chain[pos - 1] ?? "routePreview"} next={chain[pos + 1] ?? "overview"} media={<div className="gm-resource-display"><div className="gm-resource-orbit" /><p>{s.mission} / {ROUTES[s.route].name}</p><strong>{phase === "fuel" ? `${a.dv.toFixed(2)} km/s` : phase === "power" ? `${a.generation} kW` : phase === "comms" ? `${s.antennas} ×` : phase === "instruments" ? `${a.science}` : phase === "budget" ? `${fmt(a.wet)} kg` : `${a.days} d`}</strong><small>{phase === "fuel" ? `Δv / ${a.required.toFixed(2)} km/s required` : phase === "power" ? `${a.draw} kW demand` : phase === "budget" ? "SLS 95,000 kg orbit capacity" : t("ui.flow.gameEstimate")}</small></div>}>
    {phase === "objectives" && <>{step(t("ui.game.engineCount"), s.engines, 1, 3, v => s.set({ engines: v }))}<p className="gm-note">{t("ui.game.engine")} · {ENGINES[s.engine].name}</p></>}
    {phase === "budget" && <div className="gm-budget-list">{([1, 2, 3] as const).map(v => <Button variant="ghost" key={v} className={`gm-choice ${s.budget === v ? "on" : ""}`} onClick={() => s.set({ budget: v })}><span>{t(`ui.flow.${(["limited", "balanced", "expanded"] as const)[v - 1]}`)}<small>{v === 1 ? "Mass-first design" : v === 2 ? "Balanced mission resources" : "Maximum systems, more mass"}</small></span>{s.budget === v && <Check />}</Button>)}<p className="gm-note">{t("ui.flow.gameEstimate")}: budget tier affects your planning brief, not a real-world price.</p></div>}
    {phase === "fuel" && <>{step(t("ui.game.tanks"), s.tanks, 1, 4, v => s.set({ tanks: v }))}<label className="gm-range">{t("ui.game.fuelLoad")} <b>{s.fuel}%</b><input type="range" min="20" max="100" value={s.fuel} onChange={e => s.set({ fuel: +e.target.value })} /></label></>}
    {phase === "power" && <>{step(t("ui.game.solar"), s.wings, 0, 6, v => s.set({ wings: v }))}{step(t("ui.game.rtg"), s.rtgs, 0, 4, v => s.set({ rtgs: v }))}<Button variant={s.battery ? "default" : "secondary"} onClick={() => s.set({ battery: !s.battery })}>{t("ui.game.battery")} {s.battery && <Check />}</Button></>}
    {phase === "comms" && <>{step(t("ui.game.antennas"), s.antennas, 1, 2, v => s.set({ antennas: v }))}<Button variant={s.shield ? "default" : "secondary"} onClick={() => s.set({ shield: !s.shield })}>{t("ui.game.shield")} {s.shield && <Check />}</Button></>}
    {phase === "instruments" && (Object.keys(INSTRUMENTS) as Instrument[]).map(id => <Button key={id} variant="ghost" className={`gm-choice ${s.instruments.includes(id) ? "on" : ""}`} onClick={() => s.toggleInstrument(id)}><span>{INSTRUMENTS[id].name}<small>{INSTRUMENTS[id].mass} kg · {INSTRUMENTS[id].kw} kW</small></span>{s.instruments.includes(id) && <Check />}</Button>)}
    <Button variant="ghost" className="gm-learn-button" onClick={learn}><BookOpen /> {t("ui.flow.learn")}</Button><p className="gm-source">{SOURCES.orion} · {SOURCES.factsheet}</p>
  </Layout>;
}
function Overview() {
  const s = useMissionStore(); const { t } = useTranslation(); const a = analyze(designOf(s));
  return <Layout phase="overview" title={t("ui.flow.overview")} back="instruments" next="craft" nextLabel={t("ui.flow.craft")} media={<div className="gm-world-portrait"><img src={images[s.mission]} alt={s.mission} /><span>NASA IMAGE AND VIDEO LIBRARY</span><h2>{s.mission}</h2></div>}>
    <div className="gm-stat"><span>{t("ui.flow.mission")}</span><b>{t(`ui.flow.${s.objective}`)}</b></div><div className="gm-stat"><span>{t("ui.game.route")}</span><b>{ROUTES[s.route].name}</b></div><div className="gm-stat"><span>{t("ui.game.transit")}</span><b>{a.days} d</b></div><div className="gm-stat"><span>{t("ui.game.mass")}</span><b>{fmt(a.wet)} kg</b></div><div className="gm-stat"><span>{t("ui.game.power")}</span><b>{a.generation} / {a.draw} kW</b></div><div className="gm-stat"><span>{t("ui.game.installed")}</span><b>{s.instruments.length}</b></div>
  </Layout>;
}
const presets = {
  explorer: { engine: "chemical", engines: 1, tanks: 4, wings: 4, rtgs: 0, antennas: 1, shield: true, battery: false, instruments: ["camera"] },
  surveyor: { engine: "ion", engines: 1, tanks: 2, wings: 6, rtgs: 1, antennas: 2, shield: false, battery: true, instruments: ["camera", "spectrometer"] },
  guardian: { engine: "chemical", engines: 2, tanks: 4, wings: 4, rtgs: 2, antennas: 2, shield: true, battery: true, instruments: ["camera", "radiation"] },
} as const;
function Craft() {
  const s = useMissionStore(); const { t } = useTranslation();
  return <Layout phase="craft" title={t("ui.flow.craft")} back="overview" next="build" nextLabel={t("ui.flow.design")} media={<div className="gm-scene-caption"><Rocket size={27} /><span>{t("ui.game.dragCraft")}</span><small>ORION-INSPIRED · INTERACTIVE 3D SPACECRAFT</small></div>}>
    {(["explorer", "surveyor", "guardian"] as const).map(id => <Button key={id} variant="ghost" className={`gm-choice ${s.craft === id ? "on" : ""}`} onClick={() => s.set({ craft: id, ...presets[id], instruments: [...presets[id].instruments] })}><span>{t(`ui.flow.${id}`)}<small>{ENGINES[presets[id].engine].name} · {presets[id].wings} × {t("ui.game.solar")}</small></span>{s.craft === id && <Check />}</Button>)}<p className="gm-source">NASA-inspired configurations; {t("ui.flow.gameEstimate")}.</p>
  </Layout>;
}
type Category = "engine" | "fuel" | "power" | "comms" | "science";
function Hangar() {
  const s = useMissionStore(); const { t } = useTranslation(); const a = analyze(designOf(s)); const [tab, setTab] = useState<Category>("engine"); const categories: Category[] = ["engine", "fuel", "power", "comms", "science"];
  const step = (label: string, value: number, min: number, max: number, change: (v: number) => void) => <div className="gm-step"><span>{label}</span><Button variant="secondary" size="icon" disabled={value <= min} aria-label={`Remove ${label}`} onClick={() => change(value - 1)}>−</Button><b>{value}</b><Button variant="secondary" size="icon" disabled={value >= max} aria-label={`Add ${label}`} onClick={() => change(value + 1)}>+</Button></div>;
  return <Frame phase="build"><main className="gm-hangar"><div className="gm-hangar-head"><p className="gm-kicker">{t("ui.flow.build")}</p><h1>{t("ui.game.assemble")}</h1><span>{s.mission} · {ENGINES[s.engine].name}</span></div><aside className="gm-hangar-categories">{categories.map(id => <Button key={id} variant="ghost" className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{t(`ui.game.${id}`)} <ArrowRight /></Button>)}</aside><div className="gm-craft-view"><span className="gm-craft-tag">ORION-INSPIRED · INTERACTIVE 3D MODEL</span><span className="gm-craft-hint">{t("ui.game.dragCraft")}</span></div><aside className="gm-hangar-controls"><h2>{t(`ui.game.${tab}`)}</h2><div className="gm-control-scroll">
    {tab === "engine" && <>{(Object.keys(ENGINES) as EngineId[]).map(id => <Button key={id} variant="ghost" className={`gm-part ${s.engine === id ? "on" : ""}`} onClick={() => s.set({ engine: id })}><span><b>{ENGINES[id].name}</b><small>{ENGINES[id].isp} s Isp · {ENGINES[id].thrust}</small></span>{s.engine === id && <Check />}</Button>)}{step(t("ui.game.engineCount"), s.engines, 1, 3, v => s.set({ engines: v }))}</>}
    {tab === "fuel" && <>{step(t("ui.game.tanks"), s.tanks, 1, 4, v => s.set({ tanks: v }))}<label className="gm-range">{t("ui.game.fuelLoad")} <b>{s.fuel}%</b><input type="range" min="20" max="100" value={s.fuel} onChange={e => s.set({ fuel: +e.target.value })}/></label></>}
    {tab === "power" && <>{step(t("ui.game.solar"), s.wings, 0, 6, v => s.set({ wings: v }))}{step(t("ui.game.rtg"), s.rtgs, 0, 4, v => s.set({ rtgs: v }))}<Button variant={s.battery ? "default" : "secondary"} onClick={() => s.set({ battery: !s.battery })}>{t("ui.game.battery")} {s.battery && <Check />}</Button></>}
    {tab === "comms" && <>{step(t("ui.game.antennas"), s.antennas, 1, 2, v => s.set({ antennas: v }))}<Button variant={s.shield ? "default" : "secondary"} onClick={() => s.set({ shield: !s.shield })}>{t("ui.game.shield")} {s.shield && <Check />}</Button></>}
    {tab === "science" && (Object.keys(INSTRUMENTS) as Instrument[]).map(id => <Button key={id} variant="ghost" className={`gm-part ${s.instruments.includes(id) ? "on" : ""}`} onClick={() => s.toggleInstrument(id)}><span><b>{INSTRUMENTS[id].name}</b><small>{INSTRUMENTS[id].mass} kg · {INSTRUMENTS[id].kw} kW</small></span>{s.instruments.includes(id) && <Check />}</Button>)}<p className="gm-source">{SOURCES.orion} · {SOURCES.rl10} · {SOURCES.nstar}</p></div></aside>
    <footer className="gm-hangar-bottom"><Button variant="ghost" onClick={() => s.go("craft")}><ArrowLeft /> {t("ui.flow.back")}</Button><div className="gm-performance"><span>{t("ui.game.mass")}<b>{fmt(a.wet)} kg</b></span><span>Δv <b>{a.dv.toFixed(2)} / {a.required.toFixed(2)} km/s</b></span><span>{t("ui.game.power")}<b>{a.generation} / {a.draw} kW</b></span><span>{t("ui.game.readiness")}<b>{Math.max(1,a.readiness)} / 100</b></span></div><Button onClick={() => s.go("check")}>{t("ui.game.toCheck")} <ArrowRight /></Button></footer>
  </main></Frame>;
}
export function GameScreens({ phase }: { phase: Phase }) {
  switch (phase) {
    case "menu": return <Start />;
    case "missions": return <Planet />;
    case "brief": return <Objective />;
    case "route": return <RoutePick />;
    case "routePreview": return <RoutePreview />;
    case "objectives": case "budget": case "fuel": case "power": case "comms": case "instruments": return <ChoiceStep phase={phase} />;
    case "overview": return <Overview />;
    case "craft": return <Craft />;
    case "build": return <Hangar />;
    default: return null;
  }
}
