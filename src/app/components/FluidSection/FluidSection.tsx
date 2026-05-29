'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import styles from './FluidSection.module.css';

// ── GLSL Shaders ────────────────────────────────────────────────────
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2  uMouse;       // normalized 0..1
  uniform vec2  uResolution;
  varying vec2  vUv;

  // ── 2D pseudo-random hash ──────────────────────────────────────────
  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453123);
  }

  // ── Value noise ────────────────────────────────────────────────────
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = dot(hash2(i + vec2(0,0)), f - vec2(0,0));
    float b = dot(hash2(i + vec2(1,0)), f - vec2(1,0));
    float c = dot(hash2(i + vec2(0,1)), f - vec2(0,1));
    float d = dot(hash2(i + vec2(1,1)), f - vec2(1,1));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 0.5 + 0.5;
  }

  // ── Fractional brownian motion ─────────────────────────────────────
  float fbm(vec2 p) {
    float val = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 5; i++) {
      val  += amp * noise(p * freq);
      freq *= 2.1;
      amp  *= 0.48;
    }
    return val;
  }

  void main() {
    vec2 uv = vUv;

    // Aspect-corrected UV
    float aspect = uResolution.x / uResolution.y;
    vec2 uvA = vec2(uv.x * aspect, uv.y);

    // Mouse influence — distance-based ripple
    vec2 mouse = vec2(uMouse.x * aspect, uMouse.y);
    float dist = length(uvA - mouse);
    float ripple = sin(dist * 28.0 - uTime * 3.2) * exp(-dist * 4.5) * 0.06;

    // Flowing base distortion (time-driven fluid noise)
    vec2 flow = vec2(
      fbm(uvA * 2.2 + vec2(uTime * 0.10,  uTime * 0.07)),
      fbm(uvA * 2.2 + vec2(uTime * 0.09, -uTime * 0.11) + 3.7)
    );

    // Warp UV with ripple + flow
    vec2 warpedUV = uv + flow * 0.055 + ripple;

    // ── Colour layers ──────────────────────────────────────────────────
    // Deep void base
    vec3 colDark   = vec3(0.004, 0.000, 0.032);   // #010008
    // Midnight indigo
    vec3 colMid    = vec3(0.020, 0.008, 0.090);   // deep purple
    // Warm orange accent (mouse heat)
    vec3 colAccent = vec3(1.000, 0.478, 0.000);   // #FF7A00
    // Ice blue shimmer
    vec3 colShimmer = vec3(0.200, 0.440, 1.000);  // #3370FF

    float n1 = fbm(warpedUV * 3.0 + uTime * 0.08);
    float n2 = fbm(warpedUV * 5.5 - uTime * 0.06 + 1.7);

    // Base fluid colour
    vec3 col = mix(colDark, colMid, n1 * 1.4);

    // Shimmer veins
    float vein = smoothstep(0.58, 0.72, n2);
    col = mix(col, colShimmer * 0.55, vein * 0.5);

    // Orange heat blob near mouse
    float heatMask = exp(-dist * 3.0) * 0.85;
    col = mix(col, colAccent * 0.7, heatMask * (0.3 + abs(ripple) * 8.0));

    // Bright shimmer highlights where ripple peaks
    float highlight = smoothstep(0.62, 0.75, n1) * 0.35;
    col += vec3(highlight * 0.6, highlight * 0.4, highlight * 1.0);

    // Edge vignette
    vec2 vigUV = uv * 2.0 - 1.0;
    float vig = 1.0 - dot(vigUV * vec2(0.6, 0.8), vigUV * vec2(0.6, 0.8));
    vig = clamp(vig, 0.0, 1.0);
    vig = pow(vig, 0.55);
    col *= vig;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function FluidSection() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const sectionRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas  = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const getW = () => section.clientWidth;
    const getH = () => section.clientHeight;

    // ── Renderer ────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(getW(), getH());

    // ── Scene ────────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Full-screen quad
    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      uTime:       { value: 0 },
      uMouse:      { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: { value: new THREE.Vector2(getW(), getH()) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // ── Mouse tracking (smooth lerp) ─────────────────────────────────
    const targetMouse  = new THREE.Vector2(0.5, 0.5);
    const currentMouse = new THREE.Vector2(0.5, 0.5);

    const onPointerMove = (e: PointerEvent) => {
      const rect = section.getBoundingClientRect();
      // Only track when inside this section
      if (
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top  && e.clientY <= rect.bottom
      ) {
        targetMouse.set(
          (e.clientX - rect.left) / rect.width,
          1.0 - (e.clientY - rect.top) / rect.height
        );
      }
    };
    window.addEventListener('pointermove', onPointerMove);

    // ── Resize ───────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      renderer.setSize(getW(), getH());
      uniforms.uResolution.value.set(getW(), getH());
    });
    ro.observe(section);

    // ── Render loop ──────────────────────────────────────────────────
    let rafId: number;
    const startTime = performance.now();

    const animate = () => {
      rafId = requestAnimationFrame(animate);

      uniforms.uTime.value = (performance.now() - startTime) / 1000;

      // Smooth mouse lerp
      currentMouse.x += (targetMouse.x - currentMouse.x) * 0.06;
      currentMouse.y += (targetMouse.y - currentMouse.y) * 0.06;
      uniforms.uMouse.value.copy(currentMouse);

      renderer.render(scene, camera);
    };
    animate();

    // ── Cleanup ──────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={sectionRef} className={styles.fluidSection} id="fluid-section">
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

      {/* Overlay content */}
      <div className={styles.content}>
        <p className={styles.eyebrow}>Powered by Research</p>
        <h2 className={styles.heading}>
          Fluid Intelligence,<br />Real-World Impact
        </h2>
        <p className={styles.sub}>
          Move your cursor across this surface — every ripple mirrors how
          I approach problems: adaptive, responsive, and deeply layered.
        </p>
      </div>
    </div>
  );
}
