import { useEffect, useRef } from "react";
import { GRID, step, type GameEngine, type GameEvent, type Vec } from "../game/engine";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
}

interface FloatText {
  x: number;
  y: number;
  life: number;
  max: number;
  text: string;
  color: string;
}

interface Fx {
  particles: Particle[];
  texts: FloatText[];
  shake: number;
}

interface Props {
  engineRef: { current: GameEngine };
  onEventRef: { current: (e: GameEvent) => void };
}

function rrect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function spawnBurst(fx: Fx, at: Vec, colors: string[], count: number): void {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 1.5 + Math.random() * 5.5;
    const life = 460 + Math.random() * 340;
    fx.particles.push({
      x: at.x + 0.5,
      y: at.y + 0.5,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life,
      max: life,
      size: 0.09 + Math.random() * 0.13,
      color: colors[i % colors.length],
    });
  }
  if (fx.particles.length > 240) fx.particles.splice(0, fx.particles.length - 240);
}

function drawFood(
  ctx: CanvasRenderingContext2D,
  f: Vec,
  cell: number,
  time: number,
): void {
  const pulse = 1 + Math.sin(time / 230) * 0.09;
  const cx = (f.x + 0.5) * cell;
  const cy = (f.y + 0.5) * cell;
  const glow = ctx.createRadialGradient(cx, cy, cell * 0.1, cx, cy, cell * 1.15);
  glow.addColorStop(0, "rgba(255,176,46,0.30)");
  glow.addColorStop(1, "rgba(255,176,46,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(cx - cell * 1.2, cy - cell * 1.2, cell * 2.4, cell * 2.4);

  const r = cell * 0.3 * pulse;
  ctx.fillStyle = "#ffb02e";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.arc(cx - r * 0.3, cy - r * 0.35, r * 0.22, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(cx + r * 0.15, cy - r * 0.95);
  ctx.rotate(-0.5);
  ctx.fillStyle = "#83dd33";
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.45, r * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function draw(
  ctx: CanvasRenderingContext2D,
  size: number,
  eng: GameEngine,
  fx: Fx,
  dt: number,
): void {
  const cell = size / GRID;
  ctx.save();

  if (fx.shake > 0.01) {
    const m = fx.shake * fx.shake * 9;
    ctx.translate((Math.random() - 0.5) * 2 * m, (Math.random() - 0.5) * 2 * m);
  }

  // board
  const bg = ctx.createLinearGradient(0, 0, 0, size);
  bg.addColorStop(0, "#0e2720");
  bg.addColorStop(1, "#091a15");
  ctx.fillStyle = bg;
  ctx.fillRect(-14, -14, size + 28, size + 28);

  ctx.fillStyle = "rgba(255,255,255,0.015)";
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if ((x + y) % 2 === 1) ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }

  ctx.strokeStyle = "rgba(165,248,77,0.05)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < GRID; i++) {
    ctx.moveTo(i * cell, 0);
    ctx.lineTo(i * cell, size);
    ctx.moveTo(0, i * cell);
    ctx.lineTo(size, i * cell);
  }
  ctx.stroke();

  ctx.strokeStyle = "rgba(165,248,77,0.16)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);

  drawFood(ctx, eng.food, cell, eng.time);

  // snake — interpolated between ticks for smooth gliding
  const t = eng.status === "running" ? Math.min(1, eng.elapsed / eng.tickMs) : 1;
  const n = eng.snake.length;
  for (let i = n - 1; i >= 0; i--) {
    const to = eng.snake[i];
    const from = eng.prev[i] ?? eng.prev[eng.prev.length - 1] ?? to;
    const x = (from.x + (to.x - from.x) * t + 0.5) * cell;
    const y = (from.y + (to.y - from.y) * t + 0.5) * cell;

    if (i === 0) {
      ctx.save();
      ctx.shadowColor = "rgba(165,248,77,0.55)";
      ctx.shadowBlur = cell * 0.6;
      ctx.fillStyle = "#d3ff84";
      rrect(ctx, x - cell * 0.42, y - cell * 0.42, cell * 0.84, cell * 0.84, cell * 0.3);
      ctx.fill();
      ctx.restore();

      const d = eng.dir;
      for (const s of [-1, 1]) {
        const ox = d.x * cell * 0.16 + (d.y !== 0 ? s * cell * 0.18 : 0);
        const oy = d.y * cell * 0.16 + (d.x !== 0 ? s * cell * 0.18 : 0);
        ctx.fillStyle = "#f4ffe8";
        ctx.beginPath();
        ctx.arc(x + ox, y + oy, cell * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0a1a14";
        ctx.beginPath();
        ctx.arc(x + ox + d.x * cell * 0.045, y + oy + d.y * cell * 0.045, cell * 0.05, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      const frac = n > 1 ? i / (n - 1) : 0;
      const pad = cell * (0.1 + frac * 0.07);
      const hue = 92 + frac * 50;
      const sat = 88 - frac * 35;
      const lgt = 63 - frac * 30;
      ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lgt}%)`;
      rrect(ctx, x - cell / 2 + pad, y - cell / 2 + pad, cell - pad * 2, cell - pad * 2, cell * 0.26);
      ctx.fill();
    }
  }

  // particles
  fx.particles = fx.particles.filter((p) => (p.life -= dt) > 0);
  for (const p of fx.particles) {
    p.x += (p.vx * dt) / 1000;
    p.y += (p.vy * dt) / 1000;
    p.vy += (3 * dt) / 1000;
    const a = Math.max(0, p.life / p.max);
    const s = p.size * cell * a + cell * 0.04;
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x * cell - s / 2, p.y * cell - s / 2, s, s);
  }
  ctx.globalAlpha = 1;

  // floating score texts
  fx.texts = fx.texts.filter((p) => (p.life -= dt) > 0);
  for (const p of fx.texts) {
    p.y -= (1.4 * dt) / 1000;
    const a = Math.max(0, p.life / p.max);
    ctx.globalAlpha = a;
    ctx.font = `700 ${Math.round(cell * 0.46)}px "Space Grotesk", sans-serif`;
    ctx.textAlign = "center";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(5,13,11,0.85)";
    ctx.strokeText(p.text, p.x * cell, p.y * cell);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x * cell, p.y * cell);
  }
  ctx.globalAlpha = 1;

  // death flash
  if (eng.status === "over") {
    const k = Math.max(0, 1 - (eng.time - eng.deadAt) / 650);
    if (k > 0) {
      ctx.fillStyle = `rgba(230,57,47,${0.28 * k})`;
      ctx.fillRect(0, 0, size, size);
    }
  }

  // vignette
  const vg = ctx.createRadialGradient(
    size / 2, size * 0.42, size * 0.25,
    size / 2, size / 2, size * 0.78,
  );
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(3,9,7,0.42)");
  ctx.fillStyle = vg;
  ctx.fillRect(-14, -14, size + 28, size + 28);

  ctx.restore();
}

export default function SnakeCanvas({ engineRef, onEventRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fx: Fx = { particles: [], texts: [], shake: 0 };
    const sizeRef = { current: 0 };

    const resize = () => {
      const s = wrap.clientWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sizeRef.current = s;
      canvas.width = Math.max(1, Math.round(s * dpr));
      canvas.height = Math.max(1, Math.round(s * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      const eng = engineRef.current;
      eng.time += dt;

      if (eng.status === "running") {
        eng.elapsed += dt;
        let guard = 0;
        while (eng.status === "running" && eng.elapsed >= eng.tickMs && guard++ < 5) {
          eng.prev = eng.snake.map((s) => ({ ...s }));
          eng.elapsed -= eng.tickMs;
          const ev = step(eng);
          if (ev === "eat") {
            spawnBurst(fx, eng.snake[0], ["#ffb02e", "#c9ff70", "#ffd07a"], 14);
            fx.texts.push({
              x: eng.snake[0].x + 0.5,
              y: eng.snake[0].y + 0.15,
              life: 850,
              max: 850,
              text: "+10",
              color: "#c9ff70",
            });
          } else if (ev === "win") {
            spawnBurst(fx, eng.snake[0], ["#4fd8b8", "#c9ff70"], 26);
            fx.texts.push({
              x: GRID / 2,
              y: GRID / 2,
              life: 1200,
              max: 1200,
              text: "CLEAR!",
              color: "#4fd8b8",
            });
          } else if (ev === "over") {
            fx.shake = 1;
            spawnBurst(fx, eng.snake[0], ["#ff6259", "#ff9a8f", "#ffb02e"], 20);
          }
          if (ev) onEventRef.current(ev);
        }
      }

      if (fx.shake > 0) fx.shake = Math.max(0, fx.shake - dt / 620);
      if (sizeRef.current > 0) draw(ctx, sizeRef.current, eng, fx, dt);
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [engineRef, onEventRef]);

  return (
    <div ref={wrapRef} className="relative aspect-square w-full">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Snake game board"
        className="block h-full w-full"
      />
    </div>
  );
}
