'use client';

import { useState, useRef } from 'react';
import gsap from 'gsap';
import styles from './ProjectsGrid.module.css';

// Project portfolio data mapping exactly
const PROJECTS_DATA = [
  {
    id: 'sign-language',
    num: '[ 01 ]',
    title: 'Real-Time Sign Language Interpreter',
    tags: ['MediaPipe', 'TensorFlow', 'OpenCV', 'Python'],
    summary: 'Computer vision pipeline translating hand gestures into text using tracking and deep learning classification models.',
    gitUrl: 'https://github.com/tanishasharma',
    icon: '🤟',
  },
  {
    id: 'smart-parking',
    num: '[ 02 ]',
    title: 'Smart Parking Management System',
    tags: ['YOLO', 'Streamlit', 'OpenCV', 'Python'],
    summary: 'AI-powered occupancy visualization tracking parking lot fill rates dynamically through an interactive object detection dashboard.',
    gitUrl: 'https://github.com/tanishasharma',
    icon: '🚗',
  },
  {
    id: 'myopet-robot',
    num: '[ 03 ]',
    title: 'MYOPET — S.T.E.A.M. Learning Robot',
    tags: ['Hardware Integration', 'Gesture Control', 'Audio-Visual', 'Robotics'],
    summary: 'International Finalist (MYOSA 4.0, New Delhi, 2026) designing sensory robotic logic mapping user motion to real-time telemetry feedbacks.',
    gitUrl: 'https://github.com/tanishasharma',
    icon: '🤖',
  },
  {
    id: 'resume-to-json',
    num: '[ 04 ]',
    title: 'Resume-to-JSON Script Generator',
    tags: ['Next.js', 'LLM APIs', 'Prompt Engineering', 'Automation'],
    summary: 'Deployed automation parsing unstructured document streams into typed JSON objects and syncing structured narrative video timelines.',
    gitUrl: 'https://github.com/tanishasharma',
    icon: '📝',
  },
  {
    id: 'object-detection',
    num: '[ 05 ]',
    title: 'Intelligent Real-Time Object Detection',
    tags: ['YOLO', 'Computer Vision', 'Deep Learning'],
    summary: 'Custom edge-inference pipeline optimized for rapid object segmentations, bounding-box tracking, and statistical telemetry counting.',
    gitUrl: 'https://github.com/tanishasharma',
    icon: '👁️',
  },
];

export default function ProjectsGrid() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleRowClick = (index: number) => {
    const isCurrentlyActive = activeIndex === index;
    
    // Collapse currently active panel if clicked again
    if (isCurrentlyActive) {
      const panel = panelRefs.current[index];
      if (panel) {
        gsap.to(panel, {
          height: 0,
          opacity: 0,
          duration: 0.5,
          ease: 'power3.inOut',
          onComplete: () => setActiveIndex(null),
        });
      }
    } else {
      // Collapse previous panel if any is open
      if (activeIndex !== null) {
        const prevPanel = panelRefs.current[activeIndex];
        if (prevPanel) {
          gsap.to(prevPanel, {
            height: 0,
            opacity: 0,
            duration: 0.5,
            ease: 'power3.inOut',
          });
        }
      }

      // Expand clicked panel
      const targetPanel = panelRefs.current[index];
      if (targetPanel) {
        setActiveIndex(index);
        gsap.fromTo(
          targetPanel,
          { height: 0, opacity: 0 },
          {
            height: 'auto',
            opacity: 1,
            duration: 0.6,
            ease: 'power3.inOut',
          }
        );
      }
    }
  };

  return (
    <section className={styles.section} id="projects-section" aria-label="Projects grid">
      <div className={styles.container}>
        
        {/* Section Heading */}
        <span className={styles.eyebrow}>04 // SELECTED ARCHITECTURES</span>

        {/* Accordion Projects Stack */}
        <div className={styles.accordionStack}>
          {PROJECTS_DATA.map((p, index) => {
            const isActive = activeIndex === index;
            
            return (
              <div 
                key={p.id} 
                className={`${styles.rowItem} ${isActive ? styles.rowItemActive : ''}`}
              >
                {/* Header visible by default */}
                <button 
                  className={styles.rowHeader}
                  onClick={() => handleRowClick(index)}
                  aria-expanded={isActive}
                  aria-controls={`panel-${p.id}`}
                >
                  <div className={styles.headerMain}>
                    <span className={styles.projectNum}>{p.num}</span>
                    <h3 className={styles.projectTitle}>{p.title}</h3>
                  </div>

                  <div className={styles.headerMeta}>
                    <div className={styles.projectTags}>
                      {p.tags.map(t => (
                        <span key={t} className={styles.projectTag}>{t}</span>
                      ))}
                    </div>
                    {/* SVG arrow indicator */}
                    <svg 
                      className={styles.chevronIcon} 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </button>

                {/* Expandable Bento Box Panel Content */}
                <div 
                  id={`panel-${p.id}`}
                  ref={el => { panelRefs.current[index] = el; }}
                  className={styles.rowContentPanel}
                  role="region"
                >
                  <div className={styles.panelInner}>
                    
                    {/* Project summary bio */}
                    <p className={styles.projectSummary}>{p.summary}</p>

                    {/* Bento visual assets showcase layout */}
                    <div className={styles.bentoGrid}>
                      
                      {/* Left Bento Column (Secondary preview frames) */}
                      <div className={styles.leftBentoCol}>
                        <div className={`${styles.bentoFrame} ${styles.snapFrameSmall}`}>
                          <div className={styles.bentoPlaceholder}>
                            <span className={styles.placeholderIcon}>📸</span>
                            <span>Snapshot 01 // Input Stream</span>
                          </div>
                        </div>

                        <div className={`${styles.bentoFrame} ${styles.snapFrameSmall}`}>
                          <div className={styles.bentoPlaceholder}>
                            <span className={styles.placeholderIcon}>📊</span>
                            <span>Snapshot 02 // Analytics Data</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Bento Column (Primary canvas visual system dashboard) */}
                      <div className={`${styles.bentoFrame} ${styles.canvasFrameLarge}`}>
                        <div className={styles.bentoPlaceholder}>
                          <span className={styles.placeholderIcon} style={{ fontSize: '38px' }}>{p.icon}</span>
                          <span>Holographic Dashboard // Architecture Canvas</span>
                        </div>

                        {/* Interactive GitHub Link Anchor */}
                        <a 
                          href={p.gitUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={styles.gitButton}
                          aria-label={`View ${p.title} repository on GitHub`}
                          title="View Repository"
                        >
                          <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2.2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                          </svg>
                        </a>
                      </div>

                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
