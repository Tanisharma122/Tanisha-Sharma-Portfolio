'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './page.module.css';

// Dynamically import client components that need browser APIs
const VideoIntro = dynamic(() => import('./components/VideoIntro/VideoIntro'), {
  ssr: false,
});

const HeroOverlay = dynamic(
  () => import('./components/HeroOverlay/HeroOverlay'),
  { ssr: false }
);

const FluidDistortionCanvas = dynamic(
  () => import('./components/FluidDistortionCanvas/FluidDistortionCanvas'),
  { ssr: false }
);

const AboutMe = dynamic(
  () => import('./components/AboutMe/AboutMe'),
  { ssr: false }
);

const Experience = dynamic(
  () => import('./components/Experience/Experience'),
  { ssr: false }
);

const TechStack = dynamic(
  () => import('./components/TechStack/TechStack'),
  { ssr: false }
);

const ProjectsStack = dynamic(
  () => import('./components/ProjectsStack/ProjectsStack'),
  { ssr: false }
);

const Milestones = dynamic(
  () => import('./components/Milestones/Milestones'),
  { ssr: false }
);

const ContactFinale = dynamic(
  () => import('./components/ContactFinale/ContactFinale'),
  { ssr: false }
);

const ExperimentalLabs = dynamic(
  () => import('./components/ExperimentalLabs/ExperimentalLabs'),
  { ssr: false }
);

export default function Home() {
  const [isLabsOpen, setIsLabsOpen] = useState(false);

  return (
    <>
      {/* Dynamic fullscreen WebGL cursor distortion overlay */}
      <FluidDistortionCanvas />

      {/* ── HERO SECTION ──────────────────────────────────────────── */}
      <section className={styles.heroSection} aria-label="Hero section">
        <VideoIntro />
        <HeroOverlay />
      </section>

      {/* ── SECTION 2: ABOUT ME ID-CARD LAYER ─────────────────────── */}
      <AboutMe />

      {/* ── SECTION 3: PROFESSIONAL EXPERIENCE TIMELINE ───────────── */}
      <Experience />

      {/* ── SECTION 4: SCROLL-LINKED INFINITE TECH MARQUEE ────────── */}
      <TechStack />

      {/* ── SECTION 5: STICKY SCROLL-LINKED LAYERED PROJECT STACK ──── */}
      <ProjectsStack />

      {/* ── SECTION 6: INTERACTIVE MARQUEE MATRIX FOR MILESTONES ───── */}
      <Milestones />

      {/* ── SECTION 7: LIGHT THEME INTERACTIVE PHYSICS CONTACT FINALE ── */}
      <ContactFinale onOpenLabs={() => setIsLabsOpen(true)} />

      {/* ── EXPANDABLE FULLSCREEN EXPERIMENTAL SANDBOX OVERLAY TRAY ───── */}
      <ExperimentalLabs isOpen={isLabsOpen} onClose={() => setIsLabsOpen(false)} />
    </>
  );
}
