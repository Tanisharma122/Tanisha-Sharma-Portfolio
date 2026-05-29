'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './AboutMe.module.css';

gsap.registerPlugin(ScrollTrigger);

export default function AboutMe() {
  const sectionRef      = useRef<HTMLDivElement>(null);
  const fillHeadingRef  = useRef<HTMLHeadingElement>(null);
  const profileCircleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section       = sectionRef.current;
    const fillHeading   = fillHeadingRef.current;
    const profileCircle = profileCircleRef.current;
    if (!section || !fillHeading) return;

    const ctx = gsap.context(() => {
      // 1. Kinetic Top-to-Bottom Text-Fill Scroll Trigger
      gsap.fromTo(
        fillHeading,
        { clipPath: 'inset(0 0 100% 0)' },
        {
          clipPath: 'inset(0 0 0% 0)',
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            end: 'top 20%',
            scrub: 1.2,
          },
        }
      );

      // 2. Profile Circle Elastic Scale Entry
      if (profileCircle) {
        gsap.fromTo(
          profileCircle,
          {
            scale: 0.82,
            opacity: 0,
            y: 40,
          },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 1.4,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 82%',
              toggleActions: 'play none none none',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className={styles.section} id="about-section" aria-label="About Me">
      <div className={styles.grid}>
        
        {/* Left Column: Profile Anchor (spill-over circular portrait mask) */}
        <div className={styles.leftCol}>
          <div ref={profileCircleRef} className={styles.profileCircle}>
            {/* 1. Clipped bottom half of the image inside the circular boundary */}
            <div className={styles.clippedWrapper}>
              <img 
                src="/assets/tanisha-portrait.png" 
                alt="Tanisha Sharma Portrait Clipped" 
                className={styles.profileImage}
              />
            </div>
            {/* 2. Overflow top half of the image allowing pop-out effect */}
            <div className={styles.overflowWrapper}>
              <img 
                src="/assets/tanisha-portrait.png" 
                alt="Tanisha Sharma Portrait Overflow" 
                className={`${styles.profileImage} ${styles.overflowImage}`}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Bio profile and Sub-Grid Credentials Table */}
        <div className={styles.rightCol}>
          {/* Overlapping kinetic text wrapper */}
          <div className={styles.headingWrapper}>
            <h2 className={styles.headingHollow}>About Me</h2>
            <h2 ref={fillHeadingRef} className={styles.headingFill} aria-hidden="true">About Me</h2>
          </div>

          <p className={styles.bioText}>
            I am a Computer Engineering student specializing in Artificial Intelligence, Machine Learning, and Computer Vision. I focus on engineering intelligent systems, robust automation workflows, and deep-learning architectures that bridge academic research with real-world digital applications.
          </p>

          {/* Minimal 2-column secondary data table */}
          <div className={styles.metaGrid}>
            <div className={styles.metaRow}>
              <span className={styles.metaRowLabel}>Education</span>
              <span className={styles.metaRowValue}>
                <strong>LDRP Institute of Technology and Research</strong>
              </span>
            </div>
            
            <div className={styles.metaRow}>
              <span className={styles.metaRowLabel}>Cohort</span>
              <span className={styles.metaRowValue}>
                <strong>2024 - 2028</strong>
              </span>
            </div>
            
            <div className={styles.metaRowFullWidth}>
              <span className={styles.metaRowLabel}>Domains</span>
              <span className={styles.metaRowValue}>Artificial Intelligence, Computer Vision, Deep Learning, Intelligent Agents, Predictive Modeling</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
