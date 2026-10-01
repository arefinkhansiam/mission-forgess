import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getNasa } from "../../lib/nasa.functions";
import { AU_KM, BODIES, LIGHT_KM_S, SOURCES } from "../../lib/nasa-data";
import { MISSIONS, fmt } from "../../lib/mission-sim";
import { useMissionStore } from "../../stores/mission-store";

type Img = { title?: string; center?: string; url?: string };

// Stage 4 — Mission brief: verified target facts + a live NASA Image Library photo (DEMO DATA when offline).
export function MissionBrief() {
  const { t } = useTranslation();
  const s = useMissionStore();
  const m = MISSIONS[s.mission], b = BODIES[m.body];
  const call = useServerFn(getNasa);
  const [img, setImg] = useState<{ item: Img | null; demo: boolean } | null>(null);
  useEffect(() => {
    let off = false;
    setImg(null);
    call({ data: { source: "images", arg: `${m.body} planet`.replace("Moon planet", "Moon surface") } })
      .then((r) => { const d = JSON.parse(r.data) as { items?: Img[] }; if (!off) setImg({ item: d.items?.find((i) => i.url) ?? null, demo: !r.live }); })
      .catch(() => !off && setImg({ item: null, demo: true }));
    return () => { off = true; };
  }, [call, m.body]);

  const sunAu = m.body === "Moon" ? BODIES.Earth.au : b.au;
  // Average Earth–target distance ≈ target's mean solar distance for planets (time-averaged); Moon uses Earth–Moon distance.
  const avgAu = b.au;
  const delaySec = (avgAu * AU_KM) / LIGHT_KM_S;
  const delay = delaySec < 120 ? `${delaySec.toFixed(1)} s` : `${(delaySec / 60).toFixed(1)} min`;
  const facts: [string, string][] = [
    [t("ui.brief.diameter"), `${fmt(b.diameterKm)} km`],
    [t("ui.brief.distance"), `${sunAu} AU`],
    [t("ui.brief.period"), `${fmt(b.periodDays)} d`],
    [t("ui.brief.gravity"), `${b.gravity} m/s²`],
    [t("ui.brief.signal"), delay],
    [t("ui.brief.dv"), `${m.dv} km/s`],
    [t("ui.brief.duration"), `${fmt(m.days)} d`],
  ];

  return (
    <div className="mf-brief">
      <div className="mf-brief-inner">
        <span className="mf-nasa-kicker">{t("ui.brief.kicker")}</span>
        <h1>{m.title}</h1>
        <p className="mf-brief-lead"><b>{t("ui.brief.objective")}:</b> {m.brief}</p>
        <div className="mf-brief-grid">
          <section>
            <h2>{t("ui.brief.target")} · {b.id}</h2>
            <dl>{facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            <h2>{t("ui.brief.why")}</h2>
            <p>{b.why}</p>
          </section>
          <figure>
            {!img ? <p>{t("ui.brief.loading")}</p> : img.item?.url ? <img src={img.item.url} alt={img.item.title ?? b.id} loading="lazy" /> : <p>{t("ui.brief.none")}</p>}
            <figcaption>{t("ui.brief.image")}{img?.item?.title ? ` — ${img.item.title}` : ""}{img?.item?.center ? ` (${img.item.center})` : ""} {img?.demo && <em className="mf-demo-tag">DEMO DATA</em>}</figcaption>
          </figure>
        </div>
        <p className="mf-brief-src">{t("ui.brief.source")}: {SOURCES.factsheet} · NASA/JPL Δv budgets · NASA Image and Video Library (images.nasa.gov)</p>
        <div className="mf-brief-actions">
          <button className="mf-link" onClick={() => s.go("missions")}><ArrowLeft size={18} />{t("ui.brief.back")}</button>
          <button className="mf-primary" onClick={() => s.go("route")}>{t("ui.brief.plan")}<ArrowRight size={18} /></button>
        </div>
      </div>
    </div>
  );
}
