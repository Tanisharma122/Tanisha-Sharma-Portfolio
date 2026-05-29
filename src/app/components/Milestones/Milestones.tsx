'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './Milestones.module.css';

gsap.registerPlugin(ScrollTrigger);

// Career Milestones Data Mapping
const MILESTONES_DATA = [
  {
    id: 'myosa-finalist',
    num: '[ MILESTONE 01 ]',
    boxTitle: 'MYOSA 4.0 INTERNATIONAL FINALIST',
    title: 'IEEE MYOSA 4.0 & APSCON 2026 Finalist',
    desc: 'Achieved International Finalist standing in New Delhi for the MYOPET S.T.E.A.M. interactive learning robot project, leading to presentation tracks at IEEE APSCON 2026.',
    liUrl: 'https://www.linkedin.com/posts/ieee-student-branch-ksv_svkm-ksv-mmpsrpc-ugcPost-7435226916946767872-q3gf?utm_source=share&utm_medium=member_desktop&rcm=ACoAAFFiV1cBn18kTYD19JtcIJwcivfH2J5N4SM',
    icon: '🏆',
    slides: ['display.jpg', 'slide1.jpg', 'slide2.jpg', 'slide3.jpg'],
  },
  {
    id: 'impacthon-runnerup',
    num: '[ MILESTONE 02 ]',
    boxTitle: 'IMPACTHON 4TH RUNNER UP',
    title: 'Impacthon 2025-26 4th Runner Up',
    desc: 'Secured 4th Runner-Up at the ImpactThon 2025–26 competition under Track 1: Inclusive & Human-Centered Innovation.',
    liUrl: 'https://www.linkedin.com/posts/tanisha-sharma-81b329321_impactthon-competition-challenges-activity-7428103157026578433-T_5V?utm_source=share&utm_medium=member_desktop&rcm=ACoAAFFiV1cBn18kTYD19JtcIJwcivfH2J5N4SM',
    icon: '⚡',
    slides: ['display.jpg', 'slide1.jpg', 'slide2.jpg', 'slide3.jpg', 'slide4.jpg'],
  },
  {
    id: 'aisehack-finalist',
    num: '[ MILESTONE 03 ]',
    boxTitle: 'AISEHACK TOP 15 FINALIST',
    title: '#AISEHack 2026 | IIIT Hyderabad',
    desc: 'Finished as a Top 15 Leaderboard Finalist at the national AI research hackathon hosted at IIIT Hyderabad - Kaggle competition, ANRF. Also got tagged/recognized in the first article of professor PK.',
    liUrl: 'https://www.linkedin.com/posts/tanisha-sharma-81b329321_aisehack-aisehack2026-flooddetection-activity-7449857192565932032-_ngk?utm_source=share&utm_medium=member_desktop&rcm=ACoAAFFiV1cBn18kTYD19JtcIJwcivfH2J5N4SM',
    icon: '🧠',
    slides: ['display.jpg', 'slide1.jpg', 'slide2.jpg', 'slide3.jpg', 'slide4.jpg'],
  },
  {
    id: 'ieee-ambassador',
    num: '[ MILESTONE 04 ]',
    boxTitle: 'IEEE ACEI AMBASSADOR',
    title: 'IEEE R10 ACEI Ambassador',
    desc: 'Appointed as the 2025 ACEI Ambassador for the IEEE Asia-Pacific Region (R10)',
    liUrl: 'https://www.linkedin.com/posts/ieee-student-branch-ksv_ieee-ieeeacei-ieeeregion10-activity-7327954168101449728-VNhS?utm_source=share&utm_medium=member_desktop&rcm=ACoAAFFiV1cBn18kTYD19JtcIJwcivfH2J5N4SM',
    icon: '🌍',
    slides: ['display.jpg', 'slide1.jpg', 'slide2.jpg', 'slide3.jpg', 'slide4.jpg'],
  },
  {
    id: 'nbt-finalist',
    num: '[ MILESTONE 05 ]',
    boxTitle: 'NBT NATIONAL FINALIST',
    title: 'NBT Finalist | IEEE APSCON 2026',
    desc: 'Recognized as a Finalist For the Next Big Thing(NBT) Track, IEEE APSCON 2026',
    liUrl: 'https://www.linkedin.com/posts/tanisha-sharma-81b329321_being-a-finalist-at-the-next-big-thing-showcase-activity-7428105802500022272-zOOZ?utm_source=share&utm_medium=member_desktop&rcm=ACoAAFFiV1cBn18kTYD19JtcIJwcivfH2J5N4SM',
    icon: '📈',
    slides: ['display.jpg', 'slide1.jpg'],
  },
];

type Milestone = typeof MILESTONES_DATA[0];

export default function Milestones() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef    = useRef<HTMLDivElement>(null);
  
  // Reference to active continuous tween
  const tRef = useRef<gsap.core.Tween | null>(null);

  // Modal active state
  const [activeMilestone, setActiveMilestone] = useState<Milestone | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const slidesList = activeMilestone?.slides || ['display.jpg', 'slide1.jpg', 'slide2.jpg', 'slide3.jpg'];

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % slidesList.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + slidesList.length) % slidesList.length);
  };

  useEffect(() => {
    const section = sectionRef.current;
    const track   = trackRef.current;
    if (!section || !track) return;

    const ctx = gsap.context(() => {
      // 1. Continuous infinite base loops (Single Row Track)
      const t = gsap.to(track, {
        xPercent: -50,
        ease: 'none',
        duration: 25,
        repeat: -1,
      });

      // Default moves Left
      t.timeScale(1);

      // Save reference
      tRef.current = t;

      // 2. ScrollTrigger bidirectional mapping
      ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          // If modal is active, skip scroll updates
          if (activeMilestone) return;

          const dir = self.direction; // 1 = down, -1 = up
          const velocity = Math.min(Math.abs(self.getVelocity() * 0.005), 5); // Cap velocity impact
          
          const baseMultiplier = 1 + velocity;

          // Downscroll: Row moves Left (pos)
          // Upscroll: Row moves Right (neg)
          gsap.to(t, { timeScale: dir * baseMultiplier, duration: 0.35, overwrite: 'auto' });
        },
        onToggle: (self) => {
          if (!self.isActive && !activeMilestone) {
            // Restore default speed when viewport leaves
            gsap.to(t, { timeScale: 1, duration: 0.6 });
          }
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [activeMilestone]);

  // Click marquee card handler
  const handleMilestoneClick = (item: Milestone) => {
    setActiveMilestone(item);
    setCurrentSlide(0);
    
    // Pause continuous loops immediately
    tRef.current?.pause();

    // Scale up pop-up animation on overlay render
    setTimeout(() => {
      const dashboard = dashboardRef.current;
      if (dashboard) {
        gsap.fromTo(
          dashboard,
          { scale: 0.95, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: 'power4.out' }
        );
      }
    }, 50);
  };

  // Close popup logic
  const handleClose = useCallback(() => {
    const dashboard = dashboardRef.current;
    if (dashboard) {
      gsap.to(dashboard, {
        scale: 0.95,
        opacity: 0,
        duration: 0.4,
        ease: 'power4.in',
        onComplete: () => {
          setActiveMilestone(null);
          // Safely resume marquees
          tRef.current?.play();
        }
      });
    }
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeMilestone) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMilestone, handleClose]);

  // Duplicate array to ensure seamless infinite loops
  const doubleRow = [...MILESTONES_DATA, ...MILESTONES_DATA, ...MILESTONES_DATA];

  return (
    <section ref={sectionRef} className={styles.section} id="milestones-section">
      
      {/* Title block */}
      <div className={styles.container}>
        <span className={styles.eyebrow}>MILESTONES & RECOGNITION</span>
      </div>

      {/* Single Bidirectional Marquee Row */}
      <div className={styles.marqueeWrapper}>
        
        {/* Row moves Left on downscroll */}
        <div className={styles.marqueeRow}>
          <div ref={trackRef} className={styles.marqueeTrack}>
            {doubleRow.map((item, idx) => (
              <button 
                key={`m-${idx}`} 
                className={styles.marqueeItem}
                onClick={() => handleMilestoneClick(item)}
              >
                {/* Background snapshot overlay image */}
                <img 
                  src={`/assets/milestones/${item.id}/display.jpg`} 
                  alt={item.title} 
                  className={styles.cardImage}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />

                <span className={styles.itemNum}>{item.num}</span>
                <h3 className={styles.itemTitle}>{item.boxTitle}</h3>
                
                <div className={styles.itemFooter}>
                  <span className={styles.footerLabel}>VIEW ARCHIVE DETAILS</span>
                  <svg 
                    className={styles.expandIcon} 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ── INTERACTIVE EXPANDABLE MODAL DIALOG ────────────────────── */}
      {activeMilestone && (
        <div 
          className={`${styles.modalOverlay} ${styles.modalOverlayActive}`}
          onClick={handleClose}
          aria-modal="true"
          role="dialog"
        >
          {/* Close Action Trigger */}
          <button 
            className={styles.closeBtn} 
            onClick={handleClose}
            aria-label="Close modal"
          >
            CLOSE [ESC]
          </button>

          {/* Responsive 2-Column Dashboard Box */}
          <div 
            ref={dashboardRef}
            className={styles.modalDashboard}
            onClick={e => e.stopPropagation()} // Click outside listener
          >
            {/* Column A: Left event image gallery slider */}
            <div className={styles.gallerySlider}>
              <div className={styles.sliderContainer}>
                {slidesList.map((slide, sIdx) => (
                  <div
                    key={slide}
                    className={`${styles.slide} ${
                      currentSlide === sIdx ? styles.slideActive : ''
                    }`}
                  >
                    {/* Futuristic high-tech placeholder shown behind image */}
                    <div className={styles.slidePlaceholder}>
                      <span className={styles.placeholderIcon}>🔒</span>
                      <span className={styles.placeholderText}>SECURE ARCHIVE LOADING</span>
                      <span className={styles.placeholderSub}>DATA IMAGES DEPLOYING SOON</span>
                    </div>

                    <img 
                      src={`/assets/milestones/${activeMilestone.id}/${slide}`} 
                      alt={`Milestone Event ${sIdx + 1}`} 
                      className={styles.slideImage}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                ))}

                {/* Left/Right navigation buttons */}
                <button
                  className={`${styles.navBtn} ${styles.navBtnPrev}`}
                  onClick={prevSlide}
                  aria-label="Previous image"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  className={`${styles.navBtn} ${styles.navBtnNext}`}
                  onClick={nextSlide}
                  aria-label="Next image"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                {/* Bullet navigation indicators */}
                <div className={styles.indicatorContainer}>
                  {slidesList.map((_, sIdx) => (
                    <button
                      key={sIdx}
                      className={`${styles.indicator} ${
                        currentSlide === sIdx ? styles.indicatorActive : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentSlide(sIdx);
                      }}
                      aria-label={`Go to slide ${sIdx + 1}`}
                    />
                  ))}
                </div>

                {/* Counter & Caption Overlay */}
                <div className={styles.slideInfo}>
                  <span className={styles.slideCounter}>{`0${currentSlide + 1} / 0${slidesList.length}`}</span>
                  <span className={styles.slideCaption}>
                    {currentSlide === 0
                      ? 'MAIN ARCHIVE COVER'
                      : currentSlide === 1
                      ? 'EVENT SNAPSHOT'
                      : currentSlide === 2
                      ? 'EXHIBIT & PRESENTATION'
                      : currentSlide === 3
                      ? 'OFFICIAL RECOGNITION'
                      : 'ADDITIONAL MEDIA'}
                  </span>
                </div>
              </div>
            </div>

            {/* Column B: Right Content description summary */}
            <div className={styles.contentCol}>
              <span className={styles.modalEyebrow}>{activeMilestone.num}</span>
              <h3 className={styles.modalTitle}>{activeMilestone.title}</h3>
              <p className={styles.modalDesc}>{activeMilestone.desc}</p>
              
              <a 
                href={activeMilestone.liUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.linkedinBtn}
              >
                <span>VIEW LINKEDIN POST</span>
                {/* SVG redirect arrow */}
                <svg 
                  width="13" 
                  height="13" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </a>
            </div>

          </div>
        </div>
      )}

    </section>
  );
}
