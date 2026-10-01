import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getNasa, type NasaResult } from "../../lib/nasa.functions";

type Row = { label: string; value: string; demo: boolean };

// Home-screen live NASA feed (APOD, NeoWs, DONKI). Every row is tagged DEMO DATA when served from fallback.
export function NasaFeed() {
  const call = useServerFn(getNasa);
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    let off = false;
    const safe = (source: "apod" | "neo" | "donki") => call({ data: { source } }).catch((): NasaResult => ({ source, live: false, cached: false, fetchedAt: "", data: "null" }));
    Promise.all([safe("apod"), safe("neo"), safe("donki")]).then(([apod, neo, donki]) => {
      if (off) return;
      const a = JSON.parse(apod.data) as { title?: string } | null, n = JSON.parse(neo.data) as { element_count?: number; objects?: { hazardous: boolean }[] } | null, d = JSON.parse(donki.data) as { events?: { classType?: string }[] } | null;
      const flare = d?.events?.at(-1);
      setRows([
        { label: "Astronomy Picture", value: a?.title ?? "Unavailable", demo: !apod.live },
        { label: "Near-Earth objects today", value: n ? `${n.element_count ?? 0} tracked · ${n.objects?.filter((o) => o.hazardous).length ?? 0} hazardous` : "Unavailable", demo: !neo.live },
        { label: "Latest solar flare", value: flare?.classType ? `Class ${flare.classType}` : "Quiet — none in 14 days", demo: !donki.live },
      ]);
    });
    return () => { off = true; };
  }, [call]);
  return (
    <div className="mf-nasa-feed" aria-live="polite">
      <span className="mf-nasa-kicker">NASA DATA DEMO</span>
      {!rows ? <p className="mf-nasa-row">Contacting NASA…</p> : rows.map((r) => (
        <p className="mf-nasa-row" key={r.label}><small>{r.label}{r.demo && <em className="mf-demo-tag">DEMO DATA</em>}</small><b>{r.value}</b></p>
      ))}
    </div>
  );
}
