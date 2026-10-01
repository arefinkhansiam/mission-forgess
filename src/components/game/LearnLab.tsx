import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { AU_KM, BODIES, LIGHT_KM_S, SOURCES, type BodyId } from "../../lib/nasa-data";
import { ENGINES } from "../../lib/mission-sim";
import { LANGS } from "../../locales/resources";
import { useMissionStore } from "../../stores/mission-store";
import { AyeshaAvatar } from "./Ayesha";
import mentorDoctorImg from "../../assets/mentor-doctor.jpg";
import { useVoice, VoiceBar } from "./voice";

const G0 = 9.80665;
type CId = "rocket" | "orbit" | "light";
const IDS: CId[] = ["rocket", "orbit", "light"];
const FORMULA: Record<CId, string> = { rocket: "Δv = Isp · g₀ · ln(m₀ / m_f)", orbit: "T² = a³", light: "P = P⊕ / d²     t = d / c" };
const SRC: Record<CId, string[]> = {
  rocket: ["NASA Glenn — Beginner's Guide to Rockets: Ideal Rocket Equation (grc.nasa.gov)", SOURCES.rl10, SOURCES.nstar, SOURCES.nerva],
  orbit: [SOURCES.factsheet, SOURCES.jplElements],
  light: [SOURCES.factsheet, "Speed of light c = 299,792.458 km/s (SI definition); 1 AU = 149,597,870.7 km (IAU 2012)"],
};
const LIGHT_BODIES: BodyId[] = ["Mercury", "Venus", "Mars", "Ceres", "Jupiter", "Saturn", "Uranus", "Neptune"];

function Demo({ id }: { id: CId }) {
  if (id === "rocket") return <svg viewBox="0 0 200 120" className="mf-demo" aria-hidden><g className="mf-demo-rocket"><path d="M100 18 l12 30 v34 h-24 v-34z" fill="#dfeaff" /><rect x="94" y="82" width="12" height="8" fill="#6d86ad" /></g>{[0, 1, 2, 3, 4].map((i) => <circle key={i} className="mf-demo-puff" style={{ animationDelay: `${i * 0.25}s` }} cx="100" cy="96" r="5" fill="#6dc1ff" />)}</svg>;
  if (id === "orbit") return <svg viewBox="0 0 200 120" className="mf-demo" aria-hidden><circle cx="100" cy="60" r="7" fill="#ffd27a" />{[22, 36, 52].map((r, i) => <g key={r}><circle cx="100" cy="60" r={r} fill="none" stroke="#2d5d9c" strokeWidth="0.8" /><g className="mf-demo-spin" style={{ animationDuration: `${Math.pow(r / 22, 1.5) * 3}s`, transformOrigin: "100px 60px" }}><circle cx={100 + r} cy="60" r={3 + i} fill={["#9c9189", "#2f6fd6", "#c1502e"][i]} /></g></g>)}</svg>;
  return <svg viewBox="0 0 200 120" className="mf-demo" aria-hidden><circle cx="30" cy="60" r="12" fill="#ffd27a" />{[1, 2, 3].map((k) => <circle key={k} className="mf-demo-wave" style={{ animationDelay: `${k * 0.6}s` }} cx="30" cy="60" r="14" fill="none" stroke="#ffd27a" />)}<rect x="150" y="50" width="22" height="20" fill="#2c5aa0" /></svg>;
}

function Interactive({ id }: { id: CId }) {
  const { t } = useTranslation();
  const [isp, setIsp] = useState(ENGINES.chemical.isp), [ratio, setRatio] = useState(3), [au, setAu] = useState(1.524), [body, setBody] = useState<BodyId>("Jupiter");
  if (id === "rocket") {
    const dv = (isp * G0 * Math.log(ratio)) / 1000;
    return <div className="mf-inter"><label>{t("concepts.rocket.isp")}: <b>{isp} s</b><input type="range" min={300} max={3100} step={1} value={isp} onChange={(e) => setIsp(+e.target.value)} /></label>
      <div className="mf-chips">{Object.values(ENGINES).map((e) => <button key={e.name} onClick={() => setIsp(e.isp)} className={isp === e.isp ? "on" : ""}>{e.name} · {e.isp} s</button>)}</div>
      <label>{t("concepts.rocket.ratio")}: <b>{ratio.toFixed(1)}</b><input type="range" min={1.1} max={10} step={0.1} value={ratio} onChange={(e) => setRatio(+e.target.value)} /></label>
      <p className="mf-result">{t("ui.learn.result")}: Δv = <b>{dv.toFixed(2)} km/s</b></p></div>;
  }
  if (id === "orbit") {
    const years = Math.sqrt(au ** 3);
    const near = Object.values(BODIES).filter((b) => b.L0 !== null).sort((a, b) => Math.abs(a.au - au) - Math.abs(b.au - au))[0]!;
    return <div className="mf-inter"><label>{t("concepts.orbit.dist")}: <b>{au.toFixed(2)} AU</b><input type="range" min={0.3} max={31} step={0.01} value={au} onChange={(e) => setAu(+e.target.value)} /></label>
      <p className="mf-result">{t("ui.learn.result")}: T = <b>{years.toFixed(2)}</b> yr · {near.id} (NASA): <b>{(near.periodDays / 365.25).toFixed(2)}</b> yr</p></div>;
  }
  const b = BODIES[body], power = 100 / b.au ** 2, delayMin = (b.au - 1 > 0 ? b.au - 1 : 1 - b.au) * AU_KM / LIGHT_KM_S / 60;
  return <div className="mf-inter"><div className="mf-chips">{LIGHT_BODIES.map((x) => <button key={x} onClick={() => setBody(x)} className={body === x ? "on" : ""}>{x}</button>)}</div>
    <p className="mf-result">{t("concepts.light.power")}: <b>{power >= 10 ? power.toFixed(0) : power.toFixed(1)}%</b></p>
    <p className="mf-result">{t("concepts.light.delay")}: <b>{delayMin.toFixed(1)} min</b> <small>(closest approach, {b.au} AU from Sun)</small></p></div>;
}

function Quiz({ id }: { id: CId }) {
  const { t } = useTranslation();
  const opts = t(`concepts.${id}.a`, { returnObjects: true }) as string[], correct = t(`concepts.${id}.correct`, { returnObjects: true }) as unknown as number;
  const [pick, setPick] = useState<number | null>(null), [checked, setChecked] = useState(false);
  return <div className="mf-quiz"><p className="mf-q">{t(`concepts.${id}.q`)}</p>{opts.map((o, i) => <button key={o} className={pick === i ? "on" : ""} onClick={() => { setPick(i); setChecked(false); }}>{o}</button>)}
    <button className="mf-primary" disabled={pick === null} onClick={() => setChecked(true)}>{t("ui.learn.check")}</button>
    {checked && <p className={pick === correct ? "mf-ok" : "mf-bad"}>{pick === correct ? `${t("ui.learn.correct")} ${t(`concepts.${id}.explain`)}` : t("ui.learn.wrong")}</p>}</div>;
}

export function LearnLab() {
  const { t } = useTranslation();
  const s = useMissionStore(); const voice = useVoice();
  const [step, setStep] = useState(0);
  const id = (IDS as string[]).includes(s.learn ?? "") ? (s.learn as CId) : null;
  useEffect(() => { setStep(0); voice.stop(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!s.learn) return null;
  const rtl = LANGS.find((l) => l.id === s.lang && "rtl" in l);
  const steps = t("ui.steps", { returnObjects: true }) as string[];
  const text = !id ? `${t("ui.learn.mentorGreeting")} ${t("ui.learn.pick")}` : step === 0 ? `${t(`concepts.${id}.ayesha`)} ${t(`concepts.${id}.simple`)}` : step === 1 ? t(`concepts.${id}.demo`) : step === 2 ? t(`concepts.${id}.interactive`) : step === 3 ? t(`concepts.${id}.science`) : step === 4 ? t(`concepts.${id}.formulaNote`) : step === 5 ? t(`concepts.${id}.q`) : t("ui.learn.source");
  return (
    <div className="mf-learn" dir={rtl ? "rtl" : "ltr"} role="dialog" aria-label={t("ui.learn.title")}>
      <header><h2>{t("ui.learn.title")}</h2><button className="mf-icon" onClick={() => { voice.stop(); s.set({ learn: null }); }} aria-label={t("ui.learn.close")}><X size={22} /></button></header>
      {!id ? <>
        <div className="mf-learn-mentor-card">
          <div className="mf-mentor-portrait-wrap">
            <img src={mentorDoctorImg} alt={t("ui.ayesha.name")} className="mf-mentor-portrait-figure" />
            <span className="mf-mentor-badge-online">ONLINE</span>
          </div>
          <div className="mf-mentor-info">
            <span className="mf-mentor-tag">{t("ui.learn.mentorTitle")}</span>
            <h3 className="mf-mentor-name">{t("ui.ayesha.name")}</h3>
            <p className="mf-mentor-quote">{t("ui.learn.mentorGreeting")}</p>
          </div>
        </div>
        <p className="mf-lead">{t("ui.learn.pick")}</p>
        <div className="mf-concepts">{IDS.map((c) => <button key={c} onClick={() => s.set({ learn: c })}><b>{t(`concepts.${c}.title`)}</b><span>{t(`concepts.${c}.simple`)}</span></button>)}</div>
        <VoiceBar text={text} voice={voice} />
      </> : <>
        <button className="mf-link" onClick={() => s.set({ learn: "index" })}><ArrowLeft size={16} />{t("ui.learn.back")}</button>
        <div className="mf-mentor-concept-header">
          <h3>{t(`concepts.${id}.title`)}</h3>
          <div className="mf-mentor-chip">
            <AyeshaAvatar className="mf-mentor-chip-avatar" />
            <span>{t("ui.ayesha.name")}</span>
          </div>
        </div>
        <div className="mf-steps">{steps.map((x, i) => <button key={x} aria-label={x} className={i === step ? "on" : i < step ? "done" : ""} onClick={() => setStep(i)} />)}</div>
        <p className="mf-step-label">{t("ui.learn.step", { n: step + 1 })} · {steps[step]}</p>
        {step === 0 && (
          <div className="mf-mentor-concept-hero">
            <div className="mf-mentor-hero-avatar">
              <img src={mentorDoctorImg} alt={t("ui.ayesha.name")} className="mf-mentor-figure-circle" />
              <span className="mf-mentor-badge-online">MENTOR</span>
            </div>
            <div className="mf-mentor-speech-bubble">
              <div className="mf-mentor-header-mini">
                <b>{t("ui.ayesha.name")}</b>
                <small>{t("ui.ayesha.role")}</small>
              </div>
              <p>{t(`concepts.${id}.ayesha`)}</p>
            </div>
          </div>
        )}
        {step === 0 && <p className="mf-body">{t(`concepts.${id}.simple`)}</p>}
        {step === 1 && <><Demo id={id} /><p className="mf-body">{t(`concepts.${id}.demo`)}</p></>}
        {step === 2 && <><p className="mf-body">{t(`concepts.${id}.interactive`)}</p><Interactive id={id} /></>}
        {step === 3 && <p className="mf-body">{t(`concepts.${id}.science`)}</p>}
        {step === 4 && <><p className="mf-formula" dir="ltr">{FORMULA[id]}</p><p className="mf-body">{t(`concepts.${id}.formulaNote`)}</p></>}
        {step === 5 && <Quiz id={id} />}
        {step === 6 && <ul className="mf-sources">{SRC[id].map((x) => <li key={x}>{x}</li>)}</ul>}
        <VoiceBar text={text} voice={voice} />
        <nav className="mf-step-nav"><button disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={16} />{t("ui.learn.prev")}</button>{step < 6 ? <button className="mf-primary" onClick={() => setStep(step + 1)}>{t("ui.learn.next")}<ArrowRight size={16} /></button> : <button className="mf-primary" onClick={() => s.set({ learn: "index" })}>{t("ui.learn.back")}</button>}</nav>
      </>}
    </div>
  );
}
