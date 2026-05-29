'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import styles from './VideoIntro.module.css';

const VIDEO_SRC = '/assets/avatar.mp4';

export default function VideoIntro() {
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const blurVideoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showBadge, setShowBadge] = useState(true);
  const [badgeVisible, setBadgeVisible] = useState(true);

  useEffect(() => {
    // Auto-fade badge after 4 seconds
    const fadeTimer = setTimeout(() => {
      setBadgeVisible(false);
    }, 3600);

    const removeTimer = setTimeout(() => {
      setShowBadge(false);
    }, 4600);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Keep blur video in sync with main video to prevent visual drift
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const main = mainVideoRef.current;
      const blur = blurVideoRef.current;
      if (main && blur && Math.abs(main.currentTime - blur.currentTime) > 0.3) {
        blur.currentTime = main.currentTime;
      }
    }, 5000);

    return () => clearInterval(syncInterval);
  }, []);

  // Pause video & mute audio when hero scrolls out of view;
  // resume & restore audio when scrolling back to hero
  const wasMutedBeforeLeave = useRef(true);
  const wasPlayingBeforeLeave = useRef(true);

  useEffect(() => {
    const wrapper = mainVideoRef.current?.closest(`.${styles.videoWrapper}`);
    if (!wrapper) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = mainVideoRef.current;
        const blur = blurVideoRef.current;
        if (!video) return;

        if (!entry.isIntersecting) {
          // Scrolled away — save state, pause, and mute
          wasMutedBeforeLeave.current = video.muted;
          wasPlayingBeforeLeave.current = !video.paused;
          video.muted = true;
          video.pause();
          blur?.pause();
          setIsPlaying(false);
        } else {
          // Scrolled back — restore previous state
          video.muted = wasMutedBeforeLeave.current;
          setIsMuted(wasMutedBeforeLeave.current);
          if (wasPlayingBeforeLeave.current) {
            if (blur) {
              blur.currentTime = video.currentTime;
              blur.play();
            }
            video.play();
            setIsPlaying(true);
          }
        }
      },
      { threshold: 0.3 } // Trigger when 30% of hero is visible/hidden
    );

    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  const handleMuteToggle = useCallback(() => {
    const video = mainVideoRef.current;
    if (!video) return;

    const newMuted = !video.muted;
    video.muted = newMuted;
    // Blur video is purely decorative — always stays muted to prevent
    // dual-audio echo/phasing that distorts the voice track
    setIsMuted(newMuted);
  }, []);

  const handlePlayToggle = useCallback(() => {
    const video = mainVideoRef.current;
    const blurVideo = blurVideoRef.current;
    if (!video) return;

    if (video.paused) {
      // Sync blur video position to main video before resuming
      if (blurVideo) {
        blurVideo.currentTime = video.currentTime;
        blurVideo.play();
      }
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      blurVideo?.pause();
      setIsPlaying(false);
    }
  }, []);

  return (
    <div className={styles.videoWrapper}>
      {/* Ambient blur glow layer underneath */}
      <video
        ref={blurVideoRef}
        className={styles.videoBlur}
        src={VIDEO_SRC}
        autoPlay
        loop
        playsInline
        muted
        aria-hidden="true"
        onError={() => {/* video not yet placed — silent */}}
      />

      {/* Primary fullscreen video */}
      <video
        ref={mainVideoRef}
        className={styles.videoMain}
        src={VIDEO_SRC}
        autoPlay
        loop
        playsInline
        muted
        onError={() => {/* video not yet placed — silent */}}
      />

      {/* Cinematic gradient mask */}
      <div className={styles.gradientMask} aria-hidden="true" />

      {/* Tap for sound badge */}
      {showBadge && (
        <div
          className={`${styles.soundBadge} ${!badgeVisible ? styles.soundBadgeHidden : ''}`}
          role="status"
          aria-live="polite"
        >
          <span className={styles.soundBadgeDot} aria-hidden="true" />
          <span>Tap for sound</span>
        </div>
      )}

      {/* Glassmorphism controls */}
      <div className={styles.controls} role="group" aria-label="Video controls">
        <button
          className={styles.controlBtn}
          onClick={handlePlayToggle}
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            // Pause icon
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            // Play icon
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>

        <div className={styles.controlDivider} aria-hidden="true" />

        <button
          className={styles.controlBtn}
          onClick={handleMuteToggle}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            // Muted icon
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M3 9v6h4l5 5V4L7 9H3z" />
              <line x1="17" y1="9" x2="22" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="22" y1="9" x2="17" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            // Sound icon
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M3 9v6h4l5 5V4L7 9H3z" />
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.06c1.48-.73 2.5-2.25 2.5-4.03z" />
              <path d="M19 12c0 3.04-1.73 5.68-4.25 7.02l1.44 1.44C19.32 18.73 21 15.56 21 12s-1.68-6.73-4.81-8.46l-1.44 1.44C17.27 6.32 19 8.96 19 12z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
