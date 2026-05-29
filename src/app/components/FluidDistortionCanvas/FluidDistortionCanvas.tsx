'use client';

import { useEffect, useRef } from 'react';
import styles from './FluidDistortionCanvas.module.css';

// ── Simulation config ────────────────────────────────────────────────────────
const SIM_RES            = 128;   // Physics grid (quarter-res for perf)
const DYE_RES            = 512;   // Colour/density texture resolution
const PRESSURE_ITERATIONS = 8;    // Jacobi iterations
const CURL               = 28;    // Vorticity confinement strength
const SPLAT_RADIUS       = 0.002; // Cursor influence radius
const SPLAT_FORCE        = 6000;  // Velocity injection force
const VEL_DISS           = 0.98;  // Velocity field decay
const DYE_DISS           = 0.97;  // Colour field decay

// ── GLSL: Base vertex shader (shared by all passes) ──────────────────────────
// layout(location=0) lets us use a single VAO across all programs
const VERT = /* glsl */`#version 300 es
layout(location = 0) in vec2 aPosition;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;
uniform vec2 texelSize;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  vL  = vUv - vec2(texelSize.x, 0.0);
  vR  = vUv + vec2(texelSize.x, 0.0);
  vT  = vUv + vec2(0.0, texelSize.y);
  vB  = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

// ── GLSL: Fragment shaders ───────────────────────────────────────────────────
const CLEAR_F = /* glsl */`#version 300 es
precision mediump float;
in vec2 vUv; out vec4 o;
uniform sampler2D uTexture; uniform float value;
void main() { o = value * texture(uTexture, vUv); }`;

const SPLAT_F = /* glsl */`#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main() {
  vec2 p = vUv - point;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p,p)/radius) * color;
  o = vec4(texture(uTarget, vUv).rgb + splat, 1.0);
}`;

const ADVECT_F = /* glsl */`#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform vec2 dyeTexelSize;
uniform float dt;
uniform float dissipation;
vec4 bilerp(sampler2D s, vec2 uv, vec2 ts) {
  vec2 st = uv/ts - 0.5;
  vec2 i = floor(st); vec2 f = fract(st);
  vec4 a = texture(s,(i+vec2(0.5,0.5))*ts);
  vec4 b = texture(s,(i+vec2(1.5,0.5))*ts);
  vec4 c = texture(s,(i+vec2(0.5,1.5))*ts);
  vec4 d = texture(s,(i+vec2(1.5,1.5))*ts);
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}
void main() {
  vec2 coord = vUv - dt * bilerp(uVelocity,vUv,texelSize).rg * texelSize;
  o = vec4(dissipation * bilerp(uSource,coord,dyeTexelSize).rgb, 1.0);
}`;

const CURL_F = /* glsl */`#version 300 es
precision mediump float;
in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB;
out vec4 o;
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity,vL).g;
  float R = texture(uVelocity,vR).g;
  float T = texture(uVelocity,vT).r;
  float B = texture(uVelocity,vB).r;
  o = vec4(0.5*(R-L-T+B), 0.0, 0.0, 1.0);
}`;

const VORTICITY_F = /* glsl */`#version 300 es
precision highp float;
in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB;
out vec4 o;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;
void main() {
  float L = texture(uCurl,vL).r;
  float R = texture(uCurl,vR).r;
  float T = texture(uCurl,vT).r;
  float B = texture(uCurl,vB).r;
  float C = texture(uCurl,vUv).r;
  vec2 force = 0.5 * vec2(abs(T)-abs(B), abs(R)-abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  o = vec4(texture(uVelocity,vUv).rg + force*dt, 0.0, 1.0);
}`;

const DIVERGENCE_F = /* glsl */`#version 300 es
precision mediump float;
in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB;
out vec4 o;
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity,vL).r;
  float R = texture(uVelocity,vR).r;
  float T = texture(uVelocity,vT).g;
  float B = texture(uVelocity,vB).g;
  o = vec4(0.5*(R-L+T-B), 0.0, 0.0, 1.0);
}`;

const PRESSURE_F = /* glsl */`#version 300 es
precision mediump float;
in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB;
out vec4 o;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main() {
  float L = texture(uPressure,vL).r;
  float R = texture(uPressure,vR).r;
  float T = texture(uPressure,vT).r;
  float B = texture(uPressure,vB).r;
  float C = texture(uDivergence,vUv).r;
  o = vec4((L+R+T+B-C)*0.25, 0.0, 0.0, 1.0);
}`;

const GRADIENT_F = /* glsl */`#version 300 es
precision mediump float;
in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB;
out vec4 o;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main() {
  float L = texture(uPressure,vL).r;
  float R = texture(uPressure,vR).r;
  float T = texture(uPressure,vT).r;
  float B = texture(uPressure,vB).r;
  o = vec4(texture(uVelocity,vUv).rg - vec2(R-L,T-B), 0.0, 1.0);
}`;

// ── GLSL: Glass refraction display shader ────────────────────────────────────
const DISPLAY_F = /* glsl */`#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uDensity;
uniform sampler2D uVelocity;
uniform vec2 texelSize;

void main() {
  vec3  d = texture(uDensity,  vUv).rgb;
  vec2  v = texture(uVelocity, vUv).rg;

  // ── Normal map from density gradient ────────────────────────────────
  float dx = texture(uDensity, vUv + vec2(texelSize.x*2.0, 0.0)).r
           - texture(uDensity, vUv - vec2(texelSize.x*2.0, 0.0)).r;
  float dy = texture(uDensity, vUv + vec2(0.0, texelSize.y*2.0)).r
           - texture(uDensity, vUv - vec2(0.0, texelSize.y*2.0)).r;
  vec3 normal = normalize(vec3(dx*5.0, dy*5.0, 0.08));

  // ── Glass refraction ─────────────────────────────────────────────────
  vec2 refOff = normal.xy * 0.014;

  // ── Chromatic aberration — peaks at high velocity ────────────────────
  float speed = length(v) * 0.25;
  float ab = clamp(speed * 0.005, 0.0, 0.007);

  float r = texture(uDensity, vUv + refOff + vec2( ab, 0.0)).r;
  float g = texture(uDensity, vUv + refOff              ).g;
  float b = texture(uDensity, vUv + refOff - vec2( ab, 0.0)).b;

  // ── Specular highlight (Blinn-Phong) ─────────────────────────────────
  vec3  lightDir = normalize(vec3(0.4, 0.7, 1.0));
  float spec     = pow(max(dot(normal, lightDir), 0.0), 52.0);

  // ── Colour: warm orange at high density, ice-blue at low ─────────────
  float intensity = length(d);
  vec3 warmTint = vec3(1.00, 0.48, 0.00);  // #FF7A00
  vec3 coolTint = vec3(0.22, 0.45, 1.00);  // ice blue
  vec3 tint = mix(coolTint, warmTint, clamp(intensity * 2.5, 0.0, 1.0));

  vec3 col  = vec3(r,g,b) * tint * 1.6;
  col += spec * vec3(1.0, 0.96, 0.88) * 1.1;   // specular hotspot
  col += d * tint * 0.35;                        // soft dye tint

  // ── Iridescent rim glow ───────────────────────────────────────────────
  float rim = 1.0 - abs(dot(normal, vec3(0.0, 0.0, 1.0)));
  col += pow(rim, 2.2) * vec3(0.45, 0.18, 1.00) * 0.45;

  float alpha = clamp(intensity * 5.0, 0.0, 0.93);
  o = vec4(col, alpha);
}`;

// ── Types ────────────────────────────────────────────────────────────────────
type FBO = {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number; height: number;
  texelSizeX: number; texelSizeY: number;
  attach: (unit: number) => number;
};
type DFBO = { read: FBO; write: FBO; swap: () => void };

// ── Component ────────────────────────────────────────────────────────────────
export default function FluidDistortionCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    // ── Visibility: hide over hero, show below it ──────────────────────
    let overHero = true;
    const onScroll = () => {
      overHero = window.scrollY < window.innerHeight * 0.85;
      canvas.style.opacity        = overHero ? '0' : '1';
    };
    const onResize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    onScroll();

    // ── WebGL2 context ─────────────────────────────────────────────────
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
      };
    }

    // Float texture support
    gl.getExtension('EXT_color_buffer_float');
    const halfFloat      = gl.HALF_FLOAT;
    const internalFormat = gl.RGBA16F;

    // ── Shader / program helpers ───────────────────────────────────────
    const mkShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const mkProg = (fSrc: string) => {
      const p = gl.createProgram()!;
      gl.attachShader(p, mkShader(gl.VERTEX_SHADER,   VERT));
      gl.attachShader(p, mkShader(gl.FRAGMENT_SHADER, fSrc));
      gl.linkProgram(p);
      return p;
    };

    // Cache all uniform locations for a program
    type UMap = Record<string, WebGLUniformLocation | null>;
    const cacheUniforms = (p: WebGLProgram, ...names: string[]): UMap => {
      const m: UMap = {};
      names.forEach(n => { m[n] = gl.getUniformLocation(p, n); });
      return m;
    };

    // ── Create programs ────────────────────────────────────────────────
    const pClear = mkProg(CLEAR_F);
    const pSplat = mkProg(SPLAT_F);
    const pAdv   = mkProg(ADVECT_F);
    const pCurl  = mkProg(CURL_F);
    const pVort  = mkProg(VORTICITY_F);
    const pDiv   = mkProg(DIVERGENCE_F);
    const pPres  = mkProg(PRESSURE_F);
    const pGrad  = mkProg(GRADIENT_F);
    const pDisp  = mkProg(DISPLAY_F);

    const uClear = cacheUniforms(pClear, 'texelSize','uTexture','value');
    const uSplat = cacheUniforms(pSplat, 'texelSize','uTarget','aspectRatio','point','color','radius');
    const uAdv   = cacheUniforms(pAdv,   'texelSize','dyeTexelSize','uVelocity','uSource','dt','dissipation');
    const uCurl  = cacheUniforms(pCurl,  'texelSize','uVelocity');
    const uVort  = cacheUniforms(pVort,  'texelSize','uVelocity','uCurl','curl','dt');
    const uDiv   = cacheUniforms(pDiv,   'texelSize','uVelocity');
    const uPres  = cacheUniforms(pPres,  'texelSize','uPressure','uDivergence');
    const uGrad  = cacheUniforms(pGrad,  'texelSize','uPressure','uVelocity');
    const uDisp  = cacheUniforms(pDisp,  'texelSize','uDensity','uVelocity');

    // ── VAO — single full-screen quad, shared by all programs ──────────
    const vao    = gl.createVertexArray()!;
    gl.bindVertexArray(vao);

    const posBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1,-1, -1,1, 1,1, 1,-1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const idxBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array([0,1,2, 0,2,3]), gl.STATIC_DRAW);

    // ── FBO factory ────────────────────────────────────────────────────
    const mkFBO = (w: number, h: number, filter: number = gl.LINEAR): FBO => {
      const tex = gl.createTexture()!;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, gl.RGBA, halfFloat, null);

      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);

      return {
        texture: tex, fbo,
        width: w, height: h,
        texelSizeX: 1/w, texelSizeY: 1/h,
        attach(unit: number) {
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, tex);
          return unit;
        },
      };
    };

    const mkDFBO = (w: number, h: number, filter?: number): DFBO => {
      let a = mkFBO(w, h, filter), b = mkFBO(w, h, filter);
      return {
        get read()  { return a; },
        get write() { return b; },
        swap()      { [a, b] = [b, a]; },
      };
    };

    // ── Create simulation grids ────────────────────────────────────────
    const aspect = canvas.width / canvas.height;
    const simW = SIM_RES, simH = Math.round(SIM_RES / aspect);
    const dyeW = DYE_RES, dyeH = Math.round(DYE_RES / aspect);

    const vel   = mkDFBO(simW, simH);
    const dye   = mkDFBO(dyeW, dyeH);
    const divFBO = mkFBO(simW, simH, gl.NEAREST);
    const curlFBO = mkFBO(simW, simH, gl.NEAREST);
    const pres  = mkDFBO(simW, simH, gl.NEAREST);

    // ── Blit helper ────────────────────────────────────────────────────
    const blit = (target: FBO | null) => {
      if (!target) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        gl.viewport(0, 0, target.width, target.height);
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };

    // ── Mouse / pointer state ──────────────────────────────────────────
    let mx = 0.5, my = 0.5, mdx = 0, mdy = 0, moved = false;
    let lx = 0.5, ly = 0.5;

    const onPtr = (e: PointerEvent) => {
      if (overHero) return;
      const nx = e.clientX / canvas.width;
      const ny = 1.0 - e.clientY / canvas.height;
      mdx = (nx - lx) * SPLAT_FORCE;
      mdy = (ny - ly) * SPLAT_FORCE;
      lx = mx = nx;
      ly = my = ny;
      moved = Math.abs(mdx) + Math.abs(mdy) > 0.05;
    };
    window.addEventListener('pointermove', onPtr);

    // ── Splat: inject velocity + dye ──────────────────────────────────
    const splat = (x: number, y: number, dx: number, dy: number) => {
      const asp = canvas.width / canvas.height;

      gl.useProgram(pSplat);
      gl.uniform2f(uSplat.texelSize!,  vel.read.texelSizeX, vel.read.texelSizeY);
      gl.uniform1f(uSplat.aspectRatio!, asp);
      gl.uniform2f(uSplat.point!,  x, y);
      gl.uniform1f(uSplat.radius!, SPLAT_RADIUS);

      // Velocity injection
      gl.uniform1i(uSplat.uTarget!, vel.read.attach(0));
      gl.uniform3f(uSplat.color!,   dx, dy, 0.0);
      blit(vel.write);
      vel.swap();

      // Dye injection — orange-to-blue tint based on speed
      const speed = Math.min(Math.sqrt(dx*dx + dy*dy) / SPLAT_FORCE, 1.0);
      gl.uniform1i(uSplat.uTarget!, dye.read.attach(0));
      gl.uniform3f(uSplat.color!,
        (0.90 + speed * 0.10) * 0.22,
        (0.30 + speed * 0.15) * 0.22,
        (0.00 + speed * 0.90) * 0.22);
      blit(dye.write);
      dye.swap();
    };

    // ── Navier-Stokes simulation step ──────────────────────────────────
    const step = (dt: number) => {
      gl.disable(gl.BLEND);

      // 1. Curl (vorticity field)
      gl.useProgram(pCurl);
      gl.uniform2f(uCurl.texelSize!, vel.read.texelSizeX, vel.read.texelSizeY);
      gl.uniform1i(uCurl.uVelocity!, vel.read.attach(0));
      blit(curlFBO);

      // 2. Vorticity confinement (adds swirling energy back)
      gl.useProgram(pVort);
      gl.uniform2f(uVort.texelSize!, vel.read.texelSizeX, vel.read.texelSizeY);
      gl.uniform1i(uVort.uVelocity!, vel.read.attach(0));
      gl.uniform1i(uVort.uCurl!,     curlFBO.attach(1));
      gl.uniform1f(uVort.curl!,      CURL);
      gl.uniform1f(uVort.dt!,        dt);
      blit(vel.write);
      vel.swap();

      // 3. Divergence (measures compressibility)
      gl.useProgram(pDiv);
      gl.uniform2f(uDiv.texelSize!, vel.read.texelSizeX, vel.read.texelSizeY);
      gl.uniform1i(uDiv.uVelocity!, vel.read.attach(0));
      blit(divFBO);

      // 4. Clear pressure
      gl.useProgram(pClear);
      gl.uniform2f(uClear.texelSize!, pres.read.texelSizeX, pres.read.texelSizeY);
      gl.uniform1i(uClear.uTexture!,  pres.read.attach(0));
      gl.uniform1f(uClear.value!,     0.8);
      blit(pres.write);
      pres.swap();

      // 5. Jacobi pressure solve (N iterations)
      gl.useProgram(pPres);
      gl.uniform2f(uPres.texelSize!,    vel.read.texelSizeX, vel.read.texelSizeY);
      gl.uniform1i(uPres.uDivergence!,  divFBO.attach(0));
      for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(uPres.uPressure!, pres.read.attach(1));
        blit(pres.write);
        pres.swap();
      }

      // 6. Gradient subtract (make velocity divergence-free)
      gl.useProgram(pGrad);
      gl.uniform2f(uGrad.texelSize!, vel.read.texelSizeX, vel.read.texelSizeY);
      gl.uniform1i(uGrad.uPressure!, pres.read.attach(0));
      gl.uniform1i(uGrad.uVelocity!, vel.read.attach(1));
      blit(vel.write);
      vel.swap();

      // 7. Advect velocity field (self-advection)
      gl.useProgram(pAdv);
      gl.uniform2f(uAdv.texelSize!,    vel.read.texelSizeX, vel.read.texelSizeY);
      gl.uniform2f(uAdv.dyeTexelSize!, vel.read.texelSizeX, vel.read.texelSizeY);
      gl.uniform1i(uAdv.uVelocity!,    vel.read.attach(0));
      gl.uniform1i(uAdv.uSource!,      vel.read.attach(0));
      gl.uniform1f(uAdv.dt!,           dt);
      gl.uniform1f(uAdv.dissipation!,  VEL_DISS);
      blit(vel.write);
      vel.swap();

      // 8. Advect dye (colour field) — different resolution from velocity
      gl.uniform2f(uAdv.dyeTexelSize!, dye.read.texelSizeX, dye.read.texelSizeY);
      gl.uniform1i(uAdv.uVelocity!,    vel.read.attach(0));
      gl.uniform1i(uAdv.uSource!,      dye.read.attach(1));
      gl.uniform1f(uAdv.dissipation!,  DYE_DISS);
      blit(dye.write);
      dye.swap();
    };

    // ── Render: glass refraction display pass ──────────────────────────
    const render = () => {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(pDisp);
      gl.uniform2f(uDisp.texelSize!, dye.read.texelSizeX, dye.read.texelSizeY);
      gl.uniform1i(uDisp.uDensity!,  dye.read.attach(0));
      gl.uniform1i(uDisp.uVelocity!, vel.read.attach(1));
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };

    // ── requestAnimationFrame loop ─────────────────────────────────────
    let rafId: number;
    let last = performance.now();

    const loop = () => {
      rafId = requestAnimationFrame(loop);
      if (overHero) return; // skip simulation + render when on hero

      const now = performance.now();
      const dt  = Math.min((now - last) / 1000, 0.016); // cap at 16ms
      last = now;

      if (moved) {
        splat(mx, my, mdx, mdy);
        moved = false;
      }

      step(dt);
      render();
    };
    loop();

    // ── Cleanup: delete all GPU resources ─────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPtr);
      window.removeEventListener('scroll',      onScroll);
      window.removeEventListener('resize',      onResize);

      // Delete textures + framebuffers
      [vel.read, vel.write, dye.read, dye.write,
       divFBO, curlFBO, pres.read, pres.write].forEach(f => {
        gl.deleteTexture(f.texture);
        gl.deleteFramebuffer(f.fbo);
      });

      // Delete shader programs
      [pClear, pSplat, pAdv, pCurl, pVort, pDiv, pPres, pGrad, pDisp]
        .forEach(p => gl.deleteProgram(p));

      // Delete VAO + buffers
      gl.deleteVertexArray(vao);
      gl.deleteBuffer(posBuf);
      gl.deleteBuffer(idxBuf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      aria-hidden="true"
    />
  );
}
