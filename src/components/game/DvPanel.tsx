import { useTranslation } from "react-i18next";
import { ENGINES, G0, analyze, fmt } from "../../lib/mission-sim";
import { designOf, useMissionStore } from "../../stores/mission-store";

// Stage 6 — live Tsiolkovsky rocket equation for the current design. Every value comes from analyze() / ENGINES.
export function DvPanel() {
  const { t } = useTranslation();
  const s = useMissionStore();
  const a = analyze(designOf(s)), e = ENGINES[s.engine];
  const pct = Math.max(0, Math.min(100, (a.dv / Math.max(a.required, 0.01)) * 50));
  const tone = a.dvMargin < 0 ? "bad" : a.dvMargin < 0.1 ? "warn" : "ok";
  const fixes = a.dvMargin >= 0.1 ? [] : [t("ui.dv.fixTanks"), t("ui.dv.fixEngine"), t("ui.dv.fixMass")];
  return (
    <section className="mf-dv" aria-live="polite">
      <span className="mf-nasa-kicker">{t("ui.dv.title")}</span>
      <p className="mf-dv-eq">Δv = Isp · g₀ · ln(m₀ / m_f)</p>
      <p className="mf-dv-eq mf-dv-num">{a.dv.toFixed(2)} km/s = {e.isp} s · {G0} m/s² · ln({fmt(a.wet)} / {fmt(a.dry)} kg)</p>
      <div className="mf-dv-bar"><i className={tone} style={{ width: `${pct}%` }} /><span style={{ insetInlineStart: "50%" }} /></div>
      <p className="mf-dv-row"><span>{t("ui.dv.have")} <b>{a.dv.toFixed(2)} km/s</b></span><span>{t("ui.dv.need")} <b>{a.required.toFixed(2)} km/s</b></span></p>
      <p className={`mf-dv-verdict ${tone}`}>{t(`ui.dv.${tone}`, { pct: Math.round(a.dvMargin * 100) })}</p>
      {fixes.length > 0 && <ul>{fixes.map((f) => <li key={f}>{f}</li>)}</ul>}
      <p className="mf-dv-src">{t("ui.dv.src")}: {e.source}</p>
    </section>
  );
}
