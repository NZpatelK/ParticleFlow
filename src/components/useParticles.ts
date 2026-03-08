"use client";

import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

const COUNT = 12000;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ParticleColorConfig {
  hueBase?: number;
  hueRange?: number;
  saturation?: number;
  lightnessBase?: number;
  lightnessRange?: number;
}

// Accept EITHER shape:
//   Flat:    useParticles(ref, { hueBase: 0.1, saturation: 0.95, ... })
//   Wrapped: useParticles(ref, { colorConfig: { hueBase: 0.1, ... } })
interface WrappedOptions { colorConfig?: ParticleColorConfig; }
type UseParticlesArg = ParticleColorConfig | WrappedOptions;

const COLOR_KEYS: (keyof ParticleColorConfig)[] = [
  "hueBase", "hueRange", "saturation", "lightnessBase", "lightnessRange",
];

function extractConfig(arg?: UseParticlesArg): ParticleColorConfig | undefined {
  if (!arg) return undefined;
  if (COLOR_KEYS.some((k) => k in arg)) return arg as ParticleColorConfig;
  return (arg as WrappedOptions).colorConfig;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getResponsiveParticleSize(): number {
  const w = window.innerWidth;
  if (w < 480) return 0.07;
  if (w < 768) return 0.07;
  if (w < 1280) return 0.075;
  return 0.10;
}

function getResponsiveCameraZ(): number {
  const w = window.innerWidth;
  if (w < 480) return 34;
  if (w < 768) return 32;
  if (w < 1280) return 28;
  return 22;
}

function getResponsiveSphereRadius(): number {
  const w = window.innerWidth;
  if (w < 480) return 12;
  if (w < 768) return 7;
  return 10;
}

function resolveColorConfig(cfg?: ParticleColorConfig): Required<ParticleColorConfig> {
  return {
    hueBase:        cfg?.hueBase        ?? 0.4,
    hueRange:       cfg?.hueRange       ?? 0.12,
    saturation:     cfg?.saturation     ?? 0.95,
    lightnessBase:  cfg?.lightnessBase  ?? 0.45,
    lightnessRange: cfg?.lightnessRange ?? 0.15,
  };
}

/** Immediately re-paint sphere particle colours into the live buffer. */
function applySphereColors(particles: THREE.Points, cfg: Required<ParticleColorConfig>) {
  const r      = getResponsiveSphereRadius();
  const colArr = particles.geometry.attributes.color.array as Float32Array;
  const posArr = particles.geometry.attributes.position.array as Float32Array;
  for (let i = 0; i < COUNT; i++) {
    const px = posArr[i * 3], py = posArr[i * 3 + 1], pz = posArr[i * 3 + 2];
    const depth = Math.sqrt(px * px + py * py + pz * pz) / r;
    const c = new THREE.Color().setHSL(
      cfg.hueBase + depth * cfg.hueRange,
      cfg.saturation,
      Math.min(cfg.lightnessBase + depth * cfg.lightnessRange, 0.6)
    );
    colArr[i * 3] = c.r; colArr[i * 3 + 1] = c.g; colArr[i * 3 + 2] = c.b;
  }
  particles.geometry.attributes.color.needsUpdate = true;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useParticles(
  containerRef: React.RefObject<HTMLDivElement>,
  colorArg?: UseParticlesArg
) {
  const particlesRef    = useRef<THREE.Points | null>(null);
  const currentStateRef = useRef<"sphere" | "text">("sphere");
  const animFrameRef    = useRef<number>(0);
  const colorConfigRef  = useRef<ParticleColorConfig | undefined>(extractConfig(colorArg));

  // ── Live colour sync whenever parent changes any value ────────────────────
  const cfg = extractConfig(colorArg);
  useEffect(() => {
    colorConfigRef.current = cfg;
    if (particlesRef.current) {
      // Apply color update regardless of state — so red looks red immediately
      const resolved = resolveColorConfig(cfg);
      if (currentStateRef.current === "sphere") {
        applySphereColors(particlesRef.current, resolved);
      } else {
        // In text state: re-tint the visible (text) particles with the new hue
        const particles = particlesRef.current;
        const colArr = particles.geometry.attributes.color.array as Float32Array;
        const posArr = particles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < COUNT; i++) {
          const px = posArr[i * 3], py = posArr[i * 3 + 1], pz = posArr[i * 3 + 2];
          // Only re-color particles that are near the text plane (z ≈ 0, not scattered)
          const isTextParticle = Math.abs(pz) < 2 && (Math.abs(px) < 15 && Math.abs(py) < 8);
          if (isTextParticle) {
            const hue = (resolved.hueBase + (i / COUNT) * 0.08) % 1;
            const c = new THREE.Color().setHSL(hue, 1.0, 0.55 + Math.random() * 0.05);
            colArr[i * 3] = c.r; colArr[i * 3 + 1] = c.g; colArr[i * 3 + 2] = c.b;
          } else {
            // Scattered particles: match new hue but stay dark
            const c = new THREE.Color().setHSL(resolved.hueBase, 0.6, 0.15);
            colArr[i * 3] = c.r; colArr[i * 3 + 1] = c.g; colArr[i * 3 + 2] = c.b;
          }
        }
        particles.geometry.attributes.color.needsUpdate = true;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg?.hueBase, cfg?.hueRange, cfg?.saturation, cfg?.lightnessBase, cfg?.lightnessRange]);

  // ── sphericalDistribution ─────────────────────────────────────────────────

  const sphericalDistribution = useCallback((i: number) => {
    const r     = getResponsiveSphereRadius();
    const phi   = Math.acos(-1 + (2 * i) / COUNT);
    const theta = Math.sqrt(COUNT * Math.PI) * phi;
    return {
      x: r * Math.cos(theta) * Math.sin(phi),
      y: r * Math.sin(theta) * Math.sin(phi),
      z: r * Math.cos(phi),
    };
  }, []);

  // ── createTextPoints ──────────────────────────────────────────────────────

  const createTextPoints = useCallback((text: string): { x: number; y: number }[] => {
    const canvas   = document.createElement("canvas");
    const ctx      = canvas.getContext("2d")!;
    const w        = window.innerWidth;
    const fontSize = w < 480 ? 80 : w < 768 ? 60 : 50;
    const textSize = w < 480 ? 4 : w < 768 ? 2 : w < 1280 ? 4 : 5;
    const padding  = 20;

    ctx.font = `bold ${fontSize}px Arial`;
    canvas.width  = ctx.measureText(text).width + padding * 2;
    canvas.height = fontSize + padding * 2;
    ctx.fillStyle = "white";
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textBaseline = "middle";
    ctx.textAlign    = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 128 && Math.random() < 0.3) {
        const x = (i / 4) % canvas.width;
        const y = Math.floor(i / 4 / canvas.width);
        points.push({
          x:  (x - canvas.width  / 2) / (fontSize / textSize),
          y: -(y - canvas.height / 2) / (fontSize / 5),
        });
      }
    }
    return points;
  }, []);

  // ── morphToCircle ─────────────────────────────────────────────────────────

  const morphToCircle = useCallback(() => {
    const particles = particlesRef.current;
    if (!particles) return;
    currentStateRef.current = "sphere";

    const r   = getResponsiveSphereRadius();
    // Read the CURRENT color config at the time of morphing
    const cfg = resolveColorConfig(colorConfigRef.current);

    const posArr          = particles.geometry.attributes.position.array as Float32Array;
    const targetPositions = new Float32Array(COUNT * 3);
    const targetColors    = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      const p = sphericalDistribution(i);
      targetPositions[i * 3]     = p.x + (Math.random() - 0.5) * 0.5;
      targetPositions[i * 3 + 1] = p.y + (Math.random() - 0.5) * 0.5;
      targetPositions[i * 3 + 2] = p.z + (Math.random() - 0.5) * 0.5;
      const depth = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z) / r;
      const c = new THREE.Color().setHSL(
        cfg.hueBase + depth * cfg.hueRange,
        cfg.saturation,
        Math.min(cfg.lightnessBase + depth * cfg.lightnessRange, 0.6)
      );
      targetColors[i * 3] = c.r; targetColors[i * 3 + 1] = c.g; targetColors[i * 3 + 2] = c.b;
    }

    for (let i = 0; i < posArr.length; i += 3) {
      gsap.to(particles.geometry.attributes.position.array, {
        [i]: targetPositions[i], [i+1]: targetPositions[i+1], [i+2]: targetPositions[i+2],
        duration: 2, ease: "power2.inOut",
        onUpdate: () => { particles.geometry.attributes.position.needsUpdate = true; },
      });
    }
    for (let i = 0; i < targetColors.length; i += 3) {
      gsap.to(particles.geometry.attributes.color.array, {
        [i]: targetColors[i], [i+1]: targetColors[i+1], [i+2]: targetColors[i+2],
        duration: 2, ease: "power2.inOut",
        onUpdate: () => { particles.geometry.attributes.color.needsUpdate = true; },
      });
    }
  }, [sphericalDistribution]);

  // ── morphToText ───────────────────────────────────────────────────────────

  const morphToText = useCallback((text: string) => {
    const particles = particlesRef.current;
    if (!particles) return;
    currentStateRef.current = "text";

    // Read the CURRENT color config at the time morphToText is called
    const cfg        = resolveColorConfig(colorConfigRef.current);
    const textPoints = createTextPoints(text);
    const posArr     = particles.geometry.attributes.position.array as Float32Array;
    const colArr     = particles.geometry.attributes.color.array as Float32Array;
    const targetPositions = new Float32Array(COUNT * 3);
    const targetColors    = new Float32Array(COUNT * 3);

    gsap.to(particles.rotation, { x: 0, y: 0, z: 0, duration: 0.5 });

    for (let i = 0; i < COUNT; i++) {
      if (i < textPoints.length) {
        targetPositions[i * 3]     = textPoints[i].x;
        targetPositions[i * 3 + 1] = textPoints[i].y;
        targetPositions[i * 3 + 2] = 0;

        // FIX: use a tight hue range (0.08) around the selected hueBase
        // so the text stays recognisably the chosen colour (e.g. red stays red)
        const hue = (cfg.hueBase + (i / textPoints.length) * 0.08) % 1;
        const c   = new THREE.Color().setHSL(hue, 1.0, 0.55 + Math.random() * 0.05);
        targetColors[i * 3] = c.r; targetColors[i * 3 + 1] = c.g; targetColors[i * 3 + 2] = c.b;
      } else {
        // Scattered / hidden particles — match the chosen hue but stay very dark
        const angle  = Math.random() * Math.PI * 2;
        const radius = Math.random() * 20 + 10;
        targetPositions[i * 3]     = Math.cos(angle) * radius;
        targetPositions[i * 3 + 1] = Math.sin(angle) * radius;
        targetPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;

        // FIX: was hardcoded hue 0.4 (green/teal); now uses cfg.hueBase
        const c = new THREE.Color().setHSL(cfg.hueBase, 0.6, 0.12);
        targetColors[i * 3] = c.r; targetColors[i * 3 + 1] = c.g; targetColors[i * 3 + 2] = c.b;
      }
    }

    for (let i = 0; i < posArr.length; i += 3) {
      gsap.to(particles.geometry.attributes.position.array, {
        [i]: targetPositions[i], [i+1]: targetPositions[i+1], [i+2]: targetPositions[i+2],
        duration: 2, ease: "power2.inOut",
        onUpdate: () => { particles.geometry.attributes.position.needsUpdate = true; },
      });
    }
    for (let i = 0; i < colArr.length; i += 3) {
      gsap.to(particles.geometry.attributes.color.array, {
        [i]: targetColors[i], [i+1]: targetColors[i+1], [i+2]: targetColors[i+2],
        duration: 2, ease: "power2.inOut",
        onUpdate: () => { particles.geometry.attributes.color.needsUpdate = true; },
      });
    }

    setTimeout(() => morphToCircle(), 4000);
  }, [createTextPoints, morphToCircle]);

  // ── init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cfg = resolveColorConfig(colorConfigRef.current);
    const r   = getResponsiveSphereRadius();

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = getResponsiveCameraZ();

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000);
    container.appendChild(renderer.domElement);

    const geometry  = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      const phi   = Math.acos(-1 + (2 * i) / COUNT);
      const theta = Math.sqrt(COUNT * Math.PI) * phi;
      const x = r * Math.cos(theta) * Math.sin(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(phi);
      positions[i * 3]     = x + (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 1] = y + (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 2] = z + (Math.random() - 0.5) * 0.5;
      const depth = Math.sqrt(x * x + y * y + z * z) / r;
      const c = new THREE.Color().setHSL(
        cfg.hueBase + depth * cfg.hueRange,
        cfg.saturation,
        Math.min(cfg.lightnessBase + depth * cfg.lightnessRange, 0.6)
      );
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color",    new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: getResponsiveParticleSize(),
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 1.0,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      if (currentStateRef.current === "sphere") particles.rotation.y += 0.002;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h;
      camera.position.z = getResponsiveCameraZ();
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      (particles.material as THREE.PointsMaterial).size = getResponsiveParticleSize();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [containerRef]);

  return { morphToText };
}