'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import styles from './HeroOverlay.module.css';

export default function HeroOverlay() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-hero-anim]', {
        y: 30,
        opacity: 0,
        duration: 1.2,
        stagger: 0.15,
        ease: 'power3.out',
        delay: 0.4,
        clearProps: 'all',
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className={styles.overlay}>
      <h1 className={styles.nameBlock} aria-label="Tanisha Sharma">
        <span className={styles.nameLine} data-hero-anim>TANISHA</span>
        <span className={styles.nameLine} data-hero-anim>SHARMA</span>
      </h1>
    </div>
  );
}
