'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import styles from './CinematicLayer.module.css';

const PARTICLE_COUNT = 2000;

export default function CinematicLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use the parent section's dimensions (not the window)
    const parent = canvas.parentElement!;
    const getW = () => parent.clientWidth;
    const getH = () => parent.clientHeight;

    // ── Renderer ──────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(getW(), getH());
    renderer.setClearColor(0x000000, 0);

    // ── Scene & Camera ────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, getW() / getH(), 0.1, 100);
    camera.position.set(0, 0, 5);

    // ── Particle geometry ─────────────────────────────────────────────
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors    = new Float32Array(PARTICLE_COUNT * 3);
    const sizes     = new Float32Array(PARTICLE_COUNT);
    const phases    = new Float32Array(PARTICLE_COUNT);

    const warmOrange  = new THREE.Color('#FF7A00');
    const softWhite   = new THREE.Color('#E8E4FF');
    const accentBlue  = new THREE.Color('#4F8EFF');

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;

      const roll = Math.random();
      const c = roll < 0.55 ? warmOrange : roll < 0.85 ? softWhite : accentBlue;
      const brightness = 0.5 + Math.random() * 0.5;
      colors[i * 3 + 0] = c.r * brightness;
      colors[i * 3 + 1] = c.g * brightness;
      colors[i * 3 + 2] = c.b * brightness;

      sizes[i]  = 0.02 + Math.random() * 0.06;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
    geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // ── Parallax mouse state ──────────────────────────────────────────
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    const handlePointerMove = (e: PointerEvent) => {
      targetX =  (e.clientX / window.innerWidth  - 0.5) * 0.6;
      targetY = -(e.clientY / window.innerHeight - 0.5) * 0.4;
    };
    window.addEventListener('pointermove', handlePointerMove);

    // ── Resize — watch parent, not window ────────────────────────────
    const ro = new ResizeObserver(() => {
      camera.aspect = getW() / getH();
      camera.updateProjectionMatrix();
      renderer.setSize(getW(), getH());
    });
    ro.observe(parent);

    // ── Animation loop ────────────────────────────────────────────────
    let rafId: number;
    const posAttr  = geometry.getAttribute('position') as THREE.BufferAttribute;
    const originalY = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) originalY[i] = posAttr.getY(i);

    const startTime = performance.now();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) / 1000;

      // Sine-wave lift
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        posAttr.setY(i, originalY[i] + Math.sin(elapsed * 0.4 + phases[i]) * 0.22);
      }
      posAttr.needsUpdate = true;

      // Smooth parallax
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;
      camera.position.x = currentX;
      camera.position.y = currentY;
      camera.lookAt(scene.position);

      // Slow global rotation
      particles.rotation.y = elapsed * 0.018;
      particles.rotation.x = elapsed * 0.006;

      renderer.render(scene, camera);
    };
    animate();

    // ── Cleanup ───────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', handlePointerMove);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      aria-hidden="true"
    />
  );
}
