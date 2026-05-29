# Tanisha Sharma Portfolio

An immersive, production-ready cinematic creative web portfolio showcasing state-of-the-art interactive systems, real-time gesture-driven environments, and machine learning research projects.

---

## 🚀 Live Demo & Interactive Sandbox
Experience the live immersive components and creative labs directly on your browser.
* **GitHub Repository**: [Tanisha-Sharma-Portfolio](https://github.com/Tanisharma122/Tanisha-Sharma-Portfolio)
* **LinkedIn Profile**: [Tanisha Sharma on LinkedIn](https://www.linkedin.com/in/tanisha-sharma-81b329321/)
* **Email Inquiry Address**: [tanisharma0311@gmail.com](mailto:tanisharma0311@gmail.com)

---

## 🛠️ Advanced Technology Stack & Core Architectures

The entire project is engineered using a highly performant, modern frontend and graphics stack:

| Layer / Domain | Technologies & Libraries | Key Implementations & Mechanics |
| :--- | :--- | :--- |
| **Core Framework** | Next.js 16 (App Router), React, TypeScript | High-performance server-side rendering, type-safe structures, unified state management. |
| **3D Rendering Engine** | Three.js (WebGL), Custom Parametric Shaders | High-performance 3D vector fields, liquid-chrome beveled mesh rendering, interactive mouse/drag physics. |
| **Real-Time Hand Tracking** | MediaPipe Hands, MediaPipe Camera Utilities | 60FPS biometric skeleton tracking, coordinate LERP filters, custom gesture state classification. |
| **Kinetic Canvas & Writing** | HTML5 2D Canvas, Custom Path Interpolation | Particle-only writing brush, dual-pass glow masking with background color separation, responsive eraser tracking. |
| **Interactive Physics** | Custom Rigid-Body Physics Engine (Canvas) | Custom gravity, friction, restitution (bounce) factors, multi-body elastic collisions, mouse drag-force physics. |
| **Animation Systems** | GreenSock Animation Platform (GSAP), ScrollTrigger | Smooth scale transitions, spring-like elastic entrance loops, scroll-synchronized line tracks, mouse-reactive UI cards. |
| **Styling & Layout** | Pure CSS Modules (Vanilla), Modern Typographies | Strict CSS modules encapsulation, high-contrast dark themes, glassmorphism UI elements, fluid responsive grids. |

---

## 🏃 Local Setup & Development

Ensure you have [Node.js](https://nodejs.org/) installed on your system.

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Tanisharma122/Tanisha-Sharma-Portfolio.git
   cd Tanisha-Sharma-Portfolio
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Dev Environment**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) on your browser.

4. **Compile Production Build**:
   ```bash
   npm run build
   ```

---

## 📂 Project Structure

```text
├── public/
│   ├── assets/             # Media assets & Resume resources
│   └── projects/           # Static images & portfolio assets
├── src/
│   └── app/
│       ├── components/
│       │   ├── AboutMe/
│       │   ├── CinematicLayer/
│       │   ├── ContactFinale/      # Contact Form & Physics Engine
│       │   ├── Experience/         # Career Timeline & 3D chrome arrow
│       │   ├── ExperimentalLabs/   # Creative Labs (Air Canvas & Three.js Galaxy)
│       │   ├── FluidDistortionCanvas/
│       │   ├── FluidSection/
│       │   ├── HeroOverlay/
│       │   ├── Milestones/
│       │   ├── ProjectsGrid/
│       │   ├── ProjectsStack/
│       │   ├── TechStack/
│       │   └── VideoIntro/
│       ├── globals.css
│       ├── layout.tsx              # Page Metadata & fonts
│       └── page.tsx                # Composition Entrypoint
├── package.json
└── tsconfig.json
```

---

## 🎓 Career History & Chronology

### 1. AI/ML Engineering Intern
* **Organization**: The Special Character (Ahmedabad, India)
* **Duration**: Dec 2025 — Feb 2026 (On-Site)
* **Details**: Engineered live computer vision model architectures and constructed real-world machine learning automated pipelines to optimize system throughput.

### 2. Core AI/ML Research Fellow
* **Organization**: IEEE EMBS Student Internship Program
* **Duration**: June 2025 — July 2025 (Remote)
* **Details**: Deployed advanced predictive AI prototypes specializing in Schizophrenia Detection using medical datasets and deep statistical modeling.

### 3. Current Engagements
* **Subject**: Research & Robotics
* **Details**: Actively expanding into core engineering domains through advanced AI research initiatives and autonomous robotics development.

---

## 🌌 Interactive Creative Labs Summary

### 1. Kinetic Air Canvas (`AirCanvasLab.tsx`)
A gesture-driven 2D space canvas layered above your live mirrored webcam video feed:
* **Double LERP-Smoothing**: Primary mapping LERP at `0.32` and secondary drawing path LERP at `0.16` for jitter-free writing.
* **Particle Brush**: Dense, glowing circular particle streams instead of solid paths.
* **Dual-Pass Border Masking**: Generates a stark white outline boundary behind the HSL Rainbow Brush to keep strokes crisp on bright webcams.
* **Ref Decoupling**: Configuration states are stored in React Refs, keeping MediaPipe tracking alive without camera re-initialization lag.

### 2. Interactive Particle Galaxy (`ParticleGalaxyLab.tsx`)
A 3D Three.js WebGL parametric shape-shifting engine managing over 8,000 particles:
* **Parametric Targets**: Shift particles smoothly (LERP at `0.06`) between three structures: a thin monochromatic **Cosmic Sphere**, a sharp dual-accent **Constellation Star**, and a revolving 3D helical **Holographic Flower** ($r = \cos(6 \cdot \theta)$).
* **Biometric Gestures**: Closed Fist triggers the Sphere, Five-Finger bunch triggers the Star, and Open Palm blossoms the Flower.

### 3. Rigid-Body Contact Dock (`ContactFinale.tsx`)
A responsive 2D physics sandbox built directly into the form footer:
* **Physics Engine**: Calculates collisions, friction (`0.988`), and bouncy restitution (`0.58`) for 190 cascading modern primitives (starbursts, squorcles, pills, donuts).
* **Cursor Throw Forces**: Allows users to interactively drag, fling, and disrupt the dynamic particle pile-up.
