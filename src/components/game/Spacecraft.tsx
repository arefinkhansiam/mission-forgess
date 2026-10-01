import { useFrame, type ThreeElements } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { Design } from "../../lib/mission-sim";

// Orion-inspired stack (crew module + European-style service module with X-wing solar arrays).
// Axis: nose points +Y. Units: ~1 = 1.6 m.

const mat = {
  hull: new THREE.MeshStandardMaterial({ color: "#e9edf1", metalness: 0.35, roughness: 0.45 }),
  foil: new THREE.MeshStandardMaterial({ color: "#c9a34a", metalness: 0.9, roughness: 0.28 }),
  dark: new THREE.MeshStandardMaterial({ color: "#2b3036", metalness: 0.6, roughness: 0.5 }),
  steel: new THREE.MeshStandardMaterial({ color: "#9aa3ad", metalness: 0.9, roughness: 0.3 }),
  shield: new THREE.MeshStandardMaterial({ color: "#5b4636", metalness: 0.2, roughness: 0.9 }),
  window: new THREE.MeshStandardMaterial({ color: "#0d1b2a", metalness: 1, roughness: 0.05, emissive: "#0a3a66", emissiveIntensity: 0.4 }),
  red: new THREE.MeshStandardMaterial({ color: "#b8483a", roughness: 0.6 }),
};

function solarTexture() {
  const c = document.createElement("canvas"); c.width = 128; c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0b1d3f"; g.fillRect(0, 0, 128, 256);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) {
    g.fillStyle = `hsl(220 60% ${16 + ((x * 7 + y * 3) % 5) * 2}%)`;
    g.fillRect(x * 16 + 1, y * 16 + 1, 14, 14);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function Pop({ children, ...p }: { children: ReactNode } & ThreeElements["group"]) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, d) => { const g = ref.current; if (!g) return; const s = THREE.MathUtils.damp(g.scale.x, 1, 6, Math.min(d, 0.05)); g.scale.setScalar(s); });
  return <group ref={ref} scale={0.001} {...p}>{children}</group>;
}

function Wing({ angle, deploy, tex }: { angle: number; deploy: number; tex: THREE.Texture }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, d) => {
    const g = ref.current; if (!g) return;
    const k = Math.min(d, 0.05);
    g.scale.x = THREE.MathUtils.damp(g.scale.x, Math.max(0.05, deploy), 3, k);
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, (1 - deploy) * 1.3, 3, k);
  });
  return (
    <group rotation-y={angle}>
      <group position={[0.62, -0.95, 0]} ref={ref} scale-x={0.05}>
        <mesh position={[0.15, 0, 0]} material={mat.steel}><boxGeometry args={[0.3, 0.04, 0.04]} /></mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0.55 + i * 0.62, 0, 0]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.58, 0.95]} />
            <meshStandardMaterial map={tex} metalness={0.6} roughness={0.35} side={THREE.DoubleSide} emissive="#0a1a3a" emissiveIntensity={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function Flame({ power = 1, length = 1.4, radius = 0.22, y = 0 }: { power?: number; length?: number; radius?: number; y?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current; if (!g) return;
    const f = 0.85 + Math.sin(clock.elapsedTime * 60) * 0.08 + Math.sin(clock.elapsedTime * 23) * 0.07;
    g.scale.set(1, Math.max(0.001, power * f), 1);
    g.visible = power > 0.01;
  });
  return (
    <group ref={ref} position-y={y}>
      <mesh position-y={-length / 2}><coneGeometry args={[radius, length, 20, 1, true]} /><meshBasicMaterial color="#ffb35a" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} /></mesh>
      <mesh position-y={-length * 0.3} rotation-x={Math.PI}><coneGeometry args={[radius * 0.55, length * 0.6, 16, 1, true]} /><meshBasicMaterial color="#cfe8ff" transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
    </group>
  );
}

export function Spacecraft({ design, deploy = 1, thrust = 0, variant = "full" }: { design: Design; deploy?: number; thrust?: number; variant?: "full" | "lander" | "rescue" }) {
  const tex = useMemo(() => solarTexture(), []);
  const engineOffsets = design.engines === 1 ? [0] : design.engines === 2 ? [-0.28, 0.28] : [-0.36, 0, 0.36];
  const wingAngles = Array.from({ length: design.wings }, (_, i) => Math.PI / 4 + (i * Math.PI * 2) / Math.max(design.wings, 1));
  const ionFlame = design.engine === "ion";
  return (
    <group>
      {/* Crew module: 57.5° conical capsule */}
      <mesh position-y={0.55} material={mat.hull}><cylinderGeometry args={[0.18, 0.62, 0.8, 40]} /></mesh>
      <mesh position-y={0.97} material={mat.dark}><cylinderGeometry args={[0.16, 0.18, 0.06, 24]} /></mesh>
      <mesh position-y={0.13} material={mat.shield}><cylinderGeometry args={[0.63, 0.6, 0.06, 40]} /></mesh>
      {[0, 1, 2, 3].map((i) => <mesh key={i} position={[Math.sin(i * 1.57 + 0.4) * 0.36, 0.72, Math.cos(i * 1.57 + 0.4) * 0.36]} rotation-y={i * 1.57 + 0.4} rotation-x={-0.55} material={mat.window}><planeGeometry args={[0.1, 0.1]} /></mesh>)}
      {variant === "lander" ? (
        <>
          {[0, 1, 2, 3].map((i) => <group key={i} rotation-y={i * Math.PI / 2 + Math.PI / 4}><mesh position={[0.7, -0.15, 0]} rotation-z={0.55} material={mat.steel}><cylinderGeometry args={[0.025, 0.025, 0.7]} /></mesh><mesh position={[0.9, -0.45, 0]} material={mat.dark}><cylinderGeometry args={[0.09, 0.09, 0.03, 16]} /></mesh></group>)}
          <mesh position-y={0} material={mat.foil}><cylinderGeometry args={[0.6, 0.55, 0.22, 8]} /></mesh>
          <mesh position-y={-0.2} material={mat.dark}><cylinderGeometry args={[0.07, 0.17, 0.25, 20, 1, true]} /></mesh>
          <Flame power={thrust} y={-0.32} length={1.2} radius={0.16} />
        </>
      ) : (
        <>
          {/* Crew module adapter + service module */}
          <mesh position-y={0.02} material={mat.steel}><cylinderGeometry args={[0.6, 0.62, 0.16, 40]} /></mesh>
          <mesh position-y={-0.55} material={variant === "rescue" ? mat.hull : mat.foil}><cylinderGeometry args={[0.62, 0.62, 1.0, 40]} /></mesh>
          {/* Propellant tanks visible as bulges */}
          {Array.from({ length: design.tanks }, (_, i) => <Pop key={`t${i}`} position={[Math.sin(i * Math.PI / 2 + 0.78) * 0.58, -0.55, Math.cos(i * Math.PI / 2 + 0.78) * 0.58]}><mesh material={mat.hull}><capsuleGeometry args={[0.13, 0.5, 6, 16]} /></mesh></Pop>)}
          {design.shield && <Pop position-y={-0.55}><mesh><cylinderGeometry args={[0.75, 0.75, 1.02, 40, 1, true]} /><meshStandardMaterial color="#d7dce0" metalness={0.5} roughness={0.5} transparent opacity={0.45} side={THREE.DoubleSide} /></mesh></Pop>}
          {/* Engines */}
          {engineOffsets.map((x, i) => (
            <Pop key={`e${i}${design.engine}`} position={[x, -1.12, 0]}>
              {design.engine === "nuclear" ? (
                <><mesh position-y={0.05} material={mat.dark}><cylinderGeometry args={[0.2, 0.2, 0.3, 20]} /></mesh><mesh position-y={-0.28} material={mat.steel}><cylinderGeometry args={[0.1, 0.26, 0.45, 24, 1, true]} /></mesh></>
              ) : design.engine === "ion" ? (
                <mesh position-y={-0.05} material={mat.dark}><cylinderGeometry args={[0.13, 0.13, 0.12, 24]} /></mesh>
              ) : (
                <mesh position-y={-0.2} material={mat.steel}><cylinderGeometry args={[0.07, 0.2, 0.42, 24, 1, true]} /></mesh>
              )}
              <Flame power={thrust} y={design.engine === "nuclear" ? -0.5 : -0.4} length={ionFlame ? 0.9 : 1.4} radius={ionFlame ? 0.1 : 0.2} />
            </Pop>
          ))}
          {/* Solar array wings */}
          {wingAngles.map((a, i) => <Pop key={`w${i}`}><Wing angle={a} deploy={deploy} tex={tex} /></Pop>)}
          {/* Antennas */}
          {Array.from({ length: design.antennas }, (_, i) => (
            <Pop key={`a${i}`} position={[i ? -0.55 : 0.55, -0.2, i ? -0.4 : 0.4]}>
              <mesh material={mat.steel}><cylinderGeometry args={[0.015, 0.015, 0.4]} /></mesh>
              <mesh position-y={0.25} rotation-x={Math.PI} material={mat.hull}><sphereGeometry args={[0.2, 24, 12, 0, Math.PI * 2, 0, 0.9]} /></mesh>
            </Pop>
          ))}
          {/* RTGs */}
          {Array.from({ length: design.rtgs }, (_, i) => (
            <Pop key={`r${i}`} position={[0, -0.85 - 0.02 * i, 0]} rotation-y={i * 1.2}>
              <group position={[0.85, 0, 0]} rotation-z={Math.PI / 2}>
                <mesh material={mat.dark}><cylinderGeometry args={[0.07, 0.07, 0.36, 12]} /></mesh>
                {[0, 1, 2, 3].map((f) => <mesh key={f} rotation-y={f * Math.PI / 4} material={mat.dark}><boxGeometry args={[0.24, 0.32, 0.01]} /></mesh>)}
              </group>
            </Pop>
          ))}
          {/* Instruments */}
          {design.instruments.map((k, i) => (
            <Pop key={k} position={[Math.sin(i * 2.1 + 2) * 0.66, -0.35 - i * 0.18, Math.cos(i * 2.1 + 2) * 0.66]}>
              <mesh material={k === "radiation" ? mat.red : mat.dark}><boxGeometry args={[0.14, 0.12, 0.14]} /></mesh>
              {k === "camera" && <mesh position-z={0.08} rotation-x={Math.PI / 2} material={mat.window}><cylinderGeometry args={[0.04, 0.04, 0.06, 16]} /></mesh>}
            </Pop>
          ))}
          {design.battery && <Pop position={[0, -0.95, 0]}><mesh material={mat.dark}><boxGeometry args={[0.5, 0.1, 0.5]} /></mesh></Pop>}
        </>
      )}
    </group>
  );
}
