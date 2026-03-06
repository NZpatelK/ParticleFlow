"use client";

import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

const COUNT = 12000;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ParticleColorConfig {
  /** HSL hue offset for particle base colour (0–1). Default: 0.4 */
  hueBase?: number;
  /** HSL hue range added by depth (0–1). Default: 0.1 */
  hueRange?: number;
  /** HSL saturation (0–1). Default: 0.8 */
  saturation?: number;
  /** HSL lightness base (0–1). Default: 0.4 */
  lightnessBase?: number;
  /** HSL lightness range added by depth (0–1). Default: 0.3 */
  lightnessRange?: number;
}

export interface UseParticlesOptions {
  /** Colour configuration passed down from the parent component. */
  colorConfig?: ParticleColorConfig;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns particle size scaled for the current viewport. */
function getResponsiveParticleSize(): number {
  const w = window.innerWidth;
  if (w < 480) return 0.06;   // small phones
  if (w < 768) return 0.07;   // large phones / small tablets
  if (w < 1280) return 0.075; // tablets / laptops
  return 0.08;                 // desktops
}

/** Returns camera Z position scaled for the current viewport. */
function getResponsiveCameraZ(): number {
  const w = window.innerWidth;
  if (w < 480) return 38;
  if (w < 768) return 32;
  if (w < 1280) return 28;
  return 25;
}

/** Returns sphere radius scaled for the current viewport. */
function getResponsiveSphereRadius(): number {
  const w = window.innerWidth;
  if (w < 480) return 6;
  if (w < 768) return 7;
  return 8;
}

/** Resolves a full colour config, filling in defaults. */
function resolveColorConfig(cfg?: ParticleColorConfig): Required<ParticleColorConfig> {
  return {
    hueBase: cfg?.hueBase ?? 0.4,
    hueRange: cfg?.hueRange ?? 0.12,
    saturation: cfg?.saturation ?? 0.95,
    lightnessBase: cfg?.lightnessBase ?? 0.60,
    lightnessRange: cfg?.lightnessRange ?? 0.35,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useParticles(
  containerRef: React.RefObject<HTMLDivElement>,
  options: UseParticlesOptions = {}
) {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const currentStateRef = useRef<"sphere" | "text">("sphere");
  const animFrameRef = useRef<number>(0);

  // Keep a mutable ref so morphToCircle always reads the latest parent colour
  const colorConfigRef = useRef<ParticleColorConfig | undefined>(options.colorConfig);
  useEffect(() => {
    colorConfigRef.current = options.colorConfig;
  }, [options.colorConfig]);

  // ── sphericalDistribution ─────────────────────────────────────────────────

  const sphericalDistribution = useCallback((i: number) => {
    const r = getResponsiveSphereRadius();
    const phi = Math.acos(-1 + (2 * i) / COUNT);
    const theta = Math.sqrt(COUNT * Math.PI) * phi;
    return {
      x: r * Math.cos(theta) * Math.sin(phi),
      y: r * Math.sin(theta) * Math.sin(phi),
      z: r * Math.cos(phi),
    };
  }, []);

  // ── createTextPoints ──────────────────────────────────────────────────────

  const createTextPoints = useCallback(
    (text: string): { x: number; y: number }[] => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      // Responsive font size
      const w = window.innerWidth;
      const fontSize = w < 480 ? 60 : w < 768 ? 80 : 100;
      const padding = 20;

      ctx.font = `bold ${fontSize}px Arial`;
      const textMetrics = ctx.measureText(text);
      canvas.width = textMetrics.width + padding * 2;
      canvas.height = fontSize + padding * 2;

      ctx.fillStyle = "white";
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      const points: { x: number; y: number }[] = [];

      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] > 128 && Math.random() < 0.3) {
          const x = (i / 4) % canvas.width;
          const y = Math.floor(i / 4 / canvas.width);
          points.push({
            x: (x - canvas.width / 2) / (fontSize / 10),
            y: -(y - canvas.height / 2) / (fontSize / 10),
          });
        }
      }
      return points;
    },
    []
  );

  // ── morphToCircle ─────────────────────────────────────────────────────────

  const morphToCircle = useCallback(() => {
    const particles = particlesRef.current;
    if (!particles) return;
    currentStateRef.current = "sphere";

    const r = getResponsiveSphereRadius();
    const cfg = resolveColorConfig(colorConfigRef.current);

    const positions = particles.geometry.attributes.position
      .array as Float32Array;
    const colors = particles.geometry.attributes.color.array as Float32Array;
    const targetPositions = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      const p = sphericalDistribution(i);
      targetPositions[i * 3] = p.x + (Math.random() - 0.5) * 0.5;
      targetPositions[i * 3 + 1] = p.y + (Math.random() - 0.5) * 0.5;
      targetPositions[i * 3 + 2] = p.z + (Math.random() - 0.5) * 0.5;

      const depth = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z) / r;
      const color = new THREE.Color();
      color.setHSL(
        cfg.hueBase + depth * cfg.hueRange,
        cfg.saturation,
        cfg.lightnessBase + depth * cfg.lightnessRange
      );
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    for (let i = 0; i < positions.length; i += 3) {
      gsap.to(particles.geometry.attributes.position.array, {
        [i]: targetPositions[i],
        [i + 1]: targetPositions[i + 1],
        [i + 2]: targetPositions[i + 2],
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => {
          particles.geometry.attributes.position.needsUpdate = true;
        },
      });
    }

    for (let i = 0; i < colors.length; i += 3) {
      gsap.to(particles.geometry.attributes.color.array, {
        [i]: colors[i],
        [i + 1]: colors[i + 1],
        [i + 2]: colors[i + 2],
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => {
          particles.geometry.attributes.color.needsUpdate = true;
        },
      });
    }
  }, [sphericalDistribution]);

  // ── morphToText ───────────────────────────────────────────────────────────

  const morphToText = useCallback(
    (text: string) => {
      const particles = particlesRef.current;
      if (!particles) return;
      currentStateRef.current = "text";

      const textPoints = createTextPoints(text);
      const positions = particles.geometry.attributes.position
        .array as Float32Array;
      const targetPositions = new Float32Array(COUNT * 3);

      gsap.to(particles.rotation, { x: 0, y: 0, z: 0, duration: 0.5 });

      // Build target colours — text particles blaze white-hot, fringe particles dim
      const cfg = resolveColorConfig(colorConfigRef.current);
      const targetColors = new Float32Array(COUNT * 3);
      const currentColors = particles.geometry.attributes.color.array as Float32Array;

      for (let i = 0; i < COUNT; i++) {
        if (i < textPoints.length) {
          targetPositions[i * 3] = textPoints[i].x;
          targetPositions[i * 3 + 1] = textPoints[i].y;
          targetPositions[i * 3 + 2] = 0;

          // Shift hue slightly per particle for a shimmer, lightness near 1
          const hue = (cfg.hueBase + (i / textPoints.length) * 0.15) % 1;
          const bright = new THREE.Color().setHSL(hue, 1.0, 0.88 + Math.random() * 0.12);
          targetColors[i * 3]     = bright.r;
          targetColors[i * 3 + 1] = bright.g;
          targetColors[i * 3 + 2] = bright.b;
        } else {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 20 + 10;
          targetPositions[i * 3] = Math.cos(angle) * radius;
          targetPositions[i * 3 + 1] = Math.sin(angle) * radius;
          targetPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;

          // Fringe particles fade dim so text pops
          const dim = new THREE.Color().setHSL(cfg.hueBase, 0.5, 0.18);
          targetColors[i * 3]     = dim.r;
          targetColors[i * 3 + 1] = dim.g;
          targetColors[i * 3 + 2] = dim.b;
        }
      }

      for (let i = 0; i < positions.length; i += 3) {
        gsap.to(particles.geometry.attributes.position.array, {
          [i]: targetPositions[i],
          [i + 1]: targetPositions[i + 1],
          [i + 2]: targetPositions[i + 2],
          duration: 2,
          ease: "power2.inOut",
          onUpdate: () => {
            particles.geometry.attributes.position.needsUpdate = true;
          },
        });
      }

      // Animate colours in sync with the position morph
      for (let i = 0; i < currentColors.length; i += 3) {
        gsap.to(particles.geometry.attributes.color.array, {
          [i]:     targetColors[i],
          [i + 1]: targetColors[i + 1],
          [i + 2]: targetColors[i + 2],
          duration: 2,
          ease: "power2.inOut",
          onUpdate: () => {
            particles.geometry.attributes.color.needsUpdate = true;
          },
        });
      }

      setTimeout(() => morphToCircle(), 4000);
    },
    [createTextPoints, morphToCircle]
  );

  // ── init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cfg = resolveColorConfig(colorConfigRef.current);
    const r = getResponsiveSphereRadius();

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = getResponsiveCameraZ();
    cameraRef.current = camera;

    // Renderer — fill the container, not the whole window
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // cap for perf
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Particles
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      const phi = Math.acos(-1 + (2 * i) / COUNT);
      const theta = Math.sqrt(COUNT * Math.PI) * phi;
      const x = r * Math.cos(theta) * Math.sin(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(phi);

      positions[i * 3] = x + (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 1] = y + (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 2] = z + (Math.random() - 0.5) * 0.5;

      const depth = Math.sqrt(x * x + y * y + z * z) / r;
      const color = new THREE.Color();
      color.setHSL(
        cfg.hueBase + depth * cfg.hueRange,
        cfg.saturation,
        cfg.lightnessBase + depth * cfg.lightnessRange
      );
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

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

    // Animation loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      if (currentStateRef.current === "sphere") {
        particles.rotation.y += 0.002;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Resize — respond to container size, not just window
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;

      camera.aspect = w / h;
      camera.position.z = getResponsiveCameraZ();
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);

      // Also update particle size on resize
      (particles.material as THREE.PointsMaterial).size =
        getResponsiveParticleSize();
    };

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef]);

  return { morphToText };
}