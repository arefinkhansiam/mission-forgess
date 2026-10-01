import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, Sparkles, Stars } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { BODIES } from "../../lib/nasa-data";
import { landingStages, MISSIONS, type Design } from "../../lib/mission-sim";
import { designOf, useMissionStore } from "../../stores/mission-store";
import { Flame, Spacecraft } from "./Spacecraft";
import { rt, useTick } from "./runtime";

function Studio() {
  return (
    <Environment resolution={128}>
      <Lightformer intensity={2.5} position={[0, 6, 2]} scale={[10, 4, 1]} color="#cfe6ff" />
      <Lightformer intensity={1.2} position={[-6, 1, -2]} rotation-y={Math.PI / 2} scale={[12, 2, 1]} color="#5b8fd6" />
      <Lightformer intensity={0.8} position={[6, 0, 2]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} color="#ffd9a8" />
    </Environment>
  );
}

// ---------- Hangar / build ----------
export function BuildScene() {
  const s = useMissionStore(); const d = designOf(s);
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();
  useEffect(() => { camera.position.set(0.55, 1.15, 6.6); camera.lookAt(0.55, 0, 0); }, [camera]);
  useFrame(({ clock }) => { if (ref.current) ref.current.position.y = Math.sin(clock.elapsedTime * 0.8) * 0.05; });
  return (
    <>
      <color attach="background" args={["#040b1a"]} />
      <fog attach="fog" args={["#040b1a", 8, 22]} />
      <Studio />
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 3]} intensity={2.2} color="#e8f2ff" />
      <Stars radius={60} depth={20} count={1500} factor={3} fade />
      <group ref={ref} rotation-z={0.12}><Spacecraft design={d} deploy={1} /></group>
      <mesh position-y={-2.4} rotation-x={-Math.PI / 2}><circleGeometry args={[4, 64]} /><meshStandardMaterial color="#0a1a33" metalness={0.8} roughness={0.35} /></mesh>
      <mesh position-y={-2.39} rotation-x={-Math.PI / 2}><ringGeometry args={[2.6, 2.64, 96]} /><meshBasicMaterial color="#5aaeff" /></mesh>
       <OrbitControls makeDefault enablePan={false} autoRotate autoRotateSpeed={0.5} minDistance={3} maxDistance={10} target={[0.55, 0, 0]} />
    </>
  );
}

// ---------- Launch (SLS Block 1 stack) ----------
const LIFTOFF = 10, SRB_SEP = 18, CORE_SEP = 25, ORBIT = 28;
export const launchProfile = (t: number) => {
  // Real-time mapping ×20 (24 s ≈ 8 min to MECO); altitude/velocity approximated from the Artemis I ascent timeline
  const real = Math.max(0, t - LIFTOFF) * 20, f = Math.min(1, real / 480);
  return { altKm: 162 * Math.pow(f, 1.6), velKms: 7.8 * Math.pow(f, 1.3), real };
};

function Pad() {
  const tex = useMemo(() => { const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d")!; g.fillStyle = "#3f5a32"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${40 + Math.random() * 30},${70 + Math.random() * 40},40,0.5)`; g.fillRect(Math.random() * 256, Math.random() * 256, 6, 6); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(40, 40); t.colorSpace = THREE.SRGBColorSpace; return t; }, []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.01}><planeGeometry args={[800, 800]} /><meshStandardMaterial map={tex} roughness={1} /></mesh>
      <mesh position-y={0.4}><boxGeometry args={[6, 0.8, 6]} /><meshStandardMaterial color="#8a8d90" roughness={0.9} /></mesh>
      <group position={[-2.1, 0, 0]}>
        {Array.from({ length: 14 }, (_, i) => <mesh key={i} position-y={1 + i * 0.9}><boxGeometry args={[1.1, 0.06, 1.1]} /><meshStandardMaterial color="#6b6f73" /></mesh>)}
        {[[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(([x, z]) => <mesh key={`${x}${z}`} position={[x!, 7, z!]}><boxGeometry args={[0.08, 13, 0.08]} /><meshStandardMaterial color="#5d6166" /></mesh>)}
      </group>
      <mesh position={[40, 6, -60]}><boxGeometry args={[14, 12, 10]} /><meshStandardMaterial color="#d9d9d4" /></mesh>
    </group>
  );
}

export function LaunchScene() {
  useTick(10);
  const s = useMissionStore(); const d = designOf(s);
  const stack = useRef<THREE.Group>(null), srbs = useRef<THREE.Group>(null), core = useRef<THREE.Group>(null), orion = useRef<THREE.Group>(null), las = useRef<THREE.Group>(null);
  const { camera, scene } = useThree();
  const sky = useMemo(() => ({ a: new THREE.Color("#7fb2e6"), b: new THREE.Color("#01040c"), c: new THREE.Color() }), []);
  const said = useRef(new Set<string>());
  useEffect(() => { rt.launchT = 0; said.current.clear(); camera.position.set(9, 4, 14); }, [camera]);
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05); rt.launchT += dt;
    const t = rt.launchT; const st = useMissionStore.getState();
    const once = (k: string, msg: string, tone: "info" | "ok" | "warn" = "info") => { if (!said.current.has(k)) { said.current.add(k); st.say(msg, tone); } };
    if (t > 3) once("fuel", "Propellant loading complete");
    if (t > LIFTOFF - 6.6) once("ign", "RS-25 engine ignition", "warn");
    if (t > LIFTOFF) once("lift", "Liftoff!", "ok");
    if (t > SRB_SEP) once("srb", "Booster separation", "ok");
    if (t > CORE_SEP) once("core", "Core stage separation", "ok");
    if (t > ORBIT) once("orb", "Orbit insertion — deploying solar arrays", "ok");
    const inOrbit = t > ORBIT;
    const lt = Math.max(0, t - LIFTOFF), y = 0.35 * lt * lt;
    const alt = Math.min(1, y / 300);
    sky.c.copy(sky.a).lerp(sky.b, alt);
    scene.background = inOrbit ? sky.b : sky.c;
    scene.fog = inOrbit ? null : new THREE.Fog(sky.c, 60, 400 + y);
    rt.thrust = t > LIFTOFF - 6.6 && t < CORE_SEP ? 1 : 0;
    if (stack.current) { stack.current.visible = !inOrbit; stack.current.position.y = y; stack.current.rotation.z = -Math.min(0.5, lt * lt * 0.0015); }
    if (srbs.current && t > SRB_SEP) { const k = t - SRB_SEP; srbs.current.children.forEach((c, i) => { c.position.x = (i ? 1 : -1) * (0.95 + k * 1.2); c.position.y = 3 - k * k * 2; c.rotation.z = (i ? -1 : 1) * k * 0.3; }); }
    if (core.current) core.current.visible = t < CORE_SEP;
    if (las.current) las.current.visible = t < CORE_SEP - 1;
    if (orion.current) orion.current.visible = inOrbit;
    const shake = rt.thrust ? (t < LIFTOFF + 6 ? 0.08 : 0.03) : 0;
    if (!inOrbit && stack.current) {
      const target = stack.current.position.clone().add(new THREE.Vector3(0, 6, 0));
      const want = t < LIFTOFF ? new THREE.Vector3(9, 5, 16) : target.clone().add(new THREE.Vector3(8 + lt * 0.2, -3, 14));
      camera.position.lerp(want, 1 - Math.exp(-2 * dt)); camera.position.x += (Math.random() - 0.5) * shake; camera.position.y += (Math.random() - 0.5) * shake;
      camera.lookAt(target);
    } else if (orion.current) {
      const k = Math.min(1, (t - ORBIT) / 4);
      camera.position.lerp(new THREE.Vector3(3.5, 1.2, 5.5), 1 - Math.exp(-2 * dt)); camera.lookAt(0, 0, 0);
      rt.launchT = Math.min(rt.launchT, ORBIT + 60); void k;
    }
  });
  const deploy = Math.max(0, Math.min(1, (rt.launchT - ORBIT - 1) / 4));
  return (
    <>
      <color attach="background" args={["#7fb2e6"]} />
      <hemisphereLight args={["#cfe6ff", "#3f5a32", 0.9]} />
      <directionalLight position={[30, 50, 20]} intensity={2.4} color="#fff1d8" />
      <Studio />
      <Stars radius={300} depth={50} count={3000} factor={6} fade />
      <group>{rt.launchT < ORBIT && <Pad />}</group>
      <group ref={stack}>
        <group ref={core}>
          <mesh position-y={6.1}><cylinderGeometry args={[0.8, 0.8, 11, 40]} /><meshStandardMaterial color="#d8742c" roughness={0.75} /></mesh>
          {[0, 1, 2, 3].map((i) => <group key={i} position={[Math.cos(i * 1.57 + 0.78) * 0.35, 0.3, Math.sin(i * 1.57 + 0.78) * 0.35]}><mesh position-y={0.1}><cylinderGeometry args={[0.1, 0.25, 0.5, 16, 1, true]} /><meshStandardMaterial color="#555" metalness={0.8} side={THREE.DoubleSide} /></mesh><Flame power={rt.thrust} y={-0.15} length={4} radius={0.28} /></group>)}
          <mesh position-y={12.2}><cylinderGeometry args={[0.55, 0.8, 1.2, 40]} /><meshStandardMaterial color="#e6e9ec" /></mesh>
          <group position-y={13.5} scale={0.85}><Spacecraft design={{ ...d, wings: 0 }} deploy={0} /></group>
        </group>
        <group ref={las} position-y={15.2}><mesh><coneGeometry args={[0.55, 1.4, 32]} /><meshStandardMaterial color="#f2f2f2" /></mesh><mesh position-y={1.3}><cylinderGeometry args={[0.07, 0.07, 1.6]} /><meshStandardMaterial color="#ddd" /></mesh></group>
        <group ref={srbs}>
          {[-1, 1].map((sd) => <group key={sd} position={[sd * 0.95, 0, 0]}>
            <mesh position-y={5.2}><cylinderGeometry args={[0.36, 0.36, 9.6, 32]} /><meshStandardMaterial color="#f1f1ef" roughness={0.6} /></mesh>
            {[2, 4, 6, 8].map((b) => <mesh key={b} position-y={b}><cylinderGeometry args={[0.365, 0.365, 0.12, 32]} /><meshStandardMaterial color="#222" /></mesh>)}
            <mesh position-y={10.3}><coneGeometry args={[0.36, 0.8, 32]} /><meshStandardMaterial color="#f1f1ef" /></mesh>
            <Flame power={rt.launchT > LIFTOFF && rt.launchT < SRB_SEP ? 1 : 0} y={0.3} length={6} radius={0.42} />
          </group>)}
        </group>
        {rt.launchT > LIFTOFF - 2 && rt.launchT < LIFTOFF + 8 && <Sparkles count={120} scale={[10, 3, 10]} position-y={0.8} size={20} speed={2} color="#e8e0d6" opacity={0.7} />}
      </group>
      <group ref={orion}>
        <mesh position={[0, -16, -8]}><sphereGeometry args={[14, 64, 32]} /><meshStandardMaterial color="#2a62c4" roughness={0.8} emissive="#0a2a66" emissiveIntensity={0.3} /></mesh>
        <mesh position={[0, -16, -8]} scale={1.02}><sphereGeometry args={[14, 48, 24]} /><meshBasicMaterial color="#7fc0ff" transparent opacity={0.15} side={THREE.BackSide} blending={THREE.AdditiveBlending} /></mesh>
        <group rotation-z={0.4}><Spacecraft design={d} deploy={deploy} /></group>
      </group>
    </>
  );
}

// ---------- Rescue rendezvous / docking / repair ----------
export function DockingScene() {
  useTick(10);
  const s = useMissionStore(); const d = designOf(s);
  const rescue = useRef<THREE.Group>(null), target = useRef<THREE.Group>(null);
  const rescueDesign = useMemo<Design>(() => ({ ...d, engine: "chemical", engines: 1, tanks: 2, wings: 4, rtgs: 0, antennas: 2, shield: false, battery: true, instruments: [] }), [d]);
  const { camera } = useThree();
  const said = useRef(new Set<string>());
  useEffect(() => { rt.launchT = 0; said.current.clear(); camera.position.set(6, 2.5, 7); camera.lookAt(0, 0, 0); }, [camera]);
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05); rt.launchT = Math.min(24, rt.launchT + dt); const t = rt.launchT;
    const st = useMissionStore.getState();
    const once = (k: string, m: string) => { if (!said.current.has(k)) { said.current.add(k); st.say(m, "ok"); } };
    if (t > 0.5) once("a", "Rescue craft on approach");
    if (t > 6) once("b", "Matching rotation rate");
    if (t > 11) once("c", "Soft capture — docked");
    if (t > 13) once("d", "Robotic repair in progress");
    if (t >= 24) { once("e", "Repairs complete — systems restored"); if (!st.rescued) st.set({ rescued: true }); }
    const spin = Math.max(0, 1 - t / 8);
    if (target.current) target.current.rotation.x += dt * 0.6 * spin;
    if (rescue.current) rescue.current.position.y = 2.0 + Math.max(0, 9 - t) * 1.3;
  });
  const repairing = rt.launchT > 13 && rt.launchT < 24;
  return (
    <>
      <color attach="background" args={["#010308"]} />
      <Stars radius={100} depth={40} count={4000} factor={4} fade />
      <Studio />
      <ambientLight intensity={0.15} />
      <directionalLight position={[8, 4, 5]} intensity={2.6} color="#fff4e0" />
      <mesh position={[-6, -9, -18]}><sphereGeometry args={[8, 48, 24]} /><meshStandardMaterial color={BODIES[MISSIONS[s.mission].body === "Moon" ? "Moon" : "Earth"].color} roughness={0.9} /></mesh>
      <group ref={target}><Spacecraft design={d} deploy={1} /></group>
      <group ref={rescue} rotation-z={Math.PI}><Spacecraft design={rescueDesign} deploy={1} variant="rescue" thrust={rt.launchT < 10 ? 0.35 : 0} /></group>
      {repairing && <Sparkles count={60} scale={[1.4, 1.4, 1.4]} position={[0.5, -0.4, 0.5]} size={6} speed={3} color="#ffd48a" />}
      <OrbitControls makeDefault enablePan={false} minDistance={3} maxDistance={16} />
    </>
  );
}

// ---------- Landing / probe entry ----------
export function LandingScene() {
  useTick(10);
  const s = useMissionStore(); const d = designOf(s);
  const body = BODIES[MISSIONS[s.mission].body];
  const stages = landingStages(body.id);
  const lander = useRef<THREE.Group>(null), chute = useRef<THREE.Group>(null);
  const tex = useMemo(() => { const c = document.createElement("canvas"); c.width = c.height = 512; const g = c.getContext("2d")!; g.fillStyle = body.color; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 900; i++) { g.fillStyle = i % 3 ? body.color2 : "#ffffff"; g.globalAlpha = 0.05 + Math.random() * 0.15; g.beginPath(); g.arc(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 18, 0, 7); g.fill(); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(12, 12); t.colorSpace = THREE.SRGBColorSpace; return t; }, [body]);
  const gas = body.atmosphere === "gas";
  const skyCol = body.atmosphere === "none" ? "#010206" : gas ? body.color2 : body.id === "Mars" ? "#c79a72" : body.id === "Venus" ? "#d49b4b" : "#8ab8e6";
  const { camera } = useThree();
  useEffect(() => { camera.position.set(8, 6, 12); }, [camera]);
  useFrame(({ clock }, raw) => {
    const dt = Math.min(raw, 0.05), st = useMissionStore.getState();
    const f = st.landing / stages.length;
    const want = gas ? 30 - f * 40 : 40 * (1 - f) + 0.55 * (f >= 1 ? 1 : 0);
    const g = lander.current; if (!g) return;
    g.position.y = THREE.MathUtils.damp(g.position.y, Math.max(gas ? -20 : 0.55, want), 1.5, dt);
    g.rotation.z = Math.sin(clock.elapsedTime * 0.7) * 0.03 * (1 - f);
    const name = stages[st.landing - 1] ?? "";
    if (chute.current) chute.current.visible = name.startsWith("Parachute") || (stages[st.landing] ?? "").startsWith("Heat") && st.landing > 2 && gas;
    rt.thrust = /Powered|Braking|Terminal|Deorbit/.test(name) ? 1 : 0;
    camera.position.lerp(new THREE.Vector3(g.position.x + 7, g.position.y + 3, g.position.z + 10), 1 - Math.exp(-1.5 * dt));
    camera.lookAt(g.position);
  });
  return (
    <>
      <color attach="background" args={[skyCol]} />
      <fog attach="fog" args={[skyCol, 20, gas ? 90 : 220]} />
      {body.atmosphere === "none" && <Stars radius={150} depth={40} count={3000} factor={4} fade />}
      <hemisphereLight args={[skyCol, body.color2, 0.8]} />
      <directionalLight position={[20, 30, 10]} intensity={2.4} color="#fff1dc" />
      {gas ? (
        [0, -12, -24].map((y, i) => <mesh key={y} position-y={y} rotation-x={-Math.PI / 2}><planeGeometry args={[400, 400]} /><meshStandardMaterial map={tex} transparent opacity={0.55 + i * 0.15} color={i % 2 ? body.color : "#f4e4c8"} /></mesh>)
      ) : (
        <>
          <mesh rotation-x={-Math.PI / 2}><planeGeometry args={[600, 600]} /><meshStandardMaterial map={tex} roughness={1} /></mesh>
          {Array.from({ length: 40 }, (_, i) => <mesh key={i} position={[Math.sin(i * 12.9) * 40, 0.2, Math.cos(i * 7.3) * 40]} scale={0.3 + (i % 5) * 0.3}><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color={body.color2} roughness={1} /></mesh>)}
        </>
      )}
      <group ref={lander} position-y={40}>
        <Spacecraft design={d} variant="lander" thrust={rt.thrust} />
        <group ref={chute} position-y={3} visible={false}>
          <mesh><sphereGeometry args={[2, 24, 12, 0, Math.PI * 2, 0, 1.2]} /><meshStandardMaterial color="#f4f4f4" side={THREE.DoubleSide} /></mesh>
          {[0, 1, 2, 3, 4, 5].map((i) => <mesh key={i} position={[Math.cos(i) * 0.9, -1.4, Math.sin(i) * 0.9]} rotation-z={Math.cos(i) * 0.4}><cylinderGeometry args={[0.01, 0.01, 3]} /><meshBasicMaterial color="#ddd" /></mesh>)}
        </group>
      </group>
      {s.landing >= stages.length && !gas && <Sparkles count={80} scale={[5, 1, 5]} position-y={0.4} size={10} color={body.color} />}
    </>
  );
}
