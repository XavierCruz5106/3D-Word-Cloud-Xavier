import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sphere, MeshDistortMaterial, Environment } from "@react-three/drei";
import * as THREE from "three";
import type { WordTopic } from "../../mockData";

const CATEGORY_COLORS: Record<string, string> = {
  core:     "#e8d5ff",
  tech:     "#b8e8ff",
  ethics:   "#ffd5b8",
  impact:   "#b8ffd5",
  business: "#ffeab8",
  geo:      "#ffc8d5",
  default:  "#e0e0ff",
};

function makeWordTexture(
  word: string,
  color: string,
  weight: number,
  hovered: boolean
): THREE.Texture {
  const canvas = document.createElement("canvas");
  const dpr = window.devicePixelRatio > 1 ? 2 : 1;
  const basePx = 22 + weight * 26; // 22–48px range
  const fontSize = Math.round(basePx * dpr);
  const fontWt = hovered ? 500 : 300;
  const font = `italic ${fontWt} ${fontSize}px Georgia, 'Times New Roman', serif`;

  const ctx = canvas.getContext("2d")!;
  ctx.font = font;
  const textW = ctx.measureText(word).width;

  // Extra room for glow not to clip at edges
  const glowPad = Math.round(20 * dpr);
  const w = Math.ceil(textW) + glowPad * 2;
  const lineH = Math.ceil(fontSize * 1.5);
  const h = lineH + glowPad * 2;

  canvas.width  = w;
  canvas.height = h;
  ctx.font = font;

  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const cx = w / 2;
  const cy = h / 2;

  ctx.save();
  ctx.shadowColor = `rgba(${r},${g},${b},${hovered ? 0.48 : 0.2})`;
  ctx.shadowBlur = glowPad * (hovered ? 2.4 : 1.7);
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(word, cx, cy);
  ctx.restore();

  ctx.save();
  ctx.shadowColor = `rgba(${r},${g},${b},${hovered ? 0.72 : 0.38})`;
  ctx.shadowBlur = fontSize * 0.32;
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(word, cx, cy);
  ctx.restore();

  const alpha = hovered ? 1.0 : 0.65 + weight * 0.35;
  ctx.save();
  ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(word, cx, cy);
  ctx.restore();

  if (weight > 0.45) {
    const wA = Math.min((weight - 0.45) * 0.4 * (hovered ? 1.5 : 1.0), 0.52);
    ctx.save();
    ctx.globalAlpha = wA;
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(word, cx, cy);
    ctx.restore();
  }

  const swashY = cy + fontSize * 0.5;
  const swashW = textW * (hovered ? 0.82 : 0.5 + weight * 0.24);
  const swashA = hovered ? 0.58 : 0.16 + weight * 0.28;
  ctx.save();
  ctx.strokeStyle = `rgba(${r},${g},${b},${swashA})`;
  ctx.lineWidth = (hovered ? 1.1 : 0.7) * dpr;
  ctx.lineCap = "round";
  ctx.shadowColor = `rgba(${r},${g},${b},0.35)`;
  ctx.shadowBlur = 4 * dpr;
  ctx.beginPath();
  ctx.moveTo(cx - swashW / 2, swashY);
  ctx.bezierCurveTo(
    cx - swashW * 0.1, swashY + 2.5 * dpr,
    cx + swashW * 0.1, swashY - 2.5 * dpr,
    cx + swashW / 2,   swashY
  );
  ctx.stroke();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function computeOrbitParams(topics: WordTopic[]) {
  return topics.map((t, i) => {
    const phi = Math.acos(-1 + (2 * i) / topics.length);
    const theta = Math.sqrt(topics.length * Math.PI) * phi;
    // Stable pseudo-random values seeded from index
    const s1 = Math.sin(i * 127.1) * 0.5 + 0.5;
    const s2 = Math.sin(i * 311.7) * 0.5 + 0.5;
    return {
      radius:      2.6 + (1 - t.weight) * 3.2,
      speed:       0.055 + (1 - t.weight) * 0.07,
      phaseOffset: (i / topics.length) * Math.PI * 2,
      wobbleAmp:   0.14 + s1 * 0.12,
      wobbleFreq:  0.52 + s2 * 0.3,
      orbitTilt: new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(Math.sin(phi), Math.cos(theta), Math.sin(theta + phi)).normalize(),
        theta * 0.28
      ),
    };
  });
}

interface WordNodeProps {
  topic: WordTopic;
  orbitRadius: number;
  speed: number;
  phaseOffset: number;
  wobbleAmp: number;
  wobbleFreq: number;
  orbitTilt: THREE.Matrix4;
  index: number;
  total: number;
}

function WordNode({ topic, orbitRadius, speed, phaseOffset, wobbleAmp, wobbleFreq, orbitTilt, index, total }: WordNodeProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRef  = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const baseAngle = (index / total) * Math.PI * 2;
  const color = CATEGORY_COLORS[topic.category ?? "default"] ?? "#e0e0ff";

  const [texNormal, texHovered] = useMemo(() => [
    makeWordTexture(topic.word, color, topic.weight, false),
    makeWordTexture(topic.word, color, topic.weight, true),
  ], [topic.word, color, topic.weight]);

  useEffect(() => () => { texNormal.dispose(); texHovered.dispose(); }, [texNormal, texHovered]);

  const aspectW = useMemo(() => {
    const img = texNormal.image as HTMLCanvasElement | null;
    if (!img) return 1.2;
    return (img.width / img.height) * 0.62;
  }, [texNormal]);

  // Reusable vectors to avoid per-frame allocation
  const _pos = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock, camera }) => {
    if (!groupRef.current || !meshRef.current) return;
    const t = clock.getElapsedTime();
    const angle = baseAngle + t * speed + phaseOffset;

    _pos.set(
      Math.cos(angle) * orbitRadius,
      Math.sin(angle * wobbleFreq + phaseOffset) * orbitRadius * wobbleAmp,
      Math.sin(angle) * orbitRadius
    ).applyMatrix4(orbitTilt);

    groupRef.current.position.copy(_pos);
    groupRef.current.quaternion.copy(camera.quaternion);

    const target = hovered ? 1.28 : 1.0;
    const s = groupRef.current.scale.x + (target - groupRef.current.scale.x) * 0.1;
    groupRef.current.scale.setScalar(s);

    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    const wantTex = hovered ? texHovered : texNormal;
    if (mat.map !== wantTex) { mat.map = wantTex; mat.needsUpdate = true; }
  });

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <planeGeometry args={[aspectW, 0.52]} />
        <meshBasicMaterial map={texNormal} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Cool thing for the words to orbit
function Nucleus() {
  const outerRef = useRef<THREE.Mesh>(null!);
  const innerRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (outerRef.current) { outerRef.current.rotation.y = t * 0.15; outerRef.current.rotation.z = t * 0.08; }
    if (innerRef.current) { innerRef.current.rotation.y = -t * 0.22; innerRef.current.rotation.x = t * 0.11; }
  });

  return (
    <group>
      <Sphere args={[0.9, 32, 32]} ref={outerRef}>
        <MeshDistortMaterial color="#c8a8ff" transparent opacity={0.13}
          distort={0.38} speed={1.4} roughness={0} metalness={1} envMapIntensity={2.5} />
      </Sphere>
      <Sphere args={[0.54, 28, 28]} ref={innerRef}>
        <MeshDistortMaterial color="#e0d0ff" transparent opacity={0.27}
          distort={0.22} speed={2.0} roughness={0} metalness={0.9} envMapIntensity={3.5} />
      </Sphere>
      <Sphere args={[0.17, 16, 16]}>
        <meshStandardMaterial color="#ffffff" emissive="#d0b8ff" emissiveIntensity={2.2}
          roughness={0} metalness={1} />
      </Sphere>
      {[1.3, 1.95, 2.65].map((r, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.4, i * 0.7, i * 0.3]}>
          <torusGeometry args={[r, 0.005, 6, 80]} />
          <meshBasicMaterial color="#c8a8ff" transparent opacity={0.12 - i * 0.03} />
        </mesh>
      ))}
    </group>
  );
}

function Particles({ count = 110 }) {
  const ref = useRef<THREE.Points>(null!);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 4 + Math.abs(Math.sin(i * 91.3)) * 4;
      const phi    = (i / count) * Math.PI * 2 * 7.3;
      const theta  = Math.acos(1 - (2 * i) / count);
      pos[i * 3]     = radius * Math.sin(theta) * Math.cos(phi);
      pos[i * 3 + 1] = radius * Math.cos(theta);
      pos[i * 3 + 2] = radius * Math.sin(theta) * Math.sin(phi);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.016;
      ref.current.rotation.x = clock.getElapsedTime() * 0.008;
    }
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#d0c0ff" size={0.022} transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

function CameraRig() {
  const { camera } = useThree();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.05;
    camera.position.x = Math.sin(t) * 7.5;
    camera.position.z = Math.cos(t) * 7.5;
    camera.position.y = Math.sin(t * 0.37) * 1.8;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

interface WordCloudCanvasProps { topics: WordTopic[]; }

export function WordCloudCanvas({ topics }: WordCloudCanvasProps) {
  const orbitParams = useMemo(() => computeOrbitParams(topics), [topics]);

  return (
    <div className="canvas-wrapper">
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 55 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.65} />
        <pointLight position={[5, 5, 5]} intensity={2.2} color="#c0a8ff" />
        <pointLight position={[-5, -3, -5]} intensity={1.3} color="#a8d8ff" />
        <pointLight position={[0, 2, 0]} intensity={0.9} color="#ffffff" />

        <Environment preset="night" />
        <CameraRig />
        <Particles />
        <Nucleus />

        {topics.map((topic, i) => (
          <Float key={topic.word} speed={0.28 + topic.weight * 0.18} rotationIntensity={0} floatIntensity={0.05}>
            <WordNode
              topic={topic}
              orbitRadius={orbitParams[i].radius}
              speed={orbitParams[i].speed}
              phaseOffset={orbitParams[i].phaseOffset}
              wobbleAmp={orbitParams[i].wobbleAmp}
              wobbleFreq={orbitParams[i].wobbleFreq}
              orbitTilt={orbitParams[i].orbitTilt}
              index={i}
              total={topics.length}
            />
          </Float>
        ))}
      </Canvas>
    </div>
  );
}