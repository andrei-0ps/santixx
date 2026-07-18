/**
 * SkeletonAssembly — cinematic "cascade" intro for the landing hero.
 *
 * Each bone chunk materialises in with an overshoot pop (back.out), a magnetic
 * spin-into-place, an emissive flash on arrival, and a gentle breathing idle.
 * Staggered top-to-bottom by world height.
 *
 * Zone hotspots are anchored to 3D landmark positions (drei <Html>), so they
 * track the actual body parts on any screen size / card aspect — instead of
 * fixed pixel coordinates that drift when the canvas resizes.
 *
 * Robustness: pieces are initialised in their ASSEMBLED, visible state. The
 * cascade is driven entirely from useFrame elapsed time, which runs before each
 * render — so the explode shows from the first painted frame, yet if the render
 * loop never ticks (e.g. WebGL context loss) the skeleton simply stays
 * assembled and visible instead of vanishing. Respects prefers-reduced-motion.
 */

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, Html } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";

const GLB_URL = "/skeleton-intro.glb";
const ASSEMBLE_DUR = 0.85; // seconds each piece takes to assemble
const STAGGER = 1.9; // seconds between first and last piece starting
const TARGET_OPACITY = 0.9;

// 3D landmark positions (group-local units; the model is centred at the origin
// and ~1.83 units tall before the group scale). Tuned to sit on the body parts.
const LANDMARKS: Record<string, [number, number, number]> = {
  skull: [0, 0.8, 0.12],
  chest: [0, 0.4, 0.16],
  arm: [-0.26, 0.28, 0.08],
  pelvis: [0, 0.02, 0.16],
  knee: [-0.12, -0.52, 0.12],
  ankle: [0.13, -0.86, 0.12],
};

useGLTF.preload(GLB_URL);

// back.out(1.7) overshoot
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export type SkeletonZone = { id: string; label: string };

interface Piece {
  mesh: THREE.Mesh;
  mat: THREE.MeshPhysicalMaterial;
  delay: number;
  origScale: THREE.Vector3;
  origRot: THREE.Euler;
  startRot: THREE.Euler;
}

function AssemblyModel({
  reducedMotion,
  zones,
  activeId,
  onSelect,
}: {
  reducedMotion: boolean;
  zones: readonly SkeletonZone[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const gltf = useGLTF(GLB_URL);
  const groupRef = useRef<THREE.Group>(null);
  const startRef = useRef<number | null>(null);
  const pieces = useRef<Piece[]>([]);

  const { cloned, scale, offset } = useMemo(() => {
    const root = gltf.scene.clone(true);
    root.updateWorldMatrix(true, true);

    const entries: { mesh: THREE.Mesh; worldY: number }[] = [];
    root.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if (!m.isMesh) return;
      if (m.name.toLowerCase().includes("outline")) {
        m.visible = false;
        return;
      }
      const box = new THREE.Box3().setFromObject(m);
      const c = new THREE.Vector3();
      box.getCenter(c);
      entries.push({ mesh: m, worldY: c.y });
    });
    entries.sort((a, b) => b.worldY - a.worldY); // top first
    const count = Math.max(entries.length - 1, 1);

    pieces.current = entries.map(({ mesh }, i) => {
      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#cdeef8"),
        roughness: 0.25,
        metalness: 0,
        clearcoat: 0.8,
        clearcoatRoughness: 0.2,
        emissive: new THREE.Color("#00d8f0"),
        emissiveIntensity: 0.1,
        transparent: true,
        opacity: TARGET_OPACITY, // assembled/visible by default — robust fallback
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      mesh.material = mat;
      mesh.frustumCulled = false;

      const origRot = mesh.rotation.clone();
      return {
        mesh,
        mat,
        delay: (i / count) * STAGGER,
        origScale: mesh.scale.clone(),
        origRot,
        startRot: new THREE.Euler(
          origRot.x + (Math.random() - 0.5) * 2.4,
          origRot.y + (Math.random() - 0.5) * 3.2,
          origRot.z + (Math.random() - 0.5) * 2.4,
        ),
      };
    });

    const all = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const centre = new THREE.Vector3();
    all.getSize(size);
    all.getCenter(centre);
    const s = 3.8 / (size.y || 1);

    return {
      cloned: root,
      scale: s,
      offset: new THREE.Vector3(-centre.x, -centre.y, -centre.z),
    };
  }, [gltf]);

  useFrame((state) => {
    const pcs = pieces.current;

    if (reducedMotion) {
      if (groupRef.current) {
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.035;
      }
      return;
    }

    if (startRef.current === null) startRef.current = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - startRef.current;

    let allDone = true;
    for (const p of pcs) {
      const t = elapsed - p.delay;

      if (t >= ASSEMBLE_DUR) {
        p.mat.opacity = TARGET_OPACITY;
        p.mat.emissiveIntensity = 0.1;
        p.mesh.scale.copy(p.origScale);
        p.mesh.rotation.copy(p.origRot);
        continue;
      }

      allDone = false;
      const raw = Math.max(0, t) / ASSEMBLE_DUR;
      const eased = Math.max(0, easeOutBack(Math.min(raw, 1)));

      p.mat.opacity = Math.min(raw * 1.4, 1) * TARGET_OPACITY;
      const flash = Math.max(0, 1 - Math.abs(raw - 0.9) / 0.1) * 0.85;
      p.mat.emissiveIntensity = 0.1 + (1 - raw) * 0.5 + flash;

      p.mesh.scale.set(p.origScale.x * eased, p.origScale.y * eased, p.origScale.z * eased);
      p.mesh.rotation.set(
        THREE.MathUtils.lerp(p.startRot.x, p.origRot.x, eased),
        THREE.MathUtils.lerp(p.startRot.y, p.origRot.y, eased),
        THREE.MathUtils.lerp(p.startRot.z, p.origRot.z, eased),
      );
    }

    if (allDone && groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.035;
    }
  });

  return (
    <group ref={groupRef} scale={scale}>
      <primitive object={cloned} position={offset} />

      {zones.map((zone, index) => {
        const pos = LANDMARKS[zone.id];
        if (!pos) return null;
        return (
          <Html
            key={zone.id}
            position={pos}
            center
            zIndexRange={[30, 10]}
            style={{ pointerEvents: "auto" }}
          >
            <motion.button
              type="button"
              onClick={() => onSelect(zone.id)}
              onMouseEnter={() => onSelect(zone.id)}
              className={["santix-zone-button", activeId === zone.id ? "is-active" : ""].join(" ")}
              style={{ position: "relative" }}
              aria-pressed={activeId === zone.id}
              aria-label={zone.label}
              initial={reducedMotion ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { delay: 0.5 + index * 0.1, type: "spring", stiffness: 320, damping: 18 }
              }
              whileHover={reducedMotion ? undefined : { scale: 1.15 }}
              whileTap={reducedMotion ? undefined : { scale: 0.9 }}
            >
              <span className="santix-zone-ring" />
              <span className="santix-zone-dot" />
              <span className="santix-zone-label">{zone.label}</span>
            </motion.button>
          </Html>
        );
      })}
    </group>
  );
}

export function SkeletonAssembly({
  zones,
  activeId,
  onSelect,
}: {
  zones: readonly SkeletonZone[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <Canvas
      shadows={false}
      camera={{ position: [0, 0.2, 11], fov: 28 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 9, 7]} intensity={1.25} color="#dffcff" />
      <directionalLight position={[-3, 3, 5]} intensity={0.5} color="#00f2fe" />
      <pointLight position={[0, 2, 5]} intensity={0.55} color="#00d8f0" />

      <Suspense fallback={null}>
        <AssemblyModel
          reducedMotion={reducedMotion}
          zones={zones}
          activeId={activeId}
          onSelect={onSelect}
        />
        <Environment preset="studio" environmentIntensity={0.5} />
      </Suspense>
    </Canvas>
  );
}
