'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './TechStack.module.css';

gsap.registerPlugin(ScrollTrigger);

/* ── Tech stack data for three marquee rows ────────────────────────── */
const ROW_1 = [
  'Python', 'TensorFlow', 'PyTorch', 'OpenCV', 'MediaPipe',
  'YOLO', 'Scikit-Learn', 'NumPy', 'Pandas', 'Keras',
  'Matplotlib', 'Streamlit',
];

const ROW_2 = [
  'Next.js', 'React', 'TypeScript', 'JavaScript', 'Three.js',
  'GSAP', 'Node.js', 'HTML5', 'CSS3', 'Tailwind CSS',
  'Figma', 'Vercel',
];

const ROW_3 = [
  'Deep Learning', 'Computer Vision', 'NLP', 'Neural Networks',
  'CNN', 'RNN', 'GANs', 'Transformers', 'Hugging Face',
  'LangChain', 'n8n', 'Git',
];

/* ── Separator dot rendered between items ──────────────────────────── */
function Separator() {
  return <span className={styles.separator}>◆</span>;
}

/* ── A single marquee row (duplicated content for seamless loop) ──── */
function MarqueeRow({
  items,
  reverse,
  trackRef,
}: {
  items: string[];
  reverse?: boolean;
  trackRef: React.RefObject<HTMLDivElement | null>;
}) {
  // Duplicate items 4× so there's always enough content to fill the viewport
  const repeated = [...items, ...items, ...items, ...items];

  return (
    <div className={styles.marqueeRow}>
      <div
        ref={trackRef}
        className={`${styles.marqueeTrack} ${reverse ? styles.reverse : ''}`}
      >
        {repeated.map((tech, i) => (
          <span key={`${tech}-${i}`} className={styles.marqueeItem}>
            {tech}
            <Separator />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function TechStack() {
  const sectionRef     = useRef<HTMLDivElement>(null);
  const fillHeadingRef = useRef<HTMLHeadingElement>(null);
  const track1Ref      = useRef<HTMLDivElement>(null);
  const track2Ref      = useRef<HTMLDivElement>(null);
  const track3Ref      = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section     = sectionRef.current;
    const fillHeading = fillHeadingRef.current;
    const track1      = track1Ref.current;
    const track2      = track2Ref.current;
    const track3      = track3Ref.current;
    if (!section || !fillHeading || !track1 || !track2 || !track3) return;

    const ctx = gsap.context(() => {
      /* ── Infinite marquee animations ─────────────────────────────── */
      const setupMarquee = (
        track: HTMLDivElement,
        direction: 'left' | 'right',
        duration: number,
      ) => {
        // Measure the width of one set of items (quarter of total since we 4× duplicated)
        const totalWidth = track.scrollWidth;
        const singleSetWidth = totalWidth / 4;

        if (direction === 'left') {
          gsap.set(track, { x: 0 });
          gsap.to(track, {
            x: -singleSetWidth,
            duration,
            ease: 'none',
            repeat: -1,
          });
        } else {
          gsap.set(track, { x: -singleSetWidth });
          gsap.to(track, {
            x: 0,
            duration,
            ease: 'none',
            repeat: -1,
          });
        }
      };

      setupMarquee(track1, 'left', 40);
      setupMarquee(track2, 'right', 35);
      setupMarquee(track3, 'left', 45);

      /* ── PROJECTS kinetic text-fill scroll trigger ───────────────── */
      gsap.fromTo(
        fillHeading,
        { clipPath: 'inset(0 100% 0 0)' },
        {
          clipPath: 'inset(0 0% 0 0)',
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top 65%',
            end: 'bottom 45%',
            scrub: 1.2,
          },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      id="tech-stack-section"
      aria-label="Core Technology Stack and Projects Header"
    >
      {/* ── Eyebrow Label ──────────────────────────────────────────── */}
      <div className={styles.container}>
        <span className={styles.eyebrowTech}><strong>CORE TECHNICAL STACK</strong></span>
      </div>

      {/* ── 3-Row Infinite Scrolling Tech Marquee ─────────────────── */}
      <div className={styles.marqueeWrapper}>
        <MarqueeRow items={ROW_1} trackRef={track1Ref} />
        <MarqueeRow items={ROW_2} trackRef={track2Ref} reverse />
        <MarqueeRow items={ROW_3} trackRef={track3Ref} />
      </div>

      {/* ── Massive overlapping "PROJECTS" kinetic heading ─────────── */}
      <div className={styles.headingWrapper}>
        <h2 className={styles.headingHollow}>PROJECTS</h2>
        <h2
          ref={fillHeadingRef}
          className={styles.headingFill}
          aria-hidden="true"
        >
          PROJECTS
        </h2>
      </div>
    </section>
  );
}
