import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { getNasa } from "../../lib/nasa.functions";
import { analyze, LAUNCH_LIMIT } from "../../lib/mission-sim";
import { designOf, useMissionStore } from "../../stores/mission-store";

type V = "go" | "hold" | "nogo";
// Stage 7 — Flight Director GO/NO-GO poll. Verdicts derive only from analyze() and live NASA DONKI flares.
export function GoPoll({ onReady }: { onReady: (ok: boolean) => void }) {
  const { t } = useTranslation();
  const s = useMissionStore(); const d = designOf(s); const a = analyze(d);
  const call = useServerFn(getNasa);
  const [flare, setFlare] = useState<{ cls: string; recent: boolean; demo: boolean } | null>(null);
  const [ack, setAck] = useState(false);
  const [polled, setPolled] = useState(0);
  useEffect(() => {
    call({ data: { source: "donki" } }).then((r) => {
      const ev = (JSON.parse(r.data) as { events?: { classType?: string; peakTime?: string }[] } | null)?.events ?? [];
      const last = ev[ev.length - 1];
      const recent = !!last?.peakTime && Date.now() - Date.parse(last.peakTime) < 864e5;
      setFlare({ cls: last?.classType ?? "", recent, demo: !r.live });
    }).catch(() => setFlare({ cls: "", recent: false, demo: true }));
  }, [call]);
  const strong = !!flare && flare.recent && /^[XM]/.test(flare.cls);
  const rows: { k: string; v: V; why: string }[] = [
    { k: "booster", v: a.wet > LAUNCH_LIMIT ? "nogo" : "go", why: t("ui.poll.booster", { pct: Math.round((a.wet / LAUNCH_LIMIT) * 100) }) },
    { k: "prop", v: a.dvMargin < 0 ? "nogo" : a.dvMargin < 0.1 ? "hold" : "go", why: t("ui.poll.prop", { pct: Math.round(a.dvMargin * 100) }) },
    { k: "power", v: a.powerMargin < 0 ? "nogo" : a.powerMargin < 0.15 ? "hold" : "go", why: t("ui.poll.power", { gen: a.generation, draw: a.draw }) },
    { k: "comms", v: d.antennas < 2 ? "hold" : "go", why: t("ui.poll.comms", { n: d.antennas }) },
    { k: "shield", v: a.hazard > 0.3 && !d.shield ? "hold" : "go", why: t("ui.poll.shield", { pct: Math.round(a.hazard * 100) }) },
    { k: "science", v: a.science === 0 ? "hold" : "go", why: t("ui.poll.science", { n: a.science }) },
    { k: "weather", v: !flare ? "hold" : strong ? "hold" : "go", why: !flare ? t("ui.poll.loading") : flare.cls ? t("ui.poll.weather", { cls: flare.cls }) + (flare.demo ? " · DEMO DATA" : " · NASA DONKI") : t("ui.poll.quiet") },
  ];
  const nogo = rows.some((r) => r.v === "nogo"), holds = rows.filter((r) => r.v === "hold").length;
  const ok = (nogo || holds > 0 ? ack : true) && polled >= rows.length;
  useEffect(() => { onReady(ok); }, [ok, onReady]);
  useEffect(() => { setPolled(0); const id = setInterval(() => setPolled((p) => (p >= rows.length ? p : p + 1)), 280); return () => clearInterval(id); }, [rows.length]);
  return (
    <section className="mf-poll" aria-live="polite">
      <span className="mf-nasa-kicker">{t("ui.poll.title")}</span>
      <ul>{rows.map((r, i) => (
        <li key={r.k} className={i < polled ? "on" : ""}>
          <span><b>{t(`ui.poll.name.${r.k}`)}</b><small>{r.why}</small></span>
          <em className={i < polled ? r.v : ""}>{i < polled ? t(`ui.poll.${r.v}`) : "…"}</em>
        </li>
      ))}</ul>
      {nogo && <p className="mf-poll-note nogo">{t("ui.poll.blocked")}</p>}
      {(nogo || holds > 0) && polled >= rows.length && (
        <label className="mf-poll-ack"><input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} /> {t("ui.poll.accept", { n: holds })}</label>
      )}
      {ok && <p className="mf-poll-note go">{t("ui.poll.allgo")}</p>}
    </section>
  );
}
