import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import i18n from "../../lib/i18n";
import { LearnLab } from "./LearnLab";
import { Ayesha } from "./Ayesha";
import { useMissionStore } from "../../stores/mission-store";
import { Universe } from "./Universe";
import { BuildScene, DockingScene, LandingScene, LaunchScene } from "./Stages";
import { Hud } from "./Hud";
import { rt } from "./runtime";

export function Game() {
  const phase = useMissionStore((s) => s.phase), cam = useMissionStore((s) => s.cam), quality = useMissionStore((s) => s.quality);
  const lang = useMissionStore((s) => s.lang);
  useEffect(() => { void i18n.changeLanguage(lang); document.documentElement.lang = lang; }, [lang]);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const cockpit = cam === "cockpit" && (phase === "flight" || phase === "encounter");
  const scene = ["craft", "build", "check"].includes(phase) ? <BuildScene /> : phase === "launch" ? <LaunchScene /> : phase === "docking" ? <DockingScene /> : phase === "landing" || phase === "report" ? <LandingScene /> : <Universe />;
  const rotated = () => window.matchMedia("(orientation: portrait)").matches;
  return (
    <div className="mf-game-stage"><div className="mf-game-viewport">
      <div
        className="absolute inset-0 touch-none select-none overflow-hidden bg-background"
        onPointerDown={(e) => { if (cockpit) drag.current = { x: e.clientX, y: e.clientY }; }}
        onPointerMove={(e) => {
          if (!drag.current || !cockpit) return;
          let dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
          if (rotated()) [dx, dy] = [dy, -dx];
          drag.current = { x: e.clientX, y: e.clientY };
          rt.yaw = Math.max(-1.6, Math.min(1.6, rt.yaw - dx * 0.004));
          rt.pitch = Math.max(-0.9, Math.min(0.9, rt.pitch - dy * 0.004));
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerLeave={() => { drag.current = null; }}
      >
        <Canvas key={["craft", "build", "check"].includes(phase) ? "b" : phase} dpr={quality === "high" ? [1, 2] : 1} camera={{ position: [0, 3, 8], fov: 55, near: 0.005, far: 2000 }} gl={{ antialias: quality === "high" }}>
          <Suspense fallback={null}>{scene}</Suspense>
        </Canvas>
        <Hud />
        <Ayesha />
        <LearnLab />
      </div>
    </div></div>
  );
}
