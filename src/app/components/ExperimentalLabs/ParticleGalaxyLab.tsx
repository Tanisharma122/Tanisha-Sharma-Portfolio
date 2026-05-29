'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import styles from './ParticleGalaxyLab.module.css';

// ── Constants ──────────────────────────────────────────────────────────────
const PARTICLE_COUNT = 8000;
const MORPH_SPEED = 0.06;
const PINCH_THRESHOLD = 0.08;

const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17]
];

export interface GalaxyTelemetryData {
  state: 'CALIBRATING' | 'NO_HAND' | 'ORBIT_IDLE' | 'GRAVITY_PINCH' | 'FIELD_EXPANDING';
  pinchDist: number;
  particleCount: number;
  orbitalVelocity: number;
  handCenter: { x: number; y: number } | null;
  activeShapeLabel?: 'COSMIC_SPHERE' | 'CONSTELLATION_STAR' | 'HOLOGRAPHIC_FLOWER';
}

interface ParticleGalaxyLabProps {
  onTelemetryUpdate?: (data: GalaxyTelemetryData) => void;
  onClose?: () => void;
}

// ── HSL→RGB ────────────────────────────────────────────────────────────────
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p2 = 2 * l - q2;
    r = hue2rgb(p2, q2, h + 1 / 3);
    g = hue2rgb(p2, q2, h);
    b = hue2rgb(p2, q2, h - 1 / 3);
  }
  return [r, g, b];
}

export default function ParticleGalaxyLab({ onTelemetryUpdate, onClose }: ParticleGalaxyLabProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const webglMountRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const handCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false); // Default: space mode
  const [activeShapeDisplay, setActiveShapeDisplay] = useState<'SPHERE' | 'STAR' | 'FLOWER'>('SPHERE');

  // Three.js refs
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sphereRef = useRef<THREE.Points | null>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);

  // Hand attractor
  const attractorRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const smoothedAttractorRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const pinchDistRef = useRef(1.0);
  const activeShapeRef = useRef<number>(1);

  // Mouse drag rotation state (for fallback when no hand)
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const rotRef = useRef({ x: 0, y: 0 });

  // MediaPipe refs
  const activeStreamRef = useRef<MediaStream | null>(null);
  const mpCameraRef = useRef<any>(null);
  const mpHandsRef = useRef<any>(null);
  const lastLandmarksRef = useRef<any>(null);
  const smoothedLandmarksRef = useRef<any>(null);
  const handLostFrameCountRef = useRef<number>(0);
  const animIdRef = useRef<number>(0);

  // Shape target buffers
  const shape1Pos = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));
  const shape1Col = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));
  const shape2Pos = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));
  const shape2Col = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));
  const shape3Pos = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));
  const shape3Col = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));

  // ── Pre-calculate shape target arrays ───────────────────────────────────
  useEffect(() => {
    // SHAPE 01: COSMIC SPHERE — tight thin shell, matching the reference code exactly
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = 2 * Math.PI * Math.random();
      const r = 1.0 + (Math.random() - 0.5) * 0.07; // Very thin shell

      shape1Pos.current[i3]     = r * Math.sin(theta) * Math.cos(phi);
      shape1Pos.current[i3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      shape1Pos.current[i3 + 2] = r * Math.cos(theta);

      // Blue-purple gradient matching reference
      const t = Math.random();
      shape1Col.current[i3]     = 0.35 + t * 0.35; // R
      shape1Col.current[i3 + 1] = 0.25 + t * 0.40; // G
      shape1Col.current[i3 + 2] = 0.80 + t * 0.20; // B
    }

    // SHAPE 02: CONSTELLATION STAR — 5-pointed star
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const armMod = Math.abs(Math.cos(angle * 2.5));
      const r = 0.3 + 1.0 * armMod;
      const jitter = (Math.random() - 0.5) * 0.05;

      shape2Pos.current[i3]     = r * Math.cos(angle) + jitter;
      shape2Pos.current[i3 + 1] = r * Math.sin(angle) + jitter;
      shape2Pos.current[i3 + 2] = (Math.random() - 0.5) * 0.12;

      const t = Math.random();
      if (t > 0.5) {
        shape2Col.current[i3]     = 1.0;   shape2Col.current[i3 + 1] = 0.85;  shape2Col.current[i3 + 2] = 0.3;
      } else {
        shape2Col.current[i3]     = 0.0;   shape2Col.current[i3 + 1] = 0.9;   shape2Col.current[i3 + 2] = 1.0;
      }
    }

    // SHAPE 03: HOLOGRAPHIC FLOWER — rose curve r = cos(nθ)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const theta = (i / PARTICLE_COUNT) * Math.PI * 2;
      const r = 1.2 * Math.cos(6 * theta);

      shape3Pos.current[i3]     = r * Math.cos(theta);
      shape3Pos.current[i3 + 1] = r * Math.sin(theta);
      shape3Pos.current[i3 + 2] = Math.sin(theta * 4) * 0.2;

      const rgb = hslToRgb(theta / (Math.PI * 2), 1.0, 0.55);
      shape3Col.current[i3]     = rgb[0];
      shape3Col.current[i3 + 1] = rgb[1];
      shape3Col.current[i3 + 2] = rgb[2];
    }
  }, []);

  // ── Camera toggle ───────────────────────────────────────────────────────
  const toggleCameraMode = useCallback((cameraOn: boolean) => {
    setIsCameraOn(cameraOn);
    if (rendererRef.current) {
      rendererRef.current.setClearColor(0x000000, cameraOn ? 0 : 1);
    }
  }, []);

  // ── Three.js Scene ──────────────────────────────────────────────────────
  useEffect(() => {
    const mount = webglMountRef.current;
    if (!mount) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    camera.position.z = 3;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1); // Solid black default (space mode)
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ── Particles: exactly matching the reference style ──
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      positions[i3]     = shape1Pos.current[i3];
      positions[i3 + 1] = shape1Pos.current[i3 + 1];
      positions[i3 + 2] = shape1Pos.current[i3 + 2];
      colors[i3]     = shape1Col.current[i3];
      colors[i3 + 1] = shape1Col.current[i3 + 1];
      colors[i3 + 2] = shape1Col.current[i3 + 2];
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometryRef.current = geometry;

    // Simple PointsMaterial — tiny dots, size attenuation, matching reference
    const material = new THREE.PointsMaterial({
      size: 0.012,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });

    const sphere = new THREE.Points(geometry, material);
    scene.add(sphere);
    sphereRef.current = sphere;

    // ── Mouse / Touch drag rotation (same as reference) ──
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { isDraggingRef.current = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      velRef.current.x = (e.clientX - prevMouseRef.current.x) * 0.005;
      velRef.current.y = (e.clientY - prevMouseRef.current.y) * 0.005;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onTouchStart = (e: TouchEvent) => {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => { isDraggingRef.current = false; };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      velRef.current.x = (e.touches[0].clientX - prevMouseRef.current.x) * 0.005;
      velRef.current.y = (e.touches[0].clientY - prevMouseRef.current.y) * 0.005;
      prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onWheel = (e: WheelEvent) => {
      if (cameraRef.current) {
        cameraRef.current.position.z = Math.max(1.2, Math.min(8, cameraRef.current.position.z + e.deltaY * 0.005));
      }
    };

    // Attach to the renderer canvas so it gets pointer events
    const canvas = renderer.domElement;
    canvas.style.pointerEvents = 'auto';
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('wheel', onWheel, { passive: true });

    // ── Animation Loop ──
    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate);

      const posArr = geometry.attributes.position.array as Float32Array;
      const colArr = geometry.attributes.color.array as Float32Array;

      // Smooth hand attractor
      smoothedAttractorRef.current.lerp(attractorRef.current, 0.10);

      // Select target shape
      const activeShape = activeShapeRef.current;
      let targetPos: Float32Array;
      let targetCol: Float32Array;

      if (activeShape === 2) {
        targetPos = shape2Pos.current; targetCol = shape2Col.current;
      } else if (activeShape === 3) {
        targetPos = shape3Pos.current; targetCol = shape3Col.current;
      } else {
        targetPos = shape1Pos.current; targetCol = shape1Col.current;
      }

      // Morph positions + colors via lerp
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        posArr[i3]     += (targetPos[i3]     - posArr[i3])     * MORPH_SPEED;
        posArr[i3 + 1] += (targetPos[i3 + 1] - posArr[i3 + 1]) * MORPH_SPEED;
        posArr[i3 + 2] += (targetPos[i3 + 2] - posArr[i3 + 2]) * MORPH_SPEED;

        colArr[i3]     += (targetCol[i3]     - colArr[i3])     * MORPH_SPEED;
        colArr[i3 + 1] += (targetCol[i3 + 1] - colArr[i3 + 1]) * MORPH_SPEED;
        colArr[i3 + 2] += (targetCol[i3 + 2] - colArr[i3 + 2]) * MORPH_SPEED;
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;

      // Rotation: drag inertia OR gentle auto-spin (matching reference)
      if (isDraggingRef.current) {
        rotRef.current.y += velRef.current.x;
        rotRef.current.x += velRef.current.y;
      } else {
        velRef.current.x *= 0.93;
        velRef.current.y *= 0.93;
        rotRef.current.y += velRef.current.x;
        rotRef.current.x += velRef.current.y;

        // Gentle auto-spin when idle
        if (!lastLandmarksRef.current) {
          rotRef.current.y += 0.0018;
        }
      }

      // If hand is actively tracked, let the attractor influence the sphere position
      if (lastLandmarksRef.current) {
        sphere.position.lerp(smoothedAttractorRef.current, 0.08);
      } else {
        // Drift back to center
        sphere.position.lerp(new THREE.Vector3(0, 0, 0), 0.03);
      }

      sphere.rotation.y = rotRef.current.y;
      sphere.rotation.x = rotRef.current.x;

      // Update HUD
      if (activeShape === 1) setActiveShapeDisplay('SPHERE');
      else if (activeShape === 2) setActiveShapeDisplay('STAR');
      else setActiveShapeDisplay('FLOWER');

      // Telemetry
      if (onTelemetryUpdate) {
        let label: GalaxyTelemetryData['activeShapeLabel'] = 'COSMIC_SPHERE';
        if (activeShape === 2) label = 'CONSTELLATION_STAR';
        if (activeShape === 3) label = 'HOLOGRAPHIC_FLOWER';

        const lm = lastLandmarksRef.current;
        onTelemetryUpdate({
          state: lm ? (activeShape === 1 ? 'GRAVITY_PINCH' : 'FIELD_EXPANDING') : 'NO_HAND',
          pinchDist: pinchDistRef.current,
          particleCount: PARTICLE_COUNT,
          orbitalVelocity: 0,
          handCenter: lm ? {
            x: (lm[0].x + lm[5].x + lm[17].x) / 3,
            y: (lm[0].y + lm[5].y + lm[17].y) / 3
          } : null,
          activeShapeLabel: label
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize
    const handleResize = () => {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('wheel', onWheel);
      cancelAnimationFrame(animIdRef.current);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      rendererRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── MediaPipe (always active) ───────────────────────────────────────────
  useEffect(() => {
    let active = true;

    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = (e) => reject(e);
        document.body.appendChild(s);
      });
    };

    const startMediaPipe = async () => {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
        if (!active) return;

        const HandsClass = (window as any).Hands;
        const CameraClass = (window as any).Camera;
        if (!HandsClass || !CameraClass) return;

        const hands = new HandsClass({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6
        });

        hands.onResults((results: any) => {
          if (!active) return;
          setIsModelLoaded(true);

          const hasHand = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;
          if (!hasHand) {
            handLostFrameCountRef.current++;
            if (handLostFrameCountRef.current > 12) {
              lastLandmarksRef.current = null;
              smoothedLandmarksRef.current = null;
              attractorRef.current.set(0, 0, 0);
            }
            return;
          }

          handLostFrameCountRef.current = 0;
          const lm = results.multiHandLandmarks[0];
          lastLandmarksRef.current = lm;

          if (!smoothedLandmarksRef.current) {
            smoothedLandmarksRef.current = JSON.parse(JSON.stringify(lm));
          } else {
            for (let i = 0; i < 21; i++) {
              const k = 0.32;
              smoothedLandmarksRef.current[i].x += (lm[i].x - smoothedLandmarksRef.current[i].x) * k;
              smoothedLandmarksRef.current[i].y += (lm[i].y - smoothedLandmarksRef.current[i].y) * k;
              smoothedLandmarksRef.current[i].z = ((smoothedLandmarksRef.current[i].z || 0) * (1 - k)) + ((lm[i].z || 0) * k);
            }
          }

          // Hand centroid → attractor
          const sl = smoothedLandmarksRef.current;
          const cx = (sl[0].x + sl[5].x + sl[9].x + sl[13].x + sl[17].x) / 5;
          const cy = (sl[0].y + sl[5].y + sl[9].y + sl[13].y + sl[17].y) / 5;

          attractorRef.current.set(
            (1 - cx - 0.5) * 4.0,
            -(cy - 0.5) * 3.0,
            0
          );

          // ── Gesture Classification ──
          const tips = [sl[4], sl[8], sl[12], sl[16], sl[20]];
          const mx = tips.reduce((a: number, t: any) => a + t.x, 0) / 5;
          const my = tips.reduce((a: number, t: any) => a + t.y, 0) / 5;

          let avgDist = 0;
          tips.forEach((t: any) => {
            avgDist += Math.sqrt((t.x - mx) ** 2 + (t.y - my) ** 2);
          });
          avgDist /= 5;

          const ext = (tip: number, knuckle: number) => sl[tip].y < sl[knuckle].y;
          const idxO = ext(8, 5), midO = ext(12, 9), rngO = ext(16, 13), pnkO = ext(20, 17);
          const tmbO = sl[4].y < sl[2].y;

          const pinch = Math.sqrt((sl[8].x - sl[4].x) ** 2 + (sl[8].y - sl[4].y) ** 2);
          pinchDistRef.current = pinch;

          const fistClosed = !idxO && !midO && !rngO && !pnkO;
          const trigger1 = (pinch < PINCH_THRESHOLD) || fistClosed;
          const trigger2 = avgDist < 0.056;
          const trigger3 = idxO && midO && rngO && pnkO && tmbO && (avgDist > 0.096);

          if (trigger1) activeShapeRef.current = 1;
          else if (trigger2) activeShapeRef.current = 2;
          else if (trigger3) activeShapeRef.current = 3;
        });

        mpHandsRef.current = hands;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false
        });
        activeStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        const cam = new CameraClass(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && mpHandsRef.current) {
              await mpHandsRef.current.send({ image: videoRef.current });
            }
          },
          width: 1280,
          height: 720
        });
        cam.start();
        mpCameraRef.current = cam;

      } catch (err) {
        console.error('ParticleGalaxy: MediaPipe init failed:', err);
      }
    };

    startMediaPipe();

    return () => {
      active = false;
      if (mpCameraRef.current) { try { mpCameraRef.current.stop(); } catch (e) { /* noop */ } }
      if (mpHandsRef.current) { try { mpHandsRef.current.close(); } catch (e) { /* noop */ } }
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // ── Hand Skeleton Overlay ───────────────────────────────────────────────
  useEffect(() => {
    const canvas = handCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let drawId: number;

    const draw = () => {
      const w = canvas.width = window.innerWidth;
      const h = canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const lm = smoothedLandmarksRef.current;
      if (lm) {
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#00e5ff';

        HAND_CONNECTIONS.forEach(([a, b]) => {
          if (lm[a] && lm[b]) {
            ctx.beginPath();
            ctx.moveTo((1 - lm[a].x) * w, lm[a].y * h);
            ctx.lineTo((1 - lm[b].x) * w, lm[b].y * h);
            ctx.stroke();
          }
        });

        ctx.fillStyle = '#00e5ff';
        ctx.shadowBlur = 8;
        lm.forEach((pt: any) => {
          ctx.beginPath();
          ctx.arc((1 - pt.x) * w, pt.y * h, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.shadowBlur = 0;
      }

      drawId = requestAnimationFrame(draw);
    };

    drawId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(drawId);
  }, []);

  return (
    <div ref={containerRef} className={styles.container}>
      {/* Webcam: always in DOM, opacity:0 when hidden (never display:none) */}
      <video
        ref={videoRef}
        autoPlay playsInline muted
        className={`${styles.webcamUnderlay} ${!isCameraOn ? styles.webcamUnderlayHidden : ''}`}
      />

      {/* Three.js WebGL canvas */}
      <div ref={webglMountRef} className={styles.webglOverlay} />

      {/* Hand skeleton */}
      <canvas ref={handCanvasRef} className={styles.skeletonOverlay} />

      {/* Close */}
      {onClose && (
        <button className={styles.closeEscBtn} onClick={onClose}>CLOSE [ESC]</button>
      )}

      {/* HUD */}
      {isModelLoaded && (
        <div className={styles.bottomHud}>
          <button
            className={`${styles.hudBtn} ${isCameraOn ? styles.hudBtnActive : ''}`}
            onClick={() => toggleCameraMode(true)}
          >
            📹 CAMERA ON
          </button>
          <button
            className={`${styles.hudBtn} ${!isCameraOn ? styles.hudBtnActive : ''}`}
            onClick={() => toggleCameraMode(false)}
          >
            🌌 SPACE MODE
          </button>
          <div className={styles.hudDivider} />
          <span className={styles.hudStatus}>
            ACTIVE_GEOMETRY: [{activeShapeDisplay}]
          </span>
        </div>
      )}

      {/* Loading */}
      {!isModelLoaded && (
        <div className={styles.loadingScreen}>
          <div className={styles.loadingSpinner} />
          <div className={styles.loadingLabel}>INITIALIZING PARTICLE ENGINE</div>
          <div className={styles.loadingProgressWrapper}>
            <div className={styles.loadingProgress} />
          </div>
        </div>
      )}
    </div>
  );
}
