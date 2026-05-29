'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './ProjectsStack.module.css';

gsap.registerPlugin(ScrollTrigger);

// Project Stack Data Mapping exactly
const DECK_DATA = [
  {
    id: 'sign-language',
    num: '01',
    title: 'Real-Time Sign Language Interpreter',
    tags: ['MediaPipe', 'TensorFlow', 'OpenCV', 'Python'],
    summary: 'A real-time assistive communication engine that translates sign language directly into synthesized voice, paired with an intelligent 3D animation interface that renders text/speech inputs back into expressive avatar movements.',
    gitUrl: 'https://github.com/Tanisharma122/Sign-language-Interpreter-project',
    icon: '🤟',
    images: {
      snap1: '/projects/sign-snap1.png',
      snap2: '/projects/sign-snap2.png',
      main: '/projects/sign-main.png',
    },
    imageFit: 'cover',
  },
  {
    id: 'smart-parking',
    num: '02',
    title: 'Smart Parking Management System',
    tags: ['YOLO', 'Streamlit', 'OpenCV', 'Python'],
    summary: 'An intelligent parking management system that processes video streams to detect total capacity, instantly tracking allocated spaces and isolating precise available slot IDs.',
    gitUrl: 'https://github.com/Tanisharma122',
    icon: '🚗',
    images: {
      snap1: '/projects/parking-snap1.png',
      snap2: '/projects/parking-snap2.png',
      main: '/projects/parking-main.png',
    },
    imageFit: 'cover',
  },
  {
    id: 'resume-to-json',
    num: '03',
    title: 'Resume-to-JSON Script Generator',
    tags: ['Next.js', 'LLM APIs', 'Automation', 'n8n Workflow'],
    summary: 'Transform static resumes into structured video dialogue scripts engineered for Google VEO with flawless voice and avatar consistency.',
    gitUrl: 'https://github.com/Tanisharma122/Resume-to-json-Generator-for-veo-flow-',
    icon: '📝',
    images: {
      snap1: '/projects/resume-snap1.png',
      snap2: '/projects/resume-snap2.png',
      main: '/projects/resume-main.png',
    },
    imageFit: 'cover', // We will use this flag to render object-fit: cover
  },
  {
    id: 'myopet-robot',
    num: '04',
    title: 'MYOPET — S.T.E.A.M. Learning Robot',
    tags: ['Hardware Integration', 'Gesture Logic', 'Robotics'],
    summary: 'MYO-PET is an intelligent, sensor-driven educational companion designed to enhance early childhood learning through interactive, emotional, and safety-aware technology.',
    gitUrl: 'https://github.com/Tanisharma122/myosa-interactive-learning-robot-myopet--',
    icon: '🤖',
    images: {
      snap1: '/projects/myopet-poster.png',
      snap2: '/projects/myopet-robot.jpeg',
      main: '/projects/myopet-new-main.png',
    },
    imageFit: 'cover',
  },
];

export default function ProjectsStack() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef  = useRef<HTMLDivElement>(null);
  const cardRefs      = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    const viewport  = viewportRef.current;
    const cards     = cardRefs.current.filter(Boolean) as HTMLDivElement[];

    if (!container || !viewport || cards.length === 0) return;

    const ctx = gsap.context(() => {
      // 1. ALL cards start offscreen bottom — including the first one
      gsap.set(cards, { y: '30vh', opacity: 0 });

      // 2. Timeline mapping on ScrollTrigger pinning — high scrub for buttery smoothness
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 2.5, // Very smooth, fluid lag for silk-like transitions
          pin: viewport,
          pinSpacing: false,
        },
      });

      // 3. Slide the first card in smoothly as the opening animation
      tl.to(
        cards[0],
        {
          y: '0vh',
          opacity: 1,
          duration: 1.2,
          ease: 'power2.out',
        },
        'card-0'
      );

      // 4. Staggered slide-ups & stacked scaling transformations for remaining cards
      cards.forEach((card, idx) => {
        if (idx === 0) return; // Already handled above

        // Slide the new card up into view — smooth power2 curve
        tl.to(
          card,
          {
            y: '0vh',
            opacity: 1,
            duration: 1.2,
            ease: 'power2.inOut',
          },
          `card-${idx}`
        );

        // Preceding cards scale down & shift upward gently to create layered depth
        for (let i = 0; i < idx; i++) {
          const prevCard = cards[i];
          const depth = idx - i;

          tl.to(
            prevCard,
            {
              scale: Math.max(1 - depth * 0.035, 0.82),
              y: -depth * 16,
              opacity: Math.max(1 - depth * 0.12, 0.4),
              duration: 1.2,
              ease: 'power2.inOut',
            },
            `card-${idx}` // Synced perfectly with the active slide-up
          );
        }
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className={styles.section} id="projects-section">
      
      {/* Viewport container pinned during scrolling */}
      <div ref={viewportRef} className={styles.viewportFrame}>
        
        {/* Deck Cards Wrapper */}
        <div className={styles.deckWrapper}>
          {DECK_DATA.map((card, idx) => {
            return (
              <div 
                key={card.id}
                ref={el => { cardRefs.current[idx] = el; }}
                className={styles.projectCard}
                style={{ zIndex: 10 + idx }}
              >
                
                {/* 1. Header Section: Serial Number & Title Block & Brief Description */}
                <div className={styles.cardHeader}>
                  <div className={styles.headerMain}>
                    <span className={styles.serialNum}>{card.num}</span>
                    <div className={styles.titleBlock}>
                      <h3 className={styles.projectTitle}>{card.title}</h3>
                      <p className={styles.projectBrief}>{card.summary}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Asymmetrical 3-Image Bento Grid Layout */}
                <div className={styles.bentoBody}>
                  
                  {/* Left Column: Two smaller, vertically stacked preview frame containers */}
                  <div className={styles.leftColStacked}>
                    
                    {/* Image 2: Secondary Snapshot preview frame */}
                    <div className={styles.secondarySnap1}>
                      {card.images ? (
                        <img 
                          src={card.images.snap1} 
                          alt={`${card.title} snapshot 1`} 
                          className={styles.cardImage}
                          style={card.imageFit === 'cover' ? { objectFit: 'cover', padding: 0 } : undefined}
                        />
                      ) : (
                        <div className={styles.placeholderBlock}>
                          <span className={styles.placeholderIcon}>📸</span>
                          <span>Diagnostic Telemetry Snapshot 02</span>
                        </div>
                      )}
                    </div>

                    {/* Image 3: Tertiary Snapshot preview frame */}
                    <div className={styles.secondarySnap2}>
                      {card.images ? (
                        <img 
                          src={card.images.snap2} 
                          alt={`${card.title} snapshot 2`} 
                          className={styles.cardImage}
                          style={card.imageFit === 'cover' ? { objectFit: 'cover', padding: 0 } : undefined}
                        />
                      ) : (
                        <div className={styles.placeholderBlock}>
                          <span className={styles.placeholderIcon} style={{ animationDelay: '0.8s' }}>📊</span>
                          <span>Analytical Stream Snapshot 03</span>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Right Column: One massive, dominant system preview canvas */}
                  <div className={styles.rightColMassive}>
                    <div className={styles.mainCanvas}>
                      {card.images ? (
                        <img 
                          src={card.images.main} 
                          alt={`${card.title} main view`} 
                          className={styles.cardImage}
                          style={card.imageFit === 'cover' ? { objectFit: 'cover', padding: 0 } : undefined}
                        />
                      ) : (
                        <div className={styles.placeholderBlock}>
                          <span className={styles.placeholderIconLarge}>{card.icon}</span>
                          <span>System Architecture View // Display Canvas 01</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* 3. Component Footer: Tech Stack Tags & VIEW REPOSITORY button */}
                <div className={styles.cardFooter}>
                  
                  {/* Specific tech stack tags on the bottom left */}
                  <div className={styles.footerTags}>
                    {card.tags.map(t => (
                      <span key={t} className={styles.footerTag}>{t}</span>
                    ))}
                  </div>

                    {/* GitHub icon at bottom right */}
                    <a
                      href={card.gitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.githubIcon}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 0C5.371 0 0 5.371 0 12c0 5.304 3.438 9.8 8.207 11.387.6.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.236 1.839 1.236 1.07 1.834 2.809 1.304 3.495.997.107-.775.418-1.304.762-1.604-2.665-.304-5.467-1.332-5.467-5.931 0-1.311.469-2.382 1.236-3.222-.124-.303-.536-1.527.117-3.176 0 0 1.008-.322 3.301 1.23a11.51 11.51 0 013.003-.404c1.018.005 2.045.138 3.003.404 2.291-1.552 3.297-1.23 3.297-1.23.655 1.649.243 2.873.119 3.176.77.84 1.235 1.911 1.235 3.222 0 4.609-2.807 5.624-5.479 5.921.43.371.823 1.104.823 2.224v3.293c0 .319.192.694.801.576C20.565 21.796 24 17.3 24 12c0-6.629-5.371-12-12-12z"/>
                      </svg>
                    </a>

                </div>

              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
