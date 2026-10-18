import { useEffect, useRef } from 'react';

/** Animated solar system: sun + orbiting planets. Respects prefers-reduced-motion. */
export function SolarSystemBackground({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let t = 0;

    type Star = { x: number; y: number; r: number; a: number };
    let stars: Star[] = [];

    const planets = [
      { dist: 0.08, size: 0.012, speed: 1.8, color: '#b0b0b0', trail: 'rgba(176,176,176,0.15)' }, // mercury
      { dist: 0.12, size: 0.018, speed: 1.35, color: '#e8cda0', trail: 'rgba(232,205,160,0.12)' }, // venus
      { dist: 0.17, size: 0.02, speed: 1.0, color: '#4f8fba', trail: 'rgba(79,143,186,0.15)' }, // earth
      { dist: 0.22, size: 0.016, speed: 0.8, color: '#c1440e', trail: 'rgba(193,68,14,0.12)' }, // mars
      { dist: 0.32, size: 0.04, speed: 0.45, color: '#d4a574', trail: 'rgba(212,165,116,0.1)' }, // jupiter
      { dist: 0.42, size: 0.032, speed: 0.32, color: '#e6d5a8', trail: 'rgba(230,213,168,0.1)' }, // saturn
      { dist: 0.52, size: 0.022, speed: 0.22, color: '#7ec8e3', trail: 'rgba(126,200,227,0.08)' }, // uranus
      { dist: 0.60, size: 0.02, speed: 0.16, color: '#4b6cb7', trail: 'rgba(75,108,183,0.08)' }, // neptune
    ];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.min(160, Math.floor((w * h) / 10000)) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.3,
        a: Math.random() * 0.5 + 0.2,
      }));
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      const bg = ctx.createRadialGradient(w * 0.55, h * 0.45, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
      bg.addColorStop(0, '#0c1020');
      bg.addColorStop(0.5, '#080a12');
      bg.addColorStop(1, '#050508');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      for (const s of stars) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${s.a})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      const cx = w * (w < 640 ? 0.72 : 0.7);
      const cy = h * 0.42;
      const scale = Math.min(w, h) * 0.9;

      // orbit rings
      for (const p of planets) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.arc(cx, cy, p.dist * scale, 0, Math.PI * 2);
        ctx.stroke();
      }

      // sun
      const sunR = Math.min(w, h) * 0.045;
      const sunGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunR * 3);
      sunGlow.addColorStop(0, 'rgba(255,200,50,0.55)');
      sunGlow.addColorStop(0.4, 'rgba(255,140,20,0.2)');
      sunGlow.addColorStop(1, 'rgba(255,100,0,0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, sunR * 3, 0, Math.PI * 2);
      ctx.fill();
      const sunCore = ctx.createRadialGradient(cx - sunR * 0.3, cy - sunR * 0.3, 0, cx, cy, sunR);
      sunCore.addColorStop(0, '#fff6c8');
      sunCore.addColorStop(0.5, '#ffb020');
      sunCore.addColorStop(1, '#ff6a00');
      ctx.fillStyle = sunCore;
      ctx.beginPath();
      ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
      ctx.fill();

      // planets
      planets.forEach((p, i) => {
        const angle = t * p.speed + i * 0.9;
        const px = cx + Math.cos(angle) * p.dist * scale;
        const py = cy + Math.sin(angle) * p.dist * scale * 0.55; // slight ellipse
        const pr = p.size * scale;
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
        // saturn ring
        if (i === 5) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(230,213,168,0.5)';
          ctx.lineWidth = 1.5;
          ctx.ellipse(px, py, pr * 2.1, pr * 0.6, -0.4, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      if (!reduce) {
        t += 0.008;
        raf = requestAnimationFrame(frame);
      }
    };

    resize();
    frame();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={`earth-bg-canvas ${className}`} aria-hidden="true" />;
}
