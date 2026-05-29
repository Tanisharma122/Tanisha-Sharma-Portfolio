'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import styles from './ExperimentalLabs.module.css';
import AirCanvasLab from './AirCanvasLab';
import ParticleGalaxyLab, { GalaxyTelemetryData } from './ParticleGalaxyLab';

interface ExperimentalLabsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TelemetryData {
  state: 'CALIBRATING' | 'NO_HAND' | 'INDEX_HOVER' | 'POINTER_DRAWING' | 'OPEN_PALM_CLEARING';
  fps: number;
  coords: { x: number; y: number } | null;
}

export default function ExperimentalLabs({ isOpen, onClose }: ExperimentalLabsProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeWrapperRef = useRef<HTMLDivElement>(null);
  const rowARef = useRef<HTMLDivElement>(null);
  const rowBRef = useRef<HTMLDivElement>(null);

  const [activeProject, setActiveProject] = useState<'A' | 'B' | null>(null);
  const [paintColor, setPaintColor] = useState('#00e5ff'); // Default Cyan
  const [strokeWeight, setStrokeWeight] = useState(8);
  const [isRainbow, setIsRainbow] = useState(false);
  const [isEraser, setIsEraser] = useState(false);

  // Telemetry data from AirCanvasLab
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    state: 'CALIBRATING',
    fps: 0,
    coords: null
  });

  // Telemetry data from ParticleGalaxyLab
  const [galaxyTelemetry, setGalaxyTelemetry] = useState<GalaxyTelemetryData>({
    state: 'CALIBRATING',
    pinchDist: 1.0,
    particleCount: 6500,
    orbitalVelocity: 0,
    handCenter: null,
  });

  const handleTelemetryUpdate = useCallback((data: TelemetryData) => {
    setTelemetry(data);
  }, []);

  const handleGalaxyTelemetryUpdate = useCallback((data: GalaxyTelemetryData) => {
    setGalaxyTelemetry(data);
  }, []);

  // Spring entrance transition when experimental sandbox modal is opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setActiveProject(null); // Always start at selection tray
      setIsEraser(false);

      gsap.killTweensOf([overlayRef.current, containerRef.current]);

      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: 'power2.out' }
      );

      gsap.fromTo(containerRef.current,
        { scale: 0.95, opacity: 0, y: 30 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out'
        }
      );
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Spring transition when project is selected
  useEffect(() => {
    if (activeProject && activeWrapperRef.current) {
      gsap.killTweensOf(activeWrapperRef.current);
      gsap.fromTo(activeWrapperRef.current,
        { scale: 0.85, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: 'elastic.out(1, 0.75)'
        }
      );
    }
  }, [activeProject]);

  // Handle ESC or close trigger back to index, or close entirely if already at index
  const handleCloseProject = useCallback(() => {
    if (activeProject && activeWrapperRef.current) {
      gsap.to(activeWrapperRef.current, {
        scale: 0.85,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
        onComplete: () => {
          setActiveProject(null);
          setIsEraser(false);
        }
      });
    } else {
      triggerClose();
    }
  }, [activeProject]);

  // ESC Key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        handleCloseProject();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeProject, handleCloseProject]);

  const triggerClose = () => {
    gsap.to(containerRef.current, {
      scale: 0.95,
      y: 30,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        onClose();
      }
    });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.4, ease: 'power2.in' });
  };

  // GSAP Hover animations for directory selection rows
  const handleRowMouseEnter = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      gsap.to(ref.current, {
        x: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.025)',
        borderColor: 'rgba(255, 255, 255, 0.25)',
        duration: 0.5,
        ease: 'power2.out'
      });
    }
  };

  const handleRowMouseLeave = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      gsap.to(ref.current, {
        x: 0,
        backgroundColor: 'transparent',
        borderColor: 'rgba(255, 255, 255, 0.06)',
        duration: 0.5,
        ease: 'power2.out'
      });
    }
  };

  const handleColorSelect = (colorHex: string) => {
    setPaintColor(colorHex);
    setIsRainbow(false);
    setIsEraser(false);
  };

  const handleRainbowSelect = () => {
    setIsRainbow(true);
    setIsEraser(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={overlayRef} 
      className={styles.modalOverlay}
      onClick={handleCloseProject}
      aria-modal="true"
      role="dialog"
    >
      <div 
        ref={containerRef}
        className={styles.trayContainer}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Right Escapement Close Trigger */}
        <button className={styles.closeBtn} onClick={handleCloseProject}>
          {activeProject ? 'CLOSE [ESC]' : 'EXIT [ESC]'}
        </button>

        {/* STAGE ONE: Cinematic Directory Selection Tray */}
        {!activeProject && (
          <div className={styles.fileSelectionTray}>
            <div className={styles.headerBlock}>
              <span className={styles.sectionNumber}>05</span>
              <h2 className={styles.sectionTitle}>
                CREATIVE LABS // FILE_SYSTEM_SANDBOX
              </h2>
            </div>

            <div className={styles.directoryRows}>
              <div 
                ref={rowARef}
                className={styles.directoryRow}
                onClick={() => setActiveProject('A')}
                onMouseEnter={() => handleRowMouseEnter(rowARef)}
                onMouseLeave={() => handleRowMouseLeave(rowARef)}
              >
                <span className={styles.rowNum}>01 //</span>
                <div className={styles.rowMeta}>
                  <h3 className={styles.rowTitle}>KINETIC AIR CANVAS</h3>
                  <p className={styles.rowSub}>Real-time gesture drawing over spatial tracks</p>
                </div>
                <span className={styles.rowChevron}>[ACCESS_STREAM]</span>
              </div>

              <div 
                ref={rowBRef}
                className={styles.directoryRow}
                onClick={() => setActiveProject('B')}
                onMouseEnter={() => handleRowMouseEnter(rowBRef)}
                onMouseLeave={() => handleRowMouseLeave(rowBRef)}
              >
                <span className={styles.rowNum}>02 //</span>
                <div className={styles.rowMeta}>
                  <h3 className={styles.rowTitle}>INTERACTIVE PARTICLE GALAXY</h3>
                  <p className={styles.rowSub}>Gesture-controlled WebGL vector star-field</p>
                </div>
                <span className={styles.rowChevron}>[MOUNT_SCENE]</span>
              </div>
            </div>
          </div>
        )}

        {/* STAGE TWO & THREE: Full-Screen Immersive Canvas Component Wrappers */}
        {activeProject && (
          <div ref={activeWrapperRef} className={styles.fullscreenActiveWrapper}>
            {/* Render Project A: Air Canvas */}
            {activeProject === 'A' && (
              <AirCanvasLab 
                onTelemetryUpdate={handleTelemetryUpdate}
                paintColor={paintColor}
                strokeWeight={strokeWeight}
                isRainbow={isRainbow}
                isEraser={isEraser}
              />
            )}

            {/* Render Project B: Particle Galaxy */}
            {activeProject === 'B' && (
              <ParticleGalaxyLab 
                onTelemetryUpdate={handleGalaxyTelemetryUpdate}
                onClose={handleCloseProject}
              />
            )}

            {/* STAGE FOUR: Minimalist Glassmorphic Bottom Dock Controls (Air Canvas only) */}
            {activeProject === 'A' && (
              <div className={styles.glassmorphicControlsDock}>
                {/* Left Side: Color Palette & Eraser Dots */}
                <div className={styles.colorPaletteWrapper}>
                  {[
                    { label: 'Cyan', hex: '#00e5ff' },
                    { label: 'Green', hex: '#00ff88' },
                    { label: 'Pink', hex: '#ff007f' },
                    { label: 'Yellow', hex: '#ffff00' }
                  ].map(color => (
                    <button
                      key={color.hex}
                      className={`${styles.dockColorDot} ${paintColor === color.hex && !isRainbow && !isEraser ? styles.dockColorDotActive : ''}`}
                      style={{ backgroundColor: color.hex }}
                      onClick={() => handleColorSelect(color.hex)}
                      aria-label={`Set color to ${color.label}`}
                    />
                  ))}

                  {/* Rainbow Color Dot Toggle */}
                  <button
                    className={`${styles.rainbowToggleDot} ${isRainbow ? styles.rainbowToggleDotActive : ''}`}
                    onClick={handleRainbowSelect}
                    aria-label="Activate Rainbow Brush Mode"
                  />

                  {/* Eraser button */}
                  <button
                    className={`${styles.eraserToggleBtn} ${isEraser ? styles.eraserToggleBtnActive : ''}`}
                    onClick={() => {
                      setIsEraser(prev => !prev);
                      setIsRainbow(false);
                    }}
                    aria-label="Toggle Eraser Brush"
                  >
                    <span className={styles.eraserIcon}>🧼</span>
                    <span className={styles.eraserText}>ERASER</span>
                  </button>
                </div>

                {/* Right Side: Micro Weight Slider Line */}
                <div className={styles.weightSliderWrapper}>
                  <span className={styles.weightLabel}>STROKE:</span>
                  <input
                    type="range"
                    min="2"
                    max="24"
                    value={strokeWeight}
                    onChange={(e) => setStrokeWeight(Number(e.target.value))}
                    className={styles.weightRangeLine}
                  />
                  <span className={styles.weightNum}>{strokeWeight}PX</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
