import { useFrame, useThree } from "@react-three/fiber";
import { Billboard, Line, OrbitControls, Stars } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OC } from "three-stdlib";
import { BODIES, PLANET_ORDER, visRadius, visSize, type BodyId } from "../../lib/nasa-data";
import { analyze, MISSIONS } from "../../lib/mission-sim";
import { designOf, useMissionStore } from "../../stores/mission-store";
import { Spacecraft, Flame } from "./Spacecraft";
import earthAsset from "../../assets/nasa-earth-blue-marble.jpg.asset.json";
import { bodyVisPos, nearestBody, pathAU, pathPoint, rt, useTick } from "./runtime";

function rng(seed: number) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

function planetTexture(id: BodyId) {
  const b = BODIES[id], c = document.createElement("canvas"); c.width = 512; c.height = 256;
  const g = c.getContext("2d")!, r = rng(id.length * 977 + 13);
  g.fillStyle = b.color; g.fillRect(0, 0, 512, 256);
  if (b.atmosphere === "gas") {
    for (let y = 0; y < 256; y += 4 + r() * 10) { g.fillStyle = r() > 0.5 ? b.color2 : "#f3e6cf"; g.globalAlpha = 0.15 + r() * 0.35; g.fillRect(0, y, 512, 3 + r() * 12); }
    if (id === "Jupiter") { g.globalAlpha = 0.8; g.fillStyle = "#b5533a"; g.beginPath(); g.ellipse(340, 165, 26, 13, 0, 0, 7); g.fill(); }
  } else if (id === "Earth") {
    g.fillStyle = "#1d4fa8"; g.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 70; i++) { g.fillStyle = r() > 0.35 ? "#3c7d3f" : "#9a8657"; g.globalAlpha = 0.9; g.beginPath(); g.ellipse(r() * 512, 40 + r() * 176, 10 + r() * 40, 6 + r() * 24, r() * 3, 0, 7); g.fill(); }
    g.fillStyle = "#f4f7fb"; g.fillRect(0, 0, 512, 14); g.fillRect(0, 242, 512, 14);
  } else if (id === "Venus") {
    g.fillStyle = "#e3c48d"; g.fillRect(0, 0, 512, 256);
    for (let y = 0; y < 256; y += 3 + r() * 7) {
      g.fillStyle = r() > 0.4 ? "#b58f55" : "#faecd0";
      g.globalAlpha = 0.2 + r() * 0.3;
      g.beginPath();
      g.ellipse(256 + Math.sin(y * 0.04) * 45, y, 280, 5 + r() * 6, 0.05, 0, 7);
      g.fill();
    }
  } else if (id === "Mercury") {
    g.fillStyle = "#8c837b"; g.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 300; i++) {
      g.fillStyle = r() > 0.5 ? "#b8b1a8" : "#5a544f";
      g.globalAlpha = 0.08 + r() * 0.3;
      g.beginPath();
      g.arc(r() * 512, r() * 256, 1 + r() * 12, 0, 7);
      g.fill();
    }
    g.fillStyle = "#e4ded6"; g.globalAlpha = 0.6; g.beginPath(); g.arc(210, 120, 7, 0, 7); g.fill();
  } else {
    for (let i = 0; i < 260; i++) { g.fillStyle = r() > 0.5 ? b.color2 : "#ffffff"; g.globalAlpha = 0.05 + r() * 0.18; g.beginPath(); g.arc(r() * 512, r() * 256, 1 + r() * 14, 0, 7); g.fill(); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function Planet({ id, focus }: { id: BodyId; focus: boolean }) {
  const ref = useRef<THREE.Group>(null), spin = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => planetTexture(id), [id]);
  const earth = useMemo(() => { if (id !== "Earth") return null; const t = new THREE.TextureLoader().load(earthAsset.url); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }, [id]);
  const size = visSize(id);
  useFrame(() => {
    if (ref.current) bodyVisPos(id, rt.days, ref.current.position);
    if (spin.current) spin.current.rotation.y = id === "Earth" ? performance.now() * 0.00012 + rt.days * 0.02 : rt.days * 0.8;
  });
  return (
    <group ref={ref}>
      <mesh ref={spin} rotation-z={id === "Uranus" ? 1.7 : 0.4}><sphereGeometry args={[size, 48, 24]} /><meshStandardMaterial map={earth ?? tex} roughness={0.9} emissive={focus ? "#113a6b" : "#000"} emissiveIntensity={0.4} /></mesh>
      {id === "Earth" && <mesh scale={1.04}><sphereGeometry args={[size, 32, 16]} /><meshBasicMaterial color="#6fb6ff" transparent opacity={0.16} blending={THREE.AdditiveBlending} side={THREE.BackSide} /></mesh>}
      {id === "Venus" && <mesh scale={1.04}><sphereGeometry args={[size, 32, 16]} /><meshBasicMaterial color="#ffd894" transparent opacity={0.18} blending={THREE.AdditiveBlending} side={THREE.BackSide} /></mesh>}
      {id === "Saturn" && <mesh rotation-x={-Math.PI / 2 + 0.45}><ringGeometry args={[size * 1.3, size * 2.2, 64]} /><meshStandardMaterial color="#d6c49a" transparent opacity={0.7} side={THREE.DoubleSide} /></mesh>}
    </group>
  );
}

function OrbitRing({ au, highlight }: { au: number; highlight: boolean }) {
  const pts = useMemo(() => Array.from({ length: 129 }, (_, i) => { const a = (i / 128) * Math.PI * 2, r = visRadius(au); return new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r); }), [au]);
  return <Line points={pts} color={highlight ? "#7cc4ff" : "#2d5d9c"} lineWidth={highlight ? 1.4 : 0.6} transparent opacity={highlight ? 0.9 : 0.35} />;
}

function Belt() {
  const geo = useMemo(() => {
    const r = rng(42), n = 1800, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, d = visRadius(2.2 + r() * 1.1); p.set([Math.cos(a) * d, (r() - 0.5) * 0.4, Math.sin(a) * d], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3)); return g;
  }, []);
  return <points geometry={geo}><pointsMaterial size={0.03} color="#8b8f99" sizeAttenuation /></points>;
}

function Sun() {
  return (
    <group>
      <mesh><sphereGeometry args={[visSize("Sun"), 48, 24]} /><meshBasicMaterial color="#ffe3a3" /></mesh>
      {[1.35, 1.9, 2.8].map((s, i) => <Billboard key={s}><mesh scale={s}><circleGeometry args={[visSize("Sun"), 48]} /><meshBasicMaterial color="#ffb347" transparent opacity={0.18 - i * 0.05} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh></Billboard>)}
      <pointLight intensity={40} decay={0.6} distance={0} color="#fff3dc" />
    </group>
  );
}

function Trajectory() {
  useTick(4);
  const s = useMissionStore();
  const d = designOf(s); const a = analyze(d);
  const depart = s.phase === "missions" || s.phase === "route" || s.phase === "menu" ? rt.days : rt.departDays;
  const pts = Array.from({ length: 81 }, (_, i) => pathPoint(d, i / 80, depart, a.days, new THREE.Vector3()));
  return <Line points={pts} color="#9fd6ff" lineWidth={2.2} transparent opacity={0.95} />;
}

function Debris({ active }: { active: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(() => { const r = rng(7); return Array.from({ length: 160 }, () => [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1, 0.2 + r()]); }, []);
  const m = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const g = ref.current; if (!g) return; g.visible = active;
    if (!active) return;
    seeds.forEach(([x, y, z, s], i) => {
      const t = ((clock.elapsedTime * 0.15 * (s ?? 1) + (z ?? 0)) % 2) - 1;
      m.position.set(rt.shipPos.x + (x ?? 0) * 0.6, rt.shipPos.y + (y ?? 0) * 0.35, rt.shipPos.z + t * 0.9);
      m.rotation.set(clock.elapsedTime * (s ?? 1), i, 0); m.scale.setScalar(0.004 + (s ?? 1) * 0.007); m.updateMatrix(); g.setMatrixAt(i, m.matrix);
    });
    g.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[undefined, undefined, 160]}><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#6d655d" roughness={1} /></instancedMesh>;
}

function ScanMarker() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current; if (!g) return;
    g.visible = !!rt.scan;
    if (rt.scan) { bodyVisPos(rt.scan.id, rt.days, g.position); g.scale.setScalar(visSize(rt.scan.id) * (1.6 + Math.sin(clock.elapsedTime * 3) * 0.08)); }
  });
  return <group ref={ref}><Billboard><mesh><ringGeometry args={[1, 1.06, 64]} /><meshBasicMaterial color="#9fdcff" transparent opacity={0.9} /></mesh></Billboard></group>;
}

function Cockpit() {
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const screens = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 256; c.height = 128; const g = c.getContext("2d")!;
    g.fillStyle = "#04162e"; g.fillRect(0, 0, 256, 128); g.strokeStyle = "#5ab8ff"; g.lineWidth = 2;
    g.beginPath(); g.arc(64, 64, 44, 0, 7); g.stroke(); g.beginPath(); g.arc(64, 64, 24, 0, 7); g.stroke();
    g.beginPath(); for (let x = 130; x < 250; x += 4) g.lineTo(x, 70 + Math.sin(x * 0.12) * 18); g.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  useFrame(() => { const g = ref.current; if (!g) return; g.position.copy(camera.position); g.quaternion.copy(camera.quaternion); });
  const panel = new THREE.MeshStandardMaterial({ color: "#1b2a40", metalness: 0.4, roughness: 0.6, emissive: "#1d3a66", emissiveIntensity: 1.4 });
  return (
    <group ref={ref}>
      <pointLight position={[0, -0.02, 0.02]} intensity={0.04} distance={0.3} color="#7fc4ff" />
      <mesh position={[0, -0.072, -0.1]} rotation-x={-0.5} material={panel}><boxGeometry args={[0.26, 0.05, 0.06]} /></mesh>
      {[-0.07, 0, 0.07].map((x) => <mesh key={x} position={[x, -0.058, -0.112]} rotation-x={-0.5}><planeGeometry args={[0.055, 0.03]} /><meshBasicMaterial map={screens} /></mesh>)}
      {[-1, 1].map((s) => <mesh key={s} position={[s * 0.1, 0.01, -0.1]} rotation-z={s * 0.25} material={panel}><boxGeometry args={[0.02, 0.24, 0.02]} /></mesh>)}
      <mesh position={[0, 0.075, -0.1]} material={panel}><boxGeometry args={[0.3, 0.02, 0.03]} /></mesh>
      {[-1, 1].map((s) => <mesh key={`s${s}`} position={[s * 0.15, -0.01, -0.03]} rotation-y={-s * 0.9} material={panel}><boxGeometry args={[0.008, 0.2, 0.18]} /></mesh>)}
    </group>
  );
}

function Rig({ controls }: { controls: React.RefObject<OC | null> }) {
  const phase = useMissionStore((s) => s.phase), cam = useMissionStore((s) => s.cam), mission = useMissionStore((s) => s.mission);
  const { camera } = useThree();
  const prev = useRef(new THREE.Vector3());
  const tgt = useMemo(() => new THREE.Vector3(), []);
  const overview = ["missions", "brief", "route", "routePreview", "objectives", "budget", "fuel", "power", "comms", "instruments", "overview"].includes(phase);
  useEffect(() => {
    const c = controls.current; if (!c) return;
    if (overview) { const far = MISSIONS[mission].body === "Moon" ? 3 : visRadius(BODIES[MISSIONS[mission].body].au) * 1.25 + 4; camera.position.set(0, far * 0.75, far); c.target.set(0, 0, 0); }
    if (phase === "flight" || phase === "encounter" || phase === "failure" || phase === "rescue") { const back = rt.shipDir.clone().multiplyScalar(-0.3); camera.position.copy(rt.shipPos).add(back).add(new THREE.Vector3(0, 0.12, 0)); prev.current.copy(rt.shipPos); }
  }, [phase, overview, mission, camera, controls]);
  useFrame((_, dt) => {
    const c = controls.current; const k = Math.min(dt, 0.05);
    const cockpit = cam === "cockpit" && (phase === "flight" || phase === "encounter");
    if (c) c.enabled = !cockpit && phase !== "menu";
    if (phase === "menu") {
      bodyVisPos("Earth", rt.days, tgt);
      const a = performance.now() * 0.00005;
       camera.position.lerp(tgt.clone().add(new THREE.Vector3(Math.cos(a) * 0.72, 0.08, Math.sin(a) * 0.72)), 1 - Math.exp(-2 * k));
       camera.lookAt(tgt);
      if (c) c.target.copy(tgt);
    } else if (overview && c) {
      const focus = bodyVisPos(MISSIONS[mission].body, rt.days, tgt);
      c.target.lerp(MISSIONS[mission].body === "Moon" ? focus : focus.multiplyScalar(0.35), 1 - Math.exp(-2 * k));
    } else if (cockpit) {
      camera.position.copy(rt.shipPos).addScaledVector(rt.shipDir, 0.02);
      const look = rt.shipPos.clone().addScaledVector(rt.shipDir, 1);
      camera.lookAt(look);
      camera.rotateY(rt.yaw); camera.rotateX(rt.pitch);
    } else if (c && (phase === "flight" || phase === "encounter" || phase === "failure" || phase === "rescue")) {
      const delta = rt.shipPos.clone().sub(prev.current);
      camera.position.add(delta); prev.current.copy(rt.shipPos); c.target.copy(rt.shipPos);
    }
    c?.update();
  });
  return null;
}

export function Universe() {
  useTick(4);
  const s = useMissionStore();
  const d = designOf(s); const a = analyze(d);
  const ship = useRef<THREE.Group>(null);
  const target = MISSIONS[s.mission].body;
  const controls = useRef<OC | null>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const flying = s.phase === "flight";
  const onPath = ["flight", "encounter", "failure", "rescue"].includes(s.phase);
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const st = useMissionStore.getState();
    if (st.phase === "flight") {
      const prevP = rt.progress;
      rt.progress = Math.min(1, rt.progress + (dt * rt.warp) / 70);
      rt.days = rt.departDays + rt.progress * a.days;
      const mile = (m: number) => prevP < m && rt.progress >= m;
      if (mile(0.02)) st.say(target === "Moon" ? "Trans-lunar coast" : "Leaving Earth's sphere of influence", "ok");
      if (mile(0.12)) st.say("Trajectory updated — mid-course correction nominal");
      if (mile(0.3)) { const p = pathAU(d, 0.3, rt.departDays, a.days); st.say(`Communication delay ${(p.km / 299792 / 60).toFixed(1)} min`, "warn"); }
      if (rt.progress >= 0.32 && !a.canLaunch && !st.outcome) {
        const causes = a.issues.filter(i => i.tone === "danger").map(i => i.text);
        st.set({ outcome: { hull: 100, comms: 100, power: Math.max(0, Math.min(100, Math.round(70 + a.powerMargin * 60))), dvLeft: a.dv - a.required, failed: true, causes: a.dvMargin < 0 ? ["fuel", ...causes] : a.powerMargin < 0 ? ["power", ...causes] : causes, log: causes.join(" "), science: a.science, choice: "reroute" } });
        st.say("Engineering limits reached. Mission recovery required.", "danger"); st.go("failure");
      }
      if (rt.progress >= 0.45 && !st.outcome) { st.say("Debris field detected ahead", "danger"); st.go("encounter"); }
      if (rt.progress >= 1) { st.say(`Arrived at ${target}`, "ok"); st.go("landing"); }
    } else if (!onPath) {
      rt.days += dt * (st.phase === "menu" ? 2 : 6);
    }
    // Ship placement
    if (onPath) {
      pathPoint(d, rt.progress, rt.departDays, a.days, rt.shipPos);
      pathPoint(d, Math.min(1, rt.progress + 0.002), rt.departDays, a.days, tmp);
      if (tmp.distanceToSquared(rt.shipPos) > 1e-10) rt.shipDir.copy(tmp).sub(rt.shipPos).normalize();
      const p = pathAU(d, rt.progress, rt.departDays, a.days); rt.shipAU = p.au; rt.shipAngle = p.angle;
      const near = rt.progress < 0.04 ? { id: "Earth" as BodyId, km: p.km } : nearestBody(p.au, p.angle, rt.days, target === "Moon" ? ["Sun"] : []);
      rt.scan = target === "Moon" && rt.progress > 0.5 ? { id: "Moon", km: (1 - rt.progress) * 384400 } : near;
    } else {
      bodyVisPos("Earth", rt.days, rt.shipPos).add(tmp.set(0.4, 0.06, 0));
      rt.shipDir.set(0, 0, -1); rt.scan = null;
    }
    if (ship.current) {
      ship.current.position.copy(rt.shipPos);
      ship.current.quaternion.setFromUnitVectors(up, rt.shipDir);
      if (st.phase === "failure" || st.phase === "rescue") ship.current.rotateX(performance.now() * 0.0003);
    }
  });
  const showShip = !["missions", "brief", "route", "routePreview", "objectives", "budget", "fuel", "power", "comms", "instruments", "overview"].includes(s.phase);
  return (
    <>
      <color attach="background" args={["#010308"]} />
      <ambientLight intensity={0.18} color="#8fb4ff" />
      <Stars radius={200} depth={80} count={6000} factor={5} saturation={0.1} fade speed={0.2} />
      <Sun />
      {PLANET_ORDER.map((id) => <Planet key={id} id={id} focus={id === target} />)}
      <Planet id="Moon" focus={target === "Moon"} />
       {s.phase !== "menu" && PLANET_ORDER.map((id) => <OrbitRing key={id} au={BODIES[id].au} highlight={id === target || id === "Earth"} />)}
       {s.phase !== "menu" && <Belt />}
      {(["missions", "brief", "route", "routePreview", "objectives", "budget", "fuel", "power", "comms", "instruments", "overview"].includes(s.phase) || onPath) && <Trajectory />}
      {onPath && <ScanMarker />}
      <Debris active={s.phase === "encounter"} />
      {showShip && (
        <group ref={ship}>
          <group scale={0.03} visible={!(s.cam === "cockpit" && (s.phase === "flight" || s.phase === "encounter"))}><Spacecraft design={d} deploy={1} thrust={flying && rt.warp > 1 ? 0.6 : 0} /></group>
          {s.phase === "encounter" && s.outcome?.choice === "boost" && <group scale={0.03}><Flame power={1} y={-1.5} /></group>}
        </group>
      )}
      {s.cam === "cockpit" && (s.phase === "flight" || s.phase === "encounter") && <Cockpit />}
      <OrbitControls ref={controls as never} makeDefault enablePan={false} enableDamping minDistance={0.08} maxDistance={120} />
      <Rig controls={controls} />
    </>
  );
}
