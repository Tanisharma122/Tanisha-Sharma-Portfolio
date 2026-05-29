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

## 🌌 Interactive Creative Labs Summary

### 1. Kinetic Air Canvas (`AirCanvasLab.tsx`)
A gesture-driven 2D space canvas layered above your live mirrored webcam video feed:
* **Smoothing & Precision**: Integrates a dual LERP-smoothing pipeline (primary hand coordinates mapping LERP at `0.32` and secondary drawing stroke LERP at `0.16`) to fully eliminate high-frequency hand jittering, providing a smooth writing experience.
* **Particle Brush Mode**: Discards traditional solid paths in favor of highly dense, glowing circular particle streams.
* **High-Contrast Masking**: Toggles an advanced dual-pass HSL Rainbow Brush, which draws a clean background masking layer behind the glowing rainbow segments to act as a clear border outline exclusively on letter boundaries, maximizing visibility against light webcams.
* **Biometric skeleton**: Superimposes a real-time double-filtered glowing cyan and white hand skeleton mesh tracking every joint node.
* **Zero-Interruption Stream**: decouple state switches (eraser toggle, paint colors, stroke weights) from the MediaPipe thread using persistent React Refs, keeping camera preview and tracking active without stream tear-down or lag.

### 2. Interactive Particle Galaxy (`ParticleGalaxyLab.tsx`)
A Three.js WebGL parametric shape-shifting engine controlling over 8,000 spatial vectors:
* **Parametric Geometries**:
  - **Shape 01 (Cosmic Sphere)**: A thin 3D spherical shell with an intense monochromatic violet/deep purple core mix.
  - **Shape 02 (Constellation Star)**: A highly geometric 5-pointed star featuring sharp, high-contrast arms (cyan/gold highlights).
  - **Shape 03 (Holographic Flower)**: A revolving 12-petaled rose curve ($r = \cos(6 \cdot \theta)$) with a dynamic 3D helical petal wave ($z = \sin(4 \cdot \theta) \cdot 0.2$), color-mapped to shifting rainbow waves.
* **Gesture-Controlled Interpolation**:
  - **Closed Fist / Pinch**: Morphs the field smoothly into the **Cosmic Sphere**.
  - **Five-Finger Cluster** (`avgDist < 0.056`): Transitions the particles into the sharp **Constellation Star**.
  - **Open Palm Spread** (`avgDist > 0.096`): Blossoms the vectors outwards into the **Holographic Flower**.
* **Liquid Vertex Transition**: Applies linear interpolations (LERP) inside the requestAnimationFrame loop at a speed factor of `0.06`, smoothly blending positions and color tracks during transitions.

### 3. Rigid-Body Cascading Contact Dock (`ContactFinale.tsx`)
A highly responsive 2D physics sandbox integrated into the final contact form:
* **CASI Engine**: Coordinates multi-body collisions, gravity vectors (`0.24`), dampening friction (`0.988`), and bouncy restitution (`0.58`) for 190 stylized shape primitives (donuts, pills, squorcles, bubbly stars, circles).
* **Interactive Grab Mechanics**: Allows users to interactively click, grab, throw, and disrupt the particle pile-up using mouse-dragging coordinate offsets.

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
