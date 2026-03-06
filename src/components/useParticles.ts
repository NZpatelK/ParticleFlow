"use client";

import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

const COUNT = 12000;

export function useParticles(containerRef: React.RefObject<HTMLDivElement>) {
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const particlesRef = useRef<THREE.Points | null>(null);
    const currentStateRef = useRef<"sphere" | "text">("sphere");
    const animFrameRef = useRef<number>(0);

    // ── helpers ──────────────────────────────────────────────────────────────

    const sphericalDistribution = useCallback((i: number) => {
        const phi = Math.acos(-1 + (2 * i) / COUNT);
        const theta = Math.sqrt(COUNT * Math.PI) * phi;
        return {
            x: 8 * Math.cos(theta) * Math.sin(phi),
            y: 8 * Math.sin(theta) * Math.sin(phi),
            z: 8 * Math.cos(phi),
        };
    }, []);

    const createTextPoints = useCallback(
        (text: string): { x: number; y: number }[] => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d")!;
            const fontSize = 100;
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

        const positions = particles.geometry.attributes.position
            .array as Float32Array;
        const colors = particles.geometry.attributes.color.array as Float32Array;
        const targetPositions = new Float32Array(COUNT * 3);

        for (let i = 0; i < COUNT; i++) {
            const p = sphericalDistribution(i);
            targetPositions[i * 3] = p.x + (Math.random() - 0.5) * 0.5;
            targetPositions[i * 3 + 1] = p.y + (Math.random() - 0.5) * 0.5;
            targetPositions[i * 3 + 2] = p.z + (Math.random() - 0.5) * 0.5;

            const depth =
                Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z) / 8;
            const color = new THREE.Color();
            color.setHSL(0.4 + depth * 0.1, 0.8, 0.4 + depth * 0.3);
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

            for (let i = 0; i < COUNT; i++) {
                if (i < textPoints.length) {
                    targetPositions[i * 3] = textPoints[i].x;
                    targetPositions[i * 3 + 1] = textPoints[i].y;
                    targetPositions[i * 3 + 2] = 0;
                } else {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * 20 + 10;
                    targetPositions[i * 3] = Math.cos(angle) * radius;
                    targetPositions[i * 3 + 1] = Math.sin(angle) * radius;
                    targetPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
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

            setTimeout(() => morphToCircle(), 4000);
        },
        [createTextPoints, morphToCircle]
    );

    // ── init ──────────────────────────────────────────────────────────────────

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 25;
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
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
            const x = 8 * Math.cos(theta) * Math.sin(phi);
            const y = 8 * Math.sin(theta) * Math.sin(phi);
            const z = 8 * Math.cos(phi);

            positions[i * 3] = x + (Math.random() - 0.5) * 0.5;
            positions[i * 3 + 1] = y + (Math.random() - 0.5) * 0.5;
            positions[i * 3 + 2] = z + (Math.random() - 0.5) * 0.5;

            const depth = Math.sqrt(x * x + y * y + z * z) / 8;
            const color = new THREE.Color();
            color.setHSL(0.4 + depth * 0.1, 0.8, 0.4 + depth * 0.3);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.08,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8,
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

        // Resize
        const onResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener("resize", onResize);

        return () => {
            cancelAnimationFrame(animFrameRef.current);
            window.removeEventListener("resize", onResize);
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, [containerRef]);

    return { morphToText };
}
