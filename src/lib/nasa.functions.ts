import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Server-side NASA proxy with database cache and labeled demo fallback (§A, §D, §47).
export type NasaSource = "apod" | "neo" | "donki" | "epic" | "mars" | "images" | "horizons" | "sbdb" | "sentry";
export type NasaResult = { source: NasaSource; live: boolean; cached: boolean; fetchedAt: string; data: string };

const TTL_HOURS: Record<NasaSource, number> = { apod: 12, neo: 12, donki: 3, epic: 12, mars: 48, images: 168, horizons: 24, sbdb: 168, sentry: 24 };

const DEMO: Record<NasaSource, unknown> = {
  apod: { title: "The Blue Marble (demo data)", explanation: "Offline sample. Live Astronomy Picture of the Day appears when NASA's service is reachable.", url: null, media_type: "image", date: "2012-01-25" },
  neo: { element_count: 2, objects: [{ name: "(2024 DEMO1)", diameter_m: 140, velocity_kms: 12.4, hazardous: true, miss_km: 4200000 }, { name: "(2024 DEMO2)", diameter_m: 35, velocity_kms: 8.1, hazardous: false, miss_km: 1500000 }] },
  donki: { events: [{ type: "FLR", classType: "M1.2", time: "demo" }] },
  epic: { images: [] },
  mars: { photos: [] },
  images: { items: [] },
  horizons: { note: "Using NASA/JPL approximate mean elements (built-in) instead of live Horizons ephemeris." },
  sbdb: { object: { fullname: "1 Ceres (demo)", kind: "dwarf planet" }, elements: { a_au: 2.77, e: 0.0785, i_deg: 10.59 } },
  sentry: { count: 0, data: [] },
};

const today = () => new Date().toISOString().slice(0, 10);

async function fetchLive(source: NasaSource, arg: string | undefined, key: string): Promise<unknown> {
  const j = async (url: string) => { const r = await fetch(url, { signal: AbortSignal.timeout(9000) }); if (!r.ok) throw new Error(`${source} ${r.status}`); return r.json(); };
  switch (source) {
    case "apod": return j(`https://api.nasa.gov/planetary/apod?api_key=${key}`);
    case "neo": {
      const d = today();
      const raw = await j(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${d}&end_date=${d}&api_key=${key}`) as { element_count: number; near_earth_objects: Record<string, Array<any>> };
      const list = Object.values(raw.near_earth_objects).flat().slice(0, 12).map((o) => ({
        name: o.name, diameter_m: Math.round(o.estimated_diameter?.meters?.estimated_diameter_max ?? 0), hazardous: !!o.is_potentially_hazardous_asteroid,
        velocity_kms: Number(o.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second ?? 0), miss_km: Number(o.close_approach_data?.[0]?.miss_distance?.kilometers ?? 0),
      }));
      return { element_count: raw.element_count, objects: list };
    }
    case "donki": {
      const end = today(), start = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);
      const f = await j(`https://api.nasa.gov/DONKI/FLR?startDate=${start}&endDate=${end}&api_key=${key}`) as Array<any>;
      return { events: (f ?? []).slice(-8).map((e) => ({ type: "FLR", classType: e.classType, time: e.peakTime ?? e.beginTime })) };
    }
    case "epic": {
      const a = await j(`https://api.nasa.gov/EPIC/api/natural?api_key=${key}`) as Array<{ image: string; date: string; caption: string }>;
      return { images: a.slice(0, 4).map((i) => { const [y, m, d] = i.date.slice(0, 10).split("-"); return { date: i.date, caption: i.caption, url: `https://epic.gsfc.nasa.gov/archive/natural/${y}/${m}/${d}/jpg/${i.image}.jpg` }; }) };
    }
    case "mars": {
      const a = await j(`https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/latest_photos?api_key=${key}`) as { latest_photos: Array<any> };
      return { photos: a.latest_photos.slice(0, 6).map((p) => ({ url: p.img_src, camera: p.camera?.full_name, sol: p.sol, date: p.earth_date })) };
    }
    case "images": {
      const a = await j(`https://images-api.nasa.gov/search?media_type=image&q=${encodeURIComponent(arg || "Orion spacecraft")}`) as { collection: { items: Array<any> } };
      return { items: a.collection.items.slice(0, 6).map((i) => ({ title: i.data?.[0]?.title, center: i.data?.[0]?.center, url: i.links?.[0]?.href })) };
    }
    case "sbdb": return j(`https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=${encodeURIComponent(arg || "Ceres")}`);
    case "sentry": { const a = await j(`https://ssd-api.jpl.nasa.gov/sentry.api`) as { count: string; data: unknown[] }; return { count: Number(a.count), data: (a.data ?? []).slice(0, 10) }; }
    case "horizons": {
      const id = arg || "499";
      const t = today(), t2 = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
      const a = await j(`https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='${id}'&EPHEM_TYPE='VECTORS'&CENTER='500@10'&START_TIME='${t}'&STOP_TIME='${t2}'&STEP_SIZE='1d'&OUT_UNITS='AU-D'&VEC_TABLE='1'`) as { result: string };
      const m = a.result.match(/X =\s*([-\dE.+]+)\s*Y =\s*([-\dE.+]+)\s*Z =\s*([-\dE.+]+)/);
      if (!m) throw new Error("horizons unparsed");
      return { id, date: t, x: Number(m[1]), y: Number(m[2]), z: Number(m[3]) };
    }
  }
}

export const getNasa = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ source: z.enum(["apod", "neo", "donki", "epic", "mars", "images", "horizons", "sbdb", "sentry"]), arg: z.string().max(60).regex(/^[\w\s.\-()]*$/).optional() }).parse(d))
  .handler(async ({ data }): Promise<NasaResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cacheKey = `${data.source}:${data.arg ?? ""}`;
    const { data: row } = await supabaseAdmin.from("nasa_cache").select("payload,fetched_at").eq("key", cacheKey).maybeSingle();
    const fresh = row && Date.now() - new Date(row.fetched_at).getTime() < TTL_HOURS[data.source] * 36e5;
    if (row && fresh) return { source: data.source, live: true, cached: true, fetchedAt: row.fetched_at, data: JSON.stringify(row.payload) };
    try {
      const payload = await fetchLive(data.source, data.arg, process.env["NASA_API_KEY"] || "DEMO_KEY");
      const fetchedAt = new Date().toISOString();
      await supabaseAdmin.from("nasa_cache").upsert({ key: cacheKey, payload: payload as never, fetched_at: fetchedAt });
      return { source: data.source, live: true, cached: false, fetchedAt, data: JSON.stringify(payload) };
    } catch (e) {
      console.error("NASA fetch failed", data.source, e);
      if (row) return { source: data.source, live: true, cached: true, fetchedAt: row.fetched_at, data: JSON.stringify(row.payload) };
      return { source: data.source, live: false, cached: false, fetchedAt: new Date().toISOString(), data: JSON.stringify(DEMO[data.source]) };
    }
  });
