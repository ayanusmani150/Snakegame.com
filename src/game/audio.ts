type Wave = OscillatorType;

interface ToneOpts {
  type?: Wave;
  vol?: number;
  slide?: number;
  delay?: number;
}

/** Tiny synthesized arcade blips — no assets, created lazily on first gesture. */
class Sfx {
  muted = false;
  private ctx: AudioContext | null = null;

  private ensure(): AudioContext | null {
    try {
      if (!this.ctx) {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }

  private tone(freq: number, dur: number, opts: ToneOpts = {}): void {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const { type = "square", vol = 0.05, slide, delay = 0 } = opts;
    try {
      const t0 = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch {
      /* audio is decoration — never crash the game */
    }
  }

  eat(): void {
    this.tone(430, 0.09, { slide: 860 });
    this.tone(1290, 0.07, { type: "triangle", vol: 0.032, delay: 0.05 });
  }

  die(): void {
    this.tone(320, 0.5, { type: "sawtooth", slide: 50, vol: 0.055 });
    this.tone(180, 0.42, { slide: 38, vol: 0.04, delay: 0.07 });
  }

  start(): void {
    [392, 523, 659, 784].forEach((f, i) =>
      this.tone(f, 0.09, { vol: 0.042, delay: i * 0.065 }),
    );
  }

  pause(on: boolean): void {
    this.tone(on ? 330 : 262, 0.08, { vol: 0.04 });
    if (on) this.tone(220, 0.09, { vol: 0.04, delay: 0.08 });
  }

  best(): void {
    [523, 659, 784, 1046].forEach((f, i) =>
      this.tone(f, 0.11, { type: "triangle", vol: 0.045, delay: i * 0.07 }),
    );
  }

  tap(): void {
    this.tone(240, 0.05, { type: "triangle", vol: 0.025 });
  }
}

export const sfx = new Sfx();
