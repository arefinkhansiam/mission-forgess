import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { getNasa } from "../../lib/nasa.functions";
import { AU_KM, BODIES, LIGHT_KM_S, bodyAngle, daysSinceJ2000, distanceKm, type BodyId } from "../../lib/nasa-data";

// JPL Horizons IDs (heliocentric vectors).
const HID: Partial<Record<BodyId, string>> = { Earth: "399", Moon: "301", Mars: "499", Venus: "299", Mercury: "199", Ceres: "2000001", Jupiter: "599", Saturn: "699" };
type V = { x: number; y: number; z: number };

// Stage 5 — today's real Earth–target distance from NASA/JPL Horizons; falls back to JPL mean elements (labeled DEMO DATA).
export function LivePositions({ body }: { body: BodyId }) {
  const { t } = useTranslation();
  const call = useServerFn(getNasa);
  const [res, setRes] = useState<{ km: number; live: boolean } | null>(null);
  useEffect(() => {
    let off = false;
    setRes(null);
    const get = (id: string) => call({ data: { source: "horizons", arg: id } }).then((r) => ({ live: r.live && "x" in (JSON.parse(r.data) as object), v: JSON.parse(r.data) as V }));
    Promise.all([get(HID.Earth!), get(HID[body]!)]).then(([e, b]) => {
      if (off) return;
      if (e.live && b.live) setRes({ km: Math.hypot(e.v.x - b.v.x, e.v.y - b.v.y, e.v.z - b.v.z) * AU_KM, live: true });
      else throw new Error("fallback");
    }).catch(() => {
      if (off) return;
      const d = daysSinceJ2000(Date.now());
      const km = body === "Moon" ? BODIES.Moon.au * AU_KM : distanceKm(1, bodyAngle("Earth", d), BODIES[body].au, bodyAngle(body, d));
      setRes({ km, live: false });
    });
    return () => { off = true; };
  }, [call, body]);
  const delay = res ? res.km / LIGHT_KM_S : 0;
  return (
    <div className="mf-live-pos" aria-live="polite">
      <span className="mf-nasa-kicker">{t("ui.live.title")}{res && !res.live && <em className="mf-demo-tag">DEMO DATA</em>}</span>
      {!res ? <p>{t("ui.live.loading")}</p> : <>
        <p><small>{t("ui.live.distance", { body })}</small><b>{(res.km / 1e6).toFixed(res.km < 1e7 ? 3 : 1)} M km · {(res.km / AU_KM).toFixed(3)} AU</b></p>
        <p><small>{t("ui.live.delay")}</small><b>{delay < 120 ? `${delay.toFixed(1)} s` : `${(delay / 60).toFixed(1)} min`}</b></p>
        <p className="mf-live-src">{res.live ? t("ui.live.srcLive") : t("ui.live.srcDemo")}</p>
      </>}
    </div>
  );
}
