'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ContactFinale.module.css';

// ── Contact Dock links ──────────────────────────────────────────────
const LINKEDIN_URL = 'https://www.linkedin.com/in/tanisha-sharma-81b329321/';
const GITHUB_URL   = 'https://github.com/Tanisharma122';
const EMAIL_MAILTO = 'mailto:tanisharma0311@gmail.com';
const WHATSAPP_URL = 'https://wa.me/919999999999'; // standard api hook placeholder
const RESUME_PDF   = '/assets/Tanisha_Sharma_Resume___IIMA.pdf';
const GOOGLE_SHEET_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxIUe-ugBMmK0JYECFBs9eUlzuGq_fq4yF0IsCgQKkvLGFX0NENESln24jB_I_Y7BQO/exec';

// ── Flat Palette Colors ─────────────────────────────────────────────
const COLORS = [
  '#FF6B6B', // bubbly coral red
  '#4ECDC4', // cute turquoise
  '#FFD166', // soft golden yellow
  '#FF85A2', // bubblegum pink
  '#72EFDD', // vivid cute mint
  '#6C5CE7', // bright cute violet
  '#FF9F43', // sweet peach orange
  '#FF7A00', // signature glowing orange
];

const SHAPES = ['circle', 'squorce', 'pill', 'toroid', 'star4', 'star5'];

// ── Custom Lightweight Rigid-body Class ─────────────────────────────
class RigidBody {
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  mass: number;
  r: number; // bounding size/radius
  shape: string;
  color: string;
  angle: number = Math.random() * Math.PI;
  av: number = (Math.random() - 0.5) * 0.05; // angular velocity

  constructor(canvasW: number) {
    this.r = 18 + Math.random() * 14; // 18px to 32px (premium, larger interactive size)
    this.x = this.r + Math.random() * (canvasW - this.r * 2);
    this.y = -80 - Math.random() * 400; // spawn higher up to allow staggered cascading waves
    this.mass = this.r * 0.22; // solid density for realistic physical presence
    this.shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
  }

  update(canvasW: number, canvasH: number, gravity: number, friction: number, restitution: number) {
    // Apply gravity
    this.vy += gravity;
    
    // Apply dampening
    this.vx *= friction;
    this.vy *= friction;
    this.av *= friction;

    // Position updates
    this.x += this.vx;
    this.y += this.vy;
    this.angle += this.av;

    // Floor collision
    if (this.y + this.r >= canvasH) {
      this.y = canvasH - this.r;
      this.vy = -this.vy * restitution;
      this.vx *= 0.85; // friction on floor roll
      this.av = this.vx * 0.05; // roll rotation
    }

    // Left wall collision
    if (this.x - this.r <= 0) {
      this.x = this.r;
      this.vx = -this.vx * restitution;
      this.av += this.vy * 0.02;
    }

    // Right wall collision
    if (this.x + this.r >= canvasW) {
      this.x = canvasW - this.r;
      this.vx = -this.vx * restitution;
      this.av -= this.vy * 0.02;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.color;

    // Render high-end stylized modern aesthetic custom geometries
    ctx.beginPath();
    if (this.shape === 'circle') {
      ctx.arc(0, 0, this.r, 0, Math.PI * 2);
    } else if (this.shape === 'squorce') {
      // Squorcle / Soft chamfered box
      ctx.roundRect(-this.r, -this.r, this.r * 2, this.r * 2, this.r * 0.55);
    } else if (this.shape === 'pill') {
      // Elongated pill capsule
      ctx.roundRect(-this.r * 0.55, -this.r * 1.25, this.r * 1.1, this.r * 2.5, this.r * 0.55);
    } else if (this.shape === 'toroid') {
      // Toroid / Hollow Ring / Donut using concentric winding rules
      ctx.arc(0, 0, this.r, 0, Math.PI * 2, false);
      ctx.arc(0, 0, this.r * 0.48, 0, Math.PI * 2, true);
    } else if (this.shape === 'star4' || this.shape === 'star5') {
      // Bubbly star with rounded vertices connecting using quadratic curve interpolation
      const pts = this.shape === 'star4' ? 4 : 5;
      const outerR = this.r * 1.15;
      const innerR = this.r * 0.4;
      for (let s = 0; s < pts; s++) {
        const a = (s * Math.PI * 2) / pts - Math.PI / 2;
        const aNext = ((s + 1) * Math.PI * 2) / pts - Math.PI / 2;
        const aMid = a + Math.PI / pts;
        
        const xOuter = outerR * Math.cos(a);
        const yOuter = outerR * Math.sin(a);
        const xInner = innerR * Math.cos(aMid);
        const yInner = innerR * Math.sin(aMid);
        const xOuterNext = outerR * Math.cos(aNext);
        const yOuterNext = outerR * Math.sin(aNext);

        if (s === 0) ctx.moveTo(xOuter, yOuter);
        ctx.quadraticCurveTo(xInner, yInner, xOuterNext, yOuterNext);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

export default function ContactFinale({ onOpenLabs }: { onOpenLabs: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formOrg, setFormOrg] = useState('');
  const [formMsg, setFormMsg] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('sending');

    const payload = {
      name: formName,
      email: formEmail,
      org: formOrg,
      message: formMsg,
    };

    try {
      if (GOOGLE_SHEET_WEBAPP_URL.includes('YOUR_DEPLOYED_URL_ID')) {
        throw new Error('Placeholder URL');
      }

      await fetch(GOOGLE_SHEET_WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      setSubmitStatus('success');
      setFormName('');
      setFormEmail('');
      setFormOrg('');
      setFormMsg('');

      // Auto-reset success message after 5 seconds
      setTimeout(() => setSubmitStatus('idle'), 5000);

    } catch (err) {
      console.warn('Google Sheets submission failed, falling back to email redirect:', err);
      setSubmitStatus('error');
      
      // Fallback email link
      const fallbackUrl = `${EMAIL_MAILTO}?subject=System Initialization Proposal from ${encodeURIComponent(formName)} (${encodeURIComponent(formOrg)})&body=${encodeURIComponent(formMsg)}`;
      window.location.href = fallbackUrl;
      
      setTimeout(() => setSubmitStatus('idle'), 4000);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bodies: RigidBody[] = [];

    // Robust canvas boundaries tracking with immediate coordinate clamping to prevent element leaking
    const resizeCanvas = () => {
      canvas.width  = section.clientWidth;
      canvas.height = section.clientHeight;
      
      bodies.forEach(body => {
        if (body.x - body.r < 0) body.x = body.r;
        if (body.x + body.r > canvas.width) body.x = canvas.width - body.r;
        if (body.y + body.r > canvas.height) body.y = canvas.height - body.r;
      });
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Staggered Spawning System: Target high-density count of 190 bodies
    const targetCount = 190;
    // Initial wave spawn of 40 bodies
    for (let i = 0; i < 40; i++) {
      bodies.push(new RigidBody(canvas.width));
    }

    // ── Environmental Physics Constants (Bounce and low-friction spill-over) ──
    const GRAVITY     = 0.24;  // realistic smooth descent
    const FRICTION    = 0.988; // low resistance sliding friction
    const RESTITUTION = 0.58;  // bouncy factor to pile up beautifully without jitter

    // ── Mouse & Interacting Pointer State ───────────────────────────
    let mouseX = 0, mouseY = 0, isMouseDown = false;
    let prevMouseX = 0, prevMouseY = 0;
    let draggedBody: RigidBody | null = null;

    const getMouseCoords = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const { x, y } = getMouseCoords(e);
      mouseX = prevMouseX = x;
      mouseY = prevMouseY = y;
      isMouseDown = true;

      // Find closest shape to select for drag constraint
      let closest: RigidBody | null = null;
      let minDist = 60; // grab radius limit

      for (const body of bodies) {
        const dx = body.x - x;
        const dy = body.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < body.r + 15 && dist < minDist) {
          closest = body;
          minDist = dist;
        }
      }

      if (closest) {
        draggedBody = closest;
        draggedBody.vx = 0;
        draggedBody.vy = 0;
        draggedBody.av = 0;
      }
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const { x, y } = getMouseCoords(e);
      
      prevMouseX = mouseX;
      prevMouseY = mouseY;
      mouseX = x;
      mouseY = y;

      if (isMouseDown && draggedBody) {
        // Body absolute follows coordinate
        draggedBody.x = x;
        draggedBody.y = y;
        
        // Calculate dynamic throwing force velocities
        draggedBody.vx = mouseX - prevMouseX;
        draggedBody.vy = mouseY - prevMouseY;
        draggedBody.av = draggedBody.vx * 0.05; // angular throw velocity
      } else {
        // High-power radial force field (doubled impulse strength, wider 200px sweep range)
        bodies.forEach(body => {
          const dx = body.x - x;
          const dy = body.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 200) { // 200px force field range
            const force = (200 - dist) * 0.08; // 0.08 scaled force factor to sweep massive element pile
            const angle = Math.atan2(dy, dx);
            body.vx += Math.cos(angle) * force;
            body.vy += Math.sin(angle) * force;
            body.av += (Math.random() - 0.5) * 0.06; // extra spin torque
          }
        });
      }
    };

    const handlePointerUp = () => {
      isMouseDown = false;
      draggedBody = null;
    };

    // Listeners bindings
    canvas.addEventListener('mousedown',  handlePointerDown);
    canvas.addEventListener('mousemove',  handlePointerMove);
    canvas.addEventListener('mouseup',    handlePointerUp);
    canvas.addEventListener('mouseleave', handlePointerUp);

    canvas.addEventListener('touchstart', handlePointerDown, { passive: true });
    canvas.addEventListener('touchmove',  handlePointerMove, { passive: true });
    canvas.addEventListener('touchend',    handlePointerUp,   { passive: true });

    // ── Physics Math Rigid-body Engine Loop ──────────────────────────
    let rafId: number;
    let frameCount = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      frameCount++;
      // Spawn new shapes in staggered waves (8 shapes every 15 frames) until 190 target is met
      if (bodies.length < targetCount && frameCount % 15 === 0) {
        const batchSize = Math.min(8, targetCount - bodies.length);
        for (let b = 0; b < batchSize; b++) {
          bodies.push(new RigidBody(canvas.width));
        }
      }

      // 1. Double loop circle-circle push collision solvers to make shapes pool naturally
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const bi = bodies[i];
          const bj = bodies[j];

          // Skip overlap correction on currently dragged element
          if (bi === draggedBody || bj === draggedBody) continue;

          const dx = bj.x - bi.x;
          const dy = bj.y - bi.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const minDist = bi.r + bj.r;

          if (dist < minDist) {
            const overlap = minDist - dist;
            const angle = Math.atan2(dy, dx);

            // Correct positions by shifting each by half overlap
            const pushX = Math.cos(angle) * overlap * 0.5;
            const pushY = Math.sin(angle) * overlap * 0.5;

            bi.x -= pushX;
            bi.y -= pushY;
            bj.x += pushX;
            bj.y += pushY;

            // Simple elastic velocity exchange math
            const tempVx = bi.vx;
            const tempVy = bi.vy;
            bi.vx = bj.vx * 0.65 + tempVx * 0.35;
            bi.vy = bj.vy * 0.65 + tempVy * 0.35;
            bj.vx = tempVx * 0.65 + bj.vx * 0.35;
            bj.vy = tempVy * 0.65 + bj.vy * 0.35;

            // Friction rotation exchange
            bi.av += (bj.vx - bi.vx) * 0.01;
            bj.av += (bi.vx - bj.vx) * 0.01;
          }
        }
      }

      // 2. Update and draw bodies
      bodies.forEach(body => {
        if (body !== draggedBody) {
          body.update(canvas.width, canvas.height, GRAVITY, FRICTION, RESTITUTION);
        }
        body.draw(ctx);
      });
    };
    animate();

    // Cleanup resources
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resizeCanvas);
      
      canvas.removeEventListener('mousedown',  handlePointerDown);
      canvas.removeEventListener('mousemove',  handlePointerMove);
      canvas.removeEventListener('mouseup',    handlePointerUp);
      canvas.removeEventListener('mouseleave', handlePointerUp);

      canvas.removeEventListener('touchstart', handlePointerDown);
      canvas.removeEventListener('touchmove',  handlePointerMove);
      canvas.removeEventListener('touchend',    handlePointerUp);
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.section} id="contact-section">
      
      {/* 2D Physics Canvas Engine Layer */}
      <canvas ref={canvasRef} className={styles.physicsCanvas} />

      {/* Structural Contact Form Grid */}
      <div className={styles.grid}>
        
        {/* Left Column (Call-To-Action) */}
        <div className={styles.leftCol}>
          <h2 className={styles.heading}>
            Let&apos;s build<br />something<br />intelligent.
          </h2>
          
          <a href={EMAIL_MAILTO} className={styles.emailLink}>
            tanisharma0311@gmail.com
          </a>
        </div>

        {/* Right Column (Input Interface Array) */}
        <form onSubmit={handleSubmit} className={styles.rightCol}>
          {submitStatus === 'success' ? (
            <div className={styles.statusSuccess}>
              <span className={styles.statusIcon}>✓</span>
              <h3 className={styles.statusTitle}>CONNECTION ESTABLISHED</h3>
              <p className={styles.statusText}>Your transmission has been securely logged to the centralized database.</p>
            </div>
          ) : (
            <>
              <div className={styles.formGroup}>
                <label htmlFor="fullname" className={styles.inputLabel}>Full Name*</label>
                <input 
                  type="text" 
                  id="fullname" 
                  required
                  placeholder="e.g. Tanisha Sharma"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className={styles.inputField} 
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.inputLabel}>Email Address*</label>
                <input 
                  type="email" 
                  id="email" 
                  required
                  placeholder="e.g. tanisha@example.com"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  className={styles.inputField} 
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="linkedin" className={styles.inputLabel}>LinkedIn URL / Organization</label>
                <input 
                  type="text" 
                  id="linkedin" 
                  placeholder="e.g. linkedin.com/in/tanisha-sharma"
                  value={formOrg}
                  onChange={e => setFormOrg(e.target.value)}
                  className={styles.inputField} 
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="message" className={styles.inputLabel}>Project Brief / Message</label>
                <textarea 
                  id="message" 
                  rows={3}
                  placeholder="Detail your system architectures or algorithmic proposals..."
                  value={formMsg}
                  onChange={e => setFormMsg(e.target.value)}
                  className={styles.inputField} 
                  style={{ resize: 'none' }}
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={submitStatus === 'sending'}>
                {submitStatus === 'sending' ? 'TRANSMITTING...' : 'SEND'}
              </button>
            </>
          )}
        </form>

      </div>

      {/* FUN AI Projects Folder Entry point */}
      <div className={styles.folderContainer}>
        <button 
          className={styles.folderBtn}
          onClick={onOpenLabs}
          aria-label="Open Fun AI Projects Sandbox"
        >
          <div className={styles.folderTab} />
          <div className={styles.folderBody}>
            <span className={styles.folderLabel}>FUN AI PROJECTS</span>
            <span className={styles.folderLabTag}>[ LAB 05 ]</span>
            <div className={styles.folderPulse} />
          </div>
        </button>
      </div>

      {/* Unified Career Network Dock Menu */}
      <div className={styles.dockWrapper}>
        <nav className={styles.dock} aria-label="Professional profiles dock">
          
          {/* GitHub Link */}
          <a 
            href={GITHUB_URL} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.dockLink}
            aria-label="View Tanisha's GitHub repositories"
            title="GitHub"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
          </a>

          {/* LinkedIn Profile */}
          <a 
            href={LINKEDIN_URL} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.dockLink}
            aria-label="Connect with Tanisha on LinkedIn"
            title="LinkedIn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect x="2" y="9" width="4" height="12" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </a>

          {/* WhatsApp Direct */}
          <a 
            href={WHATSAPP_URL} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.dockLink}
            aria-label="Direct message Tanisha on WhatsApp"
            title="WhatsApp"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </a>

          {/* Secure Document Link (Resume PDF) */}
          <a 
            href={RESUME_PDF} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.dockLink}
            aria-label="Download Tanisha's Resume PDF"
            title="Download Resume"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </a>

          {/* Mailto Hook */}
          <a 
            href={EMAIL_MAILTO} 
            className={styles.dockLink}
            aria-label="Email Tanisha Sharma directly"
            title="Email"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </a>

        </nav>
      </div>

    </section>
  );
}
