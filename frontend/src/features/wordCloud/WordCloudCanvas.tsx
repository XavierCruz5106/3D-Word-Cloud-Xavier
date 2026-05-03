import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sphere, MeshDistortMaterial, Environment } from "@react-three/drei";
import * as THREE from "three";
import type { WordTopic } from "../../mockData";

const ETHEREAL_PALETTE = [
  { color: new THREE.Color("#e0d6ff") },
  { color: new THREE.Color("#cfe9ff") },
  { color: new THREE.Color("#ffe9d6") },
  { color: new THREE.Color("#f1e8ff") },
  { color: new THREE.Color("#d6fff3") },
  { color: new THREE.Color("#ffd6f3") },
];


function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function makeWordTexture(
  word: string,
  color: THREE.Color,
  weight: number,
  hovered: boolean
): THREE.Texture {
    const canvas = document.createElement("canvas");
    const dpr = window.devicePixelRatio > 1 ? 2 : 1;
    

    const fontSize = Math.round((22 + weight * 28) * dpr);
    const font = `${hovered ? 500 : 350} ${fontSize}px Space Grotesk, Arial`;

    const ctx = canvas.getContext("2d")!;
    ctx.font = font;

    const textW = ctx.measureText(word).width;
    const pad = 24 * dpr;

    canvas.width = textW + pad * 2;
    canvas.height = fontSize * 1.6;

    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const r = Math.floor(color.r * 255);
    const g = Math.floor(color.g * 255);
    const b = Math.floor(color.b * 255);

    console.log(r + " " + g + " " + b)

    const alpha = hovered ? 1.0 : 0.9;

    ctx.shadowColor = `rgba(${r},${g},${b},0.9)`;
    ctx.shadowBlur = hovered ? 22 : 14;
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.fillText(word, cx, cy);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
}

function computeOrbitParams(topics: WordTopic[]) {
  return topics.map((t, i) => {
    const s1 = Math.sin(i * 127.1) * 0.5 + 0.5;
    const s2 = Math.sin(i * 311.7) * 0.5 + 0.5;

    return {
      radius: 2.8 + (1 - t.weight) * 3.4,
      speed: 0.05 + (1 - t.weight) * 0.06,
      phaseOffset: (i / topics.length) * Math.PI * 2,
      wobbleAmp: 0.12 + s1 * 0.12,
      wobbleFreq: 0.4 + s2 * 0.35,
      orbitTilt: new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(Math.sin(i), Math.cos(i * 1.3), Math.sin(i * 0.7)).normalize(),
        0.25
      ),
    };
  });
}

function WordNode({
  topic,
  orbitRadius,
  speed,
  phaseOffset,
  wobbleAmp,
  wobbleFreq,
  orbitTilt,
  index,
  total,
}: any) {
    const groupRef = useRef<THREE.Group>(null!);
    const meshRef = useRef<THREE.Mesh>(null!);
    const [hovered, setHovered] = useState(false);

    const baseAngle = (index / total) * Math.PI * 2;

    const seed = hashString(topic.word);
    const paletteIndex = seed % ETHEREAL_PALETTE.length;

    const color = ETHEREAL_PALETTE[paletteIndex].color;

    const texNormal = useMemo(
        () => makeWordTexture(topic.word, color, topic.weight, false),
        [topic.word, color, topic.weight]
    );

    const texHover = useMemo(
        () => makeWordTexture(topic.word, color, topic.weight, true),
        [topic.word, color, topic.weight]
    );

    useEffect(() => {
        return () => {
        texNormal.dispose();
        texHover.dispose();
        };
    }, [texNormal, texHover]);

    const aspectW = useMemo(() => {
        const img = texNormal.image as HTMLCanvasElement;
        if (!img) return 1.2;
        return (img.width / img.height) * 0.6;
    }, [texNormal]);

    const _pos = useMemo(() => new THREE.Vector3(), []);

    useFrame(({ clock, camera }) => {
        const t = clock.getElapsedTime();
        const angle = baseAngle + t * speed + phaseOffset;

        _pos.set(
        Math.cos(angle) * orbitRadius,
        Math.sin(angle * wobbleFreq + phaseOffset) * orbitRadius * wobbleAmp,
        Math.sin(angle) * orbitRadius
        ).applyMatrix4(orbitTilt);

        groupRef.current.position.copy(_pos);

        groupRef.current.quaternion.slerp(camera.quaternion, 0.08);

        const targetScale = hovered ? 1.35 : 1.0;
        groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.12
        );

        const mat = meshRef.current.material as THREE.MeshBasicMaterial;

        mat.opacity += ((hovered ? 1 : 0.85) - mat.opacity) * 0.12;

        const wantTex = hovered ? texHover : texNormal;
        if (mat.map !== wantTex) {
        mat.map = wantTex;
        mat.needsUpdate = true;
        }
  });

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <planeGeometry args={[aspectW, 0.55]} />
        <meshBasicMaterial
          map={texNormal}
          transparent
          depthWrite={true}
          depthTest={true}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

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
        <MeshDistortMaterial color="#c8a8ff" transparent opacity={1}
            distort={0.38}
            speed={1.4} 
            roughness={0}   
            metalness={1}   
            envMapIntensity={2.5} 
            depthWrite={true}  
            />
      </Sphere>
      <Sphere args={[0.54, 28, 28]} ref={innerRef}>
        <MeshDistortMaterial color="#e0d0ff" transparent opacity={0.27}
          distort={0.22} speed={2.0} roughness={0} metalness={0.9} envMapIntensity={3.5} depthWrite={true} />
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

function Particles({ count = 90 }) {
    const ref = useRef<THREE.Points>(null!);
    const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const r = 5 + Math.sin(i) * 3;
        const a = (i / count) * Math.PI * 2 * 5;

        pos[i * 3] = Math.cos(a) * r;
        pos[i * 3 + 1] = Math.sin(a * 0.5) * r;
        pos[i * 3 + 2] = Math.sin(a) * r;
    }

    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);

  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.getElapsedTime() * 0.02;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#e0d6ff" size={0.02} transparent opacity={0.6} />
    </points>
  );
}

function CameraRig() {
  const { camera } = useThree();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.05;

    camera.position.x = Math.sin(t) * 7;
    camera.position.z = Math.cos(t) * 7;
    camera.position.y = Math.sin(t * 0.4) * 1.5;

    camera.lookAt(0, 0, 0);
  });

  return null;
}

export function WordCloudCanvas({ topics }: { topics: WordTopic[] }) {
  const orbit = useMemo(() => computeOrbitParams(topics), [topics]);

  return (
    <div className="canvas-wrapper">
      <Canvas camera={{ position: [0, 0, 7.5], fov: 55 }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[5, 5, 5]} intensity={2.2} color="#d0b8ff" />

        <Environment preset="night" />
        <CameraRig />
        <Particles />
        <Nucleus />

        {topics.map((t, i) => (
          <Float key={t.word} speed={0.25 + t.weight * 0.2}>
            <WordNode
              topic={t}
              orbitRadius={orbit[i].radius}
              speed={orbit[i].speed}
              phaseOffset={orbit[i].phaseOffset}
              wobbleAmp={orbit[i].wobbleAmp}
              wobbleFreq={orbit[i].wobbleFreq}
              orbitTilt={orbit[i].orbitTilt}
              index={i}
              total={topics.length}
            />
          </Float>
        ))}
      </Canvas>
    </div>
  );
}