'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import styles from './Experience.module.css';

gsap.registerPlugin(ScrollTrigger);

// Career Chronology data mapping
const CAREER_LOGS = [
  {
    id: 'exp-intern',
    title: 'AI/ML Engineering Intern',
    company: 'The Special Character (Ahmedabad, India)',
    period: 'Dec 2025 — Feb 2026 (On-Site)',
    summary: 'Engineered live computer vision model architectures and constructed real-world machine learning automated pipelines to optimize system throughput.',
    linkedinPostUrl: 'https://www.linkedin.com/posts/tanisha-sharma-81b329321_my-aiml-internship-journey-the-special-activity-7440137828296007680-kd1y?utm_source=share&utm_medium=member_desktop&rcm=ACoAAFFiV1cBn18kTYD19JtcIJwcivfH2J5N4SM', // aiml internship post
  },
  {
    id: 'exp-fellow',
    title: 'Core AI/ML Research Fellow',
    company: 'IEEE EMBS Student Internship Program',
    period: 'June 2025 — July 2025 (Remote)',
    summary: 'Conceptualized and deployed an advanced predictive AI prototype model specializing in Schizophrenia Detection. Leveraged healthcare datasets and deep statistical modeling to optimize clinical prediction metrics.',
    linkedinPostUrl: 'https://www.linkedin.com/in/tanisha-sharma-81b329321/', // profile / post link
  },
];

export default function Experience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef     = useRef<HTMLDivElement>(null);
  
  // Ref for the 3D Arrow element
  const canvasArrowRef = useRef<HTMLCanvasElement>(null);
  const arrowRef       = useRef<HTMLDivElement>(null);
  
  // Track illuminated nodes via local state flags
  const [activeNodes, setActiveNodes] = useState<Record<number, boolean>>({});

  // 1. GSAP Scroll Triggering and Cards Entrance Timeline
  useEffect(() => {
    const container = containerRef.current;
    const activeLine = trackRef.current;
    if (!container || !activeLine) return;

    const ctx = gsap.context(() => {
      // Dynamic illumination of the vertical track line on scroll
      gsap.fromTo(
        activeLine,
        { height: '0%' },
        {
          height: '100%',
          ease: 'none',
          scrollTrigger: {
            trigger: container,
            start: 'top 65%',
            end: 'bottom 80%',
            scrub: true,
          },
        }
      );

      // Animate experience cards sliding in from the right + activate nodes
      const items = gsap.utils.toArray<HTMLElement>('.expRowBlock');
      items.forEach((item, index) => {
        gsap.fromTo(
          item,
          {
            x: 55,
            opacity: 0,
          },
          {
            x: 0,
            opacity: 1,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 78%',
              onEnter: () => {
                setActiveNodes(prev => ({ ...prev, [index]: true }));
              },
              onLeaveBack: () => {
                setActiveNodes(prev => ({ ...prev, [index]: false }));
              },
              toggleActions: 'play none none reverse',
            },
          }
        );
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);


  // 4. Three.js 3D Chrome Cursor Arrow Asset Setup
  useEffect(() => {
    const canvas = canvasArrowRef.current;
    if (!canvas) return;

    const width = 150;
    const height = 150;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 16);

    // Extrude a sharp, thick 3D cursor arrow using THREE.Shape
    const shape = new THREE.Shape();
    // Arrow drawing coordinates pointing downwards
    shape.moveTo(0, -3.2);
    shape.lineTo(2.8, 0.2);
    shape.lineTo(1.1, 0.2);
    shape.lineTo(1.1, 3.2);
    shape.lineTo(-1.1, 3.2);
    shape.lineTo(-1.1, 0.2);
    shape.lineTo(-2.8, 0.2);
    shape.closePath();

    const extrudeSettings = {
      depth: 1.0,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.25,
      bevelThickness: 0.25,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center(); // Center around centroid for flawless rotations

    // Heavy, highly reflective liquid-chrome physical material shader
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#ffffff'), // brilliant light silver-chrome base for maximum iridescent color dispersion
      metalness: 0.9, // dark, heavy, reflective liquid-chrome base body
      roughness: 0.05, // highly reflective clean specular glare
      iridescence: 1.0, // enabled completely
      iridescenceIOR: 2.2, // maps vibrant neon highlights onto edges
      iridescenceThicknessRange: [100, 400], // maps bright neon violet, deep magenta, and electric cyan directly onto beveled edges
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });

    const mesh = new THREE.Mesh(geometry, material);
    // Default tilt angle pointing up-left directly towards the internship boxes
    mesh.rotation.set(0.4, 0, -2.2); 
    scene.add(mesh);

    // Ambient lighting to prevent black silhouettes
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    // Dynamic directional lights targeting edge highlights
    const magentaLight = new THREE.DirectionalLight(0xff007f, 2.8); // deep magenta
    magentaLight.position.set(5, 5, 6);
    scene.add(magentaLight);

    const cyanLight = new THREE.DirectionalLight(0x00f0ff, 2.5); // electric cyan
    cyanLight.position.set(-5, -5, 6);
    scene.add(cyanLight);

    const violetLight = new THREE.PointLight(0xbc00dd, 2.5, 20); // neon violet glow
    violetLight.position.set(0, 0, 8);
    scene.add(violetLight);

    // Slow idle rotation oscillation loop
    let reqId: number;
    const startTime = performance.now();

    const tick = () => {
      reqId = requestAnimationFrame(tick);
      const elapsedTime = (performance.now() - startTime) / 1000;
      
      mesh.rotation.y = Math.sin(elapsedTime * 1.5) * 0.2;
      mesh.rotation.x = 0.4 + Math.cos(elapsedTime * 1.5) * 0.15;
      mesh.rotation.z = -2.2 + Math.sin(elapsedTime * 1.5) * 0.12; // Pointing up-left towards internship cards, with dynamic wobble!
      
      renderer.render(scene, camera);
    };
    tick();

    // Cleanups
    return () => {
      cancelAnimationFrame(reqId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  // 5. Idle Pulse Bobbing Loop for Arrow Component via GSAP
  useEffect(() => {
    const arrow = arrowRef.current;
    if (!arrow) return;

    const tween = gsap.to(arrow, {
      y: '+=12', // 12px bobbing displacement
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });

    return () => {
      tween.kill();
    };
  }, []);

  // 6. Interactive Card hover triggers using GSAP
  const handleCardMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    gsap.to(e.currentTarget, {
      y: -8,
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.06)',
      borderColor: 'rgba(255, 122, 0, 0.18)',
      duration: 0.4,
      ease: 'power2.out',
    });
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    gsap.to(e.currentTarget, {
      y: 0,
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.02)',
      borderColor: 'rgba(0, 0, 0, 0.05)',
      duration: 0.4,
      ease: 'power2.out',
    });
  };

  // 7. Interactive Hover scale triggers for 3D Arrow
  const handleArrowMouseEnter = () => {
    if (!arrowRef.current) return;
    
    // Smoothly scale up the asset container
    gsap.to(arrowRef.current, {
      scale: 1.25,
      duration: 0.4,
      ease: 'back.out(1.7)',
    });

    // Fast, reactive edge-glow flash that transitions to deep violet glow
    gsap.fromTo(arrowRef.current,
      { filter: 'drop-shadow(0 0 45px rgba(0, 240, 255, 1.0)) brightness(1.8)' },
      { 
        filter: 'drop-shadow(0 0 25px rgba(188, 0, 221, 0.75)) brightness(1.0)', 
        duration: 0.4, 
        ease: 'power2.out' 
      }
    );
  };

  const handleArrowMouseLeave = () => {
    if (!arrowRef.current) return;
    gsap.to(arrowRef.current, {
      scale: 1.0,
      filter: 'drop-shadow(0 0 0px rgba(0,0,0,0)) brightness(1.0)',
      duration: 0.4,
      ease: 'power2.out',
    });
  };

  // 8. Dynamic Scroll Anchor Trigger to Section 4
  const handleArrowClick = () => {
    const nextSection = document.getElementById('projects-section') || document.getElementById('tech-stack-section');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section ref={containerRef} className={styles.section} id="experience-section" aria-label="Experience">
      
      {/* Smooth Curved SVG Transition Divider linking Section 2 to 3 */}
      <div className={styles.curveDivider} aria-hidden="true">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className={styles.curveSvg}>
          <path 
            d="M0,0 L1440,0 L1440,40 Q720,120 0,40 Z" 
            fill="#000000"
          />
        </svg>
      </div>
      <div className={styles.content}>
        
        {/* Header Block */}
        <div className={styles.headerBlock}>

          <h2 className={styles.heading}>Professional Chronology</h2>
        </div>
 
        {/* Timeline Container */}
        <div className={styles.timelineContainer}>
          
          {/* Static backbone track */}
          <div className={styles.backboneTrack} aria-hidden="true" />
          
          {/* Active dynamically illuminated track */}
          <div ref={trackRef} className={styles.activeTrack} aria-hidden="true" />
 
          {/* Individual items list */}
          <div className={styles.timelineStack}>
            {CAREER_LOGS.map((item, index) => (
              <div key={item.id} className={`${styles.itemRow} expRowBlock`}>
                
                {/* Node point marker resting directly on track */}
                <div 
                  className={`${styles.nodePoint} ${activeNodes[index] ? styles.nodePointActive : ''}`} 
                  style={{ left: typeof window !== 'undefined' && window.innerWidth <= 768 ? '-32px' : '-94px' }}
                  aria-hidden="true" 
                />
                
                {/* Experience card details */}
                <article 
                  className={styles.cardBlock}
                  onMouseEnter={handleCardMouseEnter}
                  onMouseLeave={handleCardMouseLeave}
                >
                  {/* Absolute Positioned LinkedIn Anchor */}
                  <a 
                    href={item.linkedinPostUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={styles.linkedinAnchor}
                    aria-label={`Connect and view Tanisha's work details on LinkedIn`}
                    title="View details on LinkedIn"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect x="2" y="9" width="4" height="12" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                  </a>

                  <div className={styles.metaRow}>
                    <h3 className={styles.jobTitle}>{item.title}</h3>
                    <span className={styles.period}>{item.period}</span>
                  </div>
                  
                  <span className={styles.company}>{item.company}</span>
                  <p className={styles.summaryText}>{item.summary}</p>
                </article>
 
              </div>
            ))}

            {/* Stage Three: CURRENT ENGAGEMENTS active callout card directly after career logs */}
            <div className={`${styles.itemRow} expRowBlock`}>
              <div 
                className={`${styles.nodePoint} ${activeNodes[2] ? styles.nodePointActive : ''}`} 
                style={{ left: typeof window !== 'undefined' && window.innerWidth <= 768 ? '-32px' : '-94px' }}
                aria-hidden="true" 
              />
              
              <article 
                className={`${styles.cardBlock} ${styles.engagementCard}`}
                onMouseEnter={handleCardMouseEnter}
                onMouseLeave={handleCardMouseLeave}
              >
                <div className={styles.metaRow}>
                  <h3 className={styles.jobTitle}>Research &amp; Robotics</h3>
                  <span className={styles.period}>Ongoing</span>
                </div>
                
                <span className={styles.company}>CURRENT ENGAGEMENTS</span>
                <p className={styles.summaryText}>
                  Actively expanding into core engineering domains through advanced AI research initiatives and autonomous robotics development.
                </p>
              </article>
            </div>
          </div>
 
        </div>
 
      </div>

      {/* 3D Chrome Interactive Cursor Arrow Indicator */}
      <div 
        ref={arrowRef} 
        className={styles.arrowContainer}
        onMouseEnter={handleArrowMouseEnter}
        onMouseLeave={handleArrowMouseLeave}
        onClick={handleArrowClick}
        title="Scroll to selected architectures"
        aria-label="Scroll down to selected architectures"
      >
        <canvas ref={canvasArrowRef} />
      </div>

    </section>
  );
}
