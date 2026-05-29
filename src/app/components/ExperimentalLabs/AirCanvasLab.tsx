'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './AirCanvasLab.module.css';

interface LineSegment {
  points: { x: number; y: number }[];
  mode: 'neon' | 'rainbow';
  color: string;
  weight: number;
}

interface TelemetryData {
  state: 'CALIBRATING' | 'NO_HAND' | 'INDEX_HOVER' | 'POINTER_DRAWING' | 'OPEN_PALM_CLEARING';
  fps: number;
  coords: { x: number; y: number } | null;
}

interface AirCanvasLabProps {
  onTelemetryUpdate: (data: TelemetryData) => void;
  paintColor: string;
  strokeWeight: number;
  isRainbow: boolean;
  isEraser: boolean;
}

export default function AirCanvasLab({ 
  onTelemetryUpdate, 
  paintColor, 
  strokeWeight, 
  isRainbow,
  isEraser 
}: AirCanvasLabProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Model load state
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [trackingState, setTrackingState] = useState<'CALIBRATING' | 'NO_HAND' | 'INDEX_HOVER' | 'POINTER_DRAWING' | 'OPEN_PALM_CLEARING'>('CALIBRATING');

  // Tracking history refs
  const linesRef = useRef<LineSegment[]>([]);
  const currentLineRef = useRef<{ x: number; y: number }[] | null>(null);
  const isDrawingRef = useRef(false);
  const brushModeRef = useRef<'neon' | 'rainbow'>('neon');
  const hueRef = useRef(0);
  const pointerCoordsRef = useRef<{ x: number; y: number } | null>(null);

  // References to active media streams & camera loops for cleanup
  const activeStreamRef = useRef<MediaStream | null>(null);
  const mpCameraRef = useRef<any>(null);
  const mpHandsRef = useRef<any>(null);
  
  // Landmark smoothing and persistence refs
  const lastLandmarksRef = useRef<any>(null);
  const smoothedLandmarksRef = useRef<any>(null);
  const handLostFrameCountRef = useRef<number>(0);
  const lastSmoothedPointRef = useRef<{ x: number; y: number } | null>(null);

  // Sync brushMode ref with active rainbow state
  useEffect(() => {
    brushModeRef.current = isRainbow ? 'rainbow' : 'neon';
  }, [isRainbow]);

  // Unified point eraser function
  const eraseNearbyPoints = (eraseX: number, eraseY: number) => {
    const radius = 0.08;
    linesRef.current = linesRef.current.map(line => {
      const filteredPoints = line.points.filter(pt => {
        const dx = pt.x - eraseX;
        const dy = pt.y - eraseY;
        return Math.sqrt(dx * dx + dy * dy) > radius;
      });
      return { ...line, points: filteredPoints };
    }).filter(line => line.points.length >= 2);
  };

  // Maintain configuration parameters in dynamic refs to prevent MediaPipe stream teardown
  const paintColorRef = useRef(paintColor);
  const strokeWeightRef = useRef(strokeWeight);
  const isEraserRef = useRef(isEraser);

  useEffect(() => { paintColorRef.current = paintColor; }, [paintColor]);
  useEffect(() => { strokeWeightRef.current = strokeWeight; }, [strokeWeight]);
  useEffect(() => { isEraserRef.current = isEraser; }, [isEraser]);

  // Load script tags sequentially and initialize MediaPipe
  useEffect(() => {
    let active = true;
    
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          resolve();
          return;
        }
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
        
        if (!HandsClass || !CameraClass) {
          console.error('MediaPipe Hands constructors are missing on global window.');
          return;
        }

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
            // Buffer lost frame counter to ensure skeleton does not blink out during slight tracking drops
            handLostFrameCountRef.current++;
            if (handLostFrameCountRef.current > 10) {
              lastLandmarksRef.current = null;
              smoothedLandmarksRef.current = null;
              setTrackingState('NO_HAND');
              onTelemetryUpdate({ state: 'NO_HAND', fps: 0, coords: null });
              
              if (isDrawingRef.current) {
                isDrawingRef.current = false;
                if (currentLineRef.current && currentLineRef.current.length > 1) {
                  linesRef.current.push({
                    points: currentLineRef.current,
                    mode: brushModeRef.current,
                    color: paintColorRef.current,
                    weight: strokeWeightRef.current
                  });
                }
                currentLineRef.current = null;
              }
              lastSmoothedPointRef.current = null;
            }
            return;
          }

          // Reset hand lost frames since hand is detected
          handLostFrameCountRef.current = 0;
          const landmarks = results.multiHandLandmarks[0];
          lastLandmarksRef.current = landmarks;

          // Apply skeletal coordinate LERP smoothing to fully eliminate high-frequency hand jittering
          if (!smoothedLandmarksRef.current) {
            smoothedLandmarksRef.current = JSON.parse(JSON.stringify(landmarks));
          } else {
            for (let i = 0; i < 21; i++) {
              const landmarkLerp = 0.32; // Highly tuned skeleton glide factor
              smoothedLandmarksRef.current[i].x = smoothedLandmarksRef.current[i].x * (1 - landmarkLerp) + landmarks[i].x * landmarkLerp;
              smoothedLandmarksRef.current[i].y = smoothedLandmarksRef.current[i].y * (1 - landmarkLerp) + landmarks[i].y * landmarkLerp;
              smoothedLandmarksRef.current[i].z = (smoothedLandmarksRef.current[i].z || 0) * (1 - landmarkLerp) + (landmarks[i].z || 0) * landmarkLerp;
            }
          }

          // Use LERP-smoothed index finger coordinates for smooth drawing
          const indexTip = smoothedLandmarksRef.current[8];

          // Compute finger extension states
          const isExtended = (tip: number, knuckle: number) => smoothedLandmarksRef.current[tip].y < smoothedLandmarksRef.current[knuckle].y;
          
          const indexOpen = isExtended(8, 5);
          const middleClosed = !isExtended(12, 9);
          const ringClosed = !isExtended(16, 13);
          const pinkyClosed = !isExtended(20, 17);

          // Writing gesture: index finger open + middle, ring, pinky closed
          const isWritingGesture = indexOpen && middleClosed && ringClosed && pinkyClosed;

          // Open palm detector: check if all 5 fingers are open
          const allExtended = 
            isExtended(8, 5) &&   // Index finger
            isExtended(12, 9) &&  // Middle finger
            isExtended(16, 13) && // Ring finger
            isExtended(20, 17) && // Pinky finger
            smoothedLandmarksRef.current[4].y < smoothedLandmarksRef.current[2].y; // Thumb tip

          if (allExtended) {
            setTrackingState('OPEN_PALM_CLEARING');
            onTelemetryUpdate({ state: 'OPEN_PALM_CLEARING', fps: 0, coords: { x: indexTip.x, y: indexTip.y } });
            
            if (isEraserRef.current) {
              eraseNearbyPoints(indexTip.x, indexTip.y);
            }

            if (isDrawingRef.current) {
              isDrawingRef.current = false;
              if (currentLineRef.current && currentLineRef.current.length > 1) {
                linesRef.current.push({
                  points: currentLineRef.current,
                  mode: brushModeRef.current,
                  color: paintColorRef.current,
                  weight: strokeWeightRef.current
                });
              }
              currentLineRef.current = null;
            }
          } else {
            if (isWritingGesture) {
              setTrackingState('POINTER_DRAWING');
              onTelemetryUpdate({ state: 'POINTER_DRAWING', fps: 0, coords: { x: indexTip.x, y: indexTip.y } });
              
              if (isEraserRef.current) {
                eraseNearbyPoints(indexTip.x, indexTip.y);
              } else {
                if (!isDrawingRef.current) {
                  isDrawingRef.current = true;
                  currentLineRef.current = [];
                  lastSmoothedPointRef.current = { x: indexTip.x, y: indexTip.y };
                }
                
                if (lastSmoothedPointRef.current && currentLineRef.current) {
                  // Secondary precision LERP pass for hyper-smooth writing paths
                  const smoothFactor = 0.16;
                  const smoothedX = lastSmoothedPointRef.current.x * (1 - smoothFactor) + indexTip.x * smoothFactor;
                  const smoothedY = lastSmoothedPointRef.current.y * (1 - smoothFactor) + indexTip.y * smoothFactor;
                  
                  lastSmoothedPointRef.current = { x: smoothedX, y: smoothedY };
                  currentLineRef.current.push({ x: smoothedX, y: smoothedY });
                }
              }
            } else {
              setTrackingState('INDEX_HOVER');
              onTelemetryUpdate({ state: 'INDEX_HOVER', fps: 0, coords: { x: indexTip.x, y: indexTip.y } });
              lastSmoothedPointRef.current = null;
              if (isDrawingRef.current) {
                isDrawingRef.current = false;
                if (currentLineRef.current && currentLineRef.current.length > 1) {
                  linesRef.current.push({
                    points: currentLineRef.current,
                    mode: brushModeRef.current,
                    color: paintColorRef.current,
                    weight: strokeWeightRef.current
                  });
                }
                currentLineRef.current = null;
              }
            }
          }
        });

        mpHandsRef.current = hands;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: false
        });

        activeStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => console.warn('Video preview fail:', err));
        }

        const camera = new CameraClass(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && mpHandsRef.current) {
              await mpHandsRef.current.send({ image: videoRef.current });
            }
          },
          width: 1280,
          height: 720
        });

        camera.start();
        mpCameraRef.current = camera;

      } catch (err) {
        console.error('Camera initialization or MediaPipe setup failed:', err);
      }
    };

    startMediaPipe();

    return () => {
      active = false;
      if (mpCameraRef.current) {
        try { mpCameraRef.current.stop(); } catch (e) {}
      }
      if (mpHandsRef.current) {
        try { mpHandsRef.current.close(); } catch (e) {}
      }
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Main drawing loop (60FPS Canvas Context)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const HAND_CONNECTIONS = [
      [0, 1], [0, 5], [0, 9], [0, 13], [0, 17],
      [1, 2], [2, 3], [3, 4],
      [5, 6], [6, 7], [7, 8],
      [9, 10], [10, 11], [11, 12],
      [13, 14], [14, 15], [15, 16],
      [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17]
    ];

    const renderFrame = () => {
      const w = canvas.width = canvas.clientWidth;
      const h = canvas.height = canvas.clientHeight;

      ctx.clearRect(0, 0, w, h);

      // Increment color shift hue loop
      hueRef.current = (hueRef.current + 1.5) % 360;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // ── DRAW HISTORY PATHS (PARTICLE INSTANCES) ─────────────────────
      linesRef.current.forEach(line => {
        if (line.points.length === 0) return;

        if (line.mode === 'rainbow') {
          // Pass 1: Draw clean base particle layer for letters
          line.points.forEach((pt) => {
            ctx.beginPath();
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 0;
            ctx.arc((1 - pt.x) * w, pt.y * h, (line.weight + 4.5) / 2, 0, Math.PI * 2);
            ctx.fill();
          });

          // Pass 2: Draw glowing colorful HSL particles on top
          line.points.forEach((pt, i) => {
            ctx.beginPath();
            const segmentHue = (hueRef.current + i * 3) % 360;
            ctx.fillStyle = `hsl(${segmentHue}, 100%, 55%)`;
            ctx.shadowBlur = line.weight * 2.2;
            ctx.shadowColor = `hsl(${segmentHue}, 100%, 55%)`;
            ctx.arc((1 - pt.x) * w, pt.y * h, line.weight / 2, 0, Math.PI * 2);
            ctx.fill();
          });
        } else {
          line.points.forEach((pt) => {
            ctx.beginPath();
            ctx.fillStyle = line.color;
            ctx.shadowBlur = line.weight * 2.2;
            ctx.shadowColor = line.color;
            ctx.arc((1 - pt.x) * w, pt.y * h, line.weight / 2, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      });

      // ── DRAW CURRENT ACTIVE PATH (PARTICLE INSTANCES) ────────────────
      if (currentLineRef.current && currentLineRef.current.length > 0) {
        if (brushModeRef.current === 'rainbow') {
          // Pass 1: Draw clean base particle layer
          currentLineRef.current.forEach((pt) => {
            ctx.beginPath();
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 0;
            ctx.arc((1 - pt.x) * w, pt.y * h, (strokeWeight + 4.5) / 2, 0, Math.PI * 2);
            ctx.fill();
          });

          // Pass 2: Draw glowing colorful HSL particles on top
          currentLineRef.current.forEach((pt, i) => {
            ctx.beginPath();
            const segmentHue = (hueRef.current + i * 3.5) % 360;
            ctx.fillStyle = `hsl(${segmentHue}, 100%, 55%)`;
            ctx.shadowBlur = strokeWeight * 2.2;
            ctx.shadowColor = `hsl(${segmentHue}, 100%, 55%)`;
            ctx.arc((1 - pt.x) * w, pt.y * h, strokeWeight / 2, 0, Math.PI * 2);
            ctx.fill();
          });
        } else {
          currentLineRef.current.forEach((pt) => {
            ctx.beginPath();
            ctx.fillStyle = paintColor;
            ctx.shadowBlur = strokeWeight * 2.2;
            ctx.shadowColor = paintColor;
            ctx.arc((1 - pt.x) * w, pt.y * h, strokeWeight / 2, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      }
      
      ctx.restore();

      // ── DRAW ERASER TARGET RING GUIDE ─────────────────────────────
      if (isEraser) {
        let erasePt: { x: number; y: number } | null = null;
        if (smoothedLandmarksRef.current) {
          erasePt = smoothedLandmarksRef.current[8]; // index tip
        } else if (isDrawingRef.current && pointerCoordsRef.current) {
          erasePt = pointerCoordsRef.current;
        }

        if (erasePt) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.lineWidth = 2.0;
          ctx.setLineDash([5, 4]);
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.arc((1 - erasePt.x) * w, erasePt.y * h, 0.08 * Math.min(w, h), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // ── DRAW SMOOTHED BIOMETRIC SKELETON MESH ────────────────────────
      const landmarks = smoothedLandmarksRef.current;
      if (landmarks) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.55)';
        ctx.lineWidth = 2.0;
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#00e5ff';
        
        HAND_CONNECTIONS.forEach(([start, end]) => {
          const ptA = landmarks[start];
          const ptB = landmarks[end];
          if (ptA && ptB) {
            ctx.beginPath();
            ctx.moveTo((1 - ptA.x) * w, ptA.y * h);
            ctx.lineTo((1 - ptB.x) * w, ptB.y * h);
            ctx.stroke();
          }
        });

        // Smooth joint node points
        landmarks.forEach((pt: any) => {
          ctx.fillStyle = '#00e5ff';
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#00e5ff';
          ctx.beginPath();
          ctx.arc((1 - pt.x) * w, pt.y * h, 3.2, 0, Math.PI * 2);
          ctx.fill();
        });
        
        ctx.restore();
      }

      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, [paintColor, strokeWeight, isEraser]);

  // Pointer event coordinate handlers
  const getNormCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const normX = 1 - (clientX - rect.left) / canvas.width;
    const normY = (clientY - rect.top) / canvas.height;
    return { x: normX, y: normY };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    const coords = getNormCoords(e);
    pointerCoordsRef.current = coords;
    
    if (isEraser) {
      eraseNearbyPoints(coords.x, coords.y);
    } else {
      currentLineRef.current = [coords];
    }
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getNormCoords(e);
    pointerCoordsRef.current = coords;

    if (isDrawingRef.current) {
      if (isEraser) {
        eraseNearbyPoints(coords.x, coords.y);
      } else if (currentLineRef.current) {
        currentLineRef.current.push(coords);
      }
    }
  };

  const handlePointerUp = () => {
    if (isDrawingRef.current && currentLineRef.current && currentLineRef.current.length > 1 && !isEraser) {
      linesRef.current.push({
        points: currentLineRef.current,
        mode: brushModeRef.current,
        color: paintColor,
        weight: strokeWeight
      });
    }
    isDrawingRef.current = false;
    currentLineRef.current = null;
    pointerCoordsRef.current = null;
  };

  const clearCanvas = () => {
    linesRef.current = [];
    currentLineRef.current = null;
    isDrawingRef.current = false;
  };

  return (
    <div className={styles.container}>
      {/* Immersive full viewport camera preview stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={styles.visibleVideo}
      />

      {/* Primary drawing / tracking canvas */}
      <canvas 
        ref={canvasRef} 
        className={styles.canvasOverlay}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />

      {/* Model Loader Screen */}
      {!isModelLoaded && (
        <div className={styles.loadingScreen}>
          <div className={styles.loadingSpinner} />
          <div className={styles.loadingLabel}>
            INITIALIZING MEDIAPIPE AIR CANVAS
          </div>
          <div className={styles.loadingProgressWrapper}>
            <div className={styles.loadingProgress} />
          </div>
        </div>
      )}

      {/* High-contrast telemetry tags */}
      {isModelLoaded && (
        <div className={styles.miniTelemetry}>
          <span>FEED: 60FPS</span>
          <span>MODE: {isEraser ? 'ERASER_BRUSH' : isRainbow ? 'HSL_RAINBOW' : 'NEON_VECTOR'}</span>
          <button className={styles.canvasClearBtn} onClick={clearCanvas}>CLEAR CANVAS</button>
        </div>
      )}
    </div>
  );
}
