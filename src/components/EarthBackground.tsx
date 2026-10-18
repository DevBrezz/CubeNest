import { useEffect, useRef } from 'react';

/**
 * Lightweight space + rotating Earth background.
 * Uses 2D canvas with spherical shading for a 3D appearance without heavy WebGL deps.
 * Respects prefers-reduced-motion.
 */
export function EarthBackground({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let angle = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;

    type Star = { x: number; y: number; r: number; a: number; tw: number };
    type Shooting = { x: number; y: number; vx: number; vy: number; life: number };
    let stars: Star[] = [];
    let shooting: Shooting[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(180, Math.floor((w * h) / 9000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.3,
        a: Math.random() * 0.6 + 0.2,
        tw: Math.random() * Math.PI * 2,
      }));
    };

    const drawEarth = (cx: number, cy: number, radius: number, rot: number) => {
      // Atmosphere glow
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius * 1.35);
      glow.addColorStop(0, 'rgba(56, 140, 220, 0.0)');
      glow.addColorStop(0.55, 'rgba(56, 140, 220, 0.12)');
      glow.addColorStop(1, 'rgba(10, 20, 40, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Sphere base ocean
      const ocean = ctx.createRadialGradient(cx - radius * 0.35, cy - radius * 0.35, radius * 0.1, cx, cy, radius);
      ocean.addColorStop(0, '#3d8fd4');
      ocean.addColorStop(0.55, '#1a5f9e');
      ocean.addColorStop(1, '#0a2a4a');
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = ocean;
      ctx.fill();

      // Land bands (procedural, rotates with angle)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();
      for (let i = 0; i < 14; i++) {
        const base = rot * 40 + i * 47;
        const lx = cx + Math.sin(base * 0.08) * radius * 0.55;
        const ly = cy - radius * 0.7 + (i / 14) * radius * 1.5;
        const rw = radius * (0.25 + (i % 3) * 0.12);
        const rh = radius * (0.12 + (i % 2) * 0.08);
        ctx.fillStyle = i % 2 === 0 ? 'rgba(45, 120, 55, 0.75)' : 'rgba(70, 140, 60, 0.55)';
        ctx.beginPath();
        ctx.ellipse(lx, ly, rw, rh, Math.sin(base) * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      // Specular highlight
      const spec = ctx.createRadialGradient(cx - radius * 0.4, cy - radius * 0.45, 0, cx - radius * 0.2, cy - radius * 0.2, radius * 0.7);
      spec.addColorStop(0, 'rgba(255,255,255,0.22)');
      spec.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = spec;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      // Shadow limb
      const shade = ctx.createRadialGradient(cx + radius * 0.4, cy + radius * 0.2, radius * 0.2, cx, cy, radius);
      shade.addColorStop(0, 'rgba(0,0,0,0)');
      shade.addColorStop(0.7, 'rgba(0,0,0,0.15)');
      shade.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Thin rim
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(120, 190, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      // Space gradient
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#05060c');
      bg.addColorStop(0.5, '#0a0e1a');
      bg.addColorStop(1, '#0a0a0a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Stars
      for (const s of stars) {
        s.tw += 0.02;
        const alpha = s.a * (0.7 + 0.3 * Math.sin(s.tw));
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Occasional shooting star
      if (!reduceMotion && Math.random() < 0.008 && shooting.length < 2) {
        shooting.push({
          x: Math.random() * w * 0.8,
          y: Math.random() * h * 0.4,
          vx: 4 + Math.random() * 3,
          vy: 1.5 + Math.random() * 1.5,
          life: 1,
        });
      }
      shooting = shooting.filter((sh) => {
        sh.x += sh.vx;
        sh.y += sh.vy;
        sh.life -= 0.02;
        if (sh.life <= 0) return false;
        ctx.strokeStyle = `rgba(200,220,255,${sh.life * 0.8})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(sh.x - sh.vx * 4, sh.y - sh.vy * 4);
        ctx.stroke();
        return true;
      });

      const radius = Math.min(w, h) * (w < 640 ? 0.22 : 0.18);
      const cx = w * (w < 640 ? 0.78 : 0.82);
      const cy = h * (w < 640 ? 0.28 : 0.35);
      drawEarth(cx, cy, radius, angle);

      if (!reduceMotion) {
        angle += 0.004; // left → right rotation feel via land drift
        raf = requestAnimationFrame(frame);
      }
    };

    resize();
    frame();
    if (reduceMotion) {
      // single static frame already drawn
    }
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`earth-bg-canvas ${className}`}
      aria-hidden="true"
    />
  );
}
