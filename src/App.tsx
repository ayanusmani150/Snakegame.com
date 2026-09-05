import { useCallback, useEffect, useRef, useState } from "react";
import SnakeCanvas from "./components/SnakeCanvas";
import Dpad from "./components/Dpad";
import Overlays from "./components/Overlays";
import {
  ControlsPanel,
  DifficultyPanel,
  FieldNotes,
  PanelShell,
  ScorePanel,
} from "./components/Panels";
import { sfx } from "./game/audio";
import {
  DIFFICULTIES,
  GRID,
  createEngine,
  paceLevel,
  queueDir,
  type DifficultyKey,
  type GameEngine,
  type GameEvent,
  type Status,
  type Vec,
} from "./game/engine";

const BEST_KEY = (d: DifficultyKey) => `neo-serpent-best-${d}`;
const MUTE_KEY = "neo-serpent-muted";

const DIRS: Record<string, Vec> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyW: { x: 0, y: -1 },
  KeyS: { x: 0, y: 1 },
  KeyA: { x: -1, y: 0 },
  KeyD: { x: 1, y: 0 },
};

function readBests(): Record<DifficultyKey, number> {
  const out: Record<DifficultyKey, number> = { garden: 0, strike: 0, frenzy: 0 };
  (Object.keys(out) as DifficultyKey[]).forEach((k) => {
    try {
      const v = Number(localStorage.getItem(BEST_KEY(k)));
      if (Number.isFinite(v) && v > 0) out[k] = v;
    } catch {
      /* storage unavailable */
    }
  });
  return out;
}

const FIREFLIES = [
  { top: "16%", left: "8%", s: 5, c: "#a5f84d", dur: "9s", delay: "0s", peak: 0.5 },
  { top: "28%", left: "88%", s: 4, c: "#ffb02e", dur: "12s", delay: "1.2s", peak: 0.45 },
  { top: "64%", left: "6%", s: 6, c: "#4fd8b8", dur: "11s", delay: "0.6s", peak: 0.4 },
  { top: "78%", left: "90%", s: 5, c: "#a5f84d", dur: "10s", delay: "2s", peak: 0.5 },
  { top: "10%", left: "55%", s: 4, c: "#c9ff70", dur: "13s", delay: "3s", peak: 0.35 },
  { top: "86%", left: "40%", s: 5, c: "#ffb02e", dur: "9.5s", delay: "1.8s", peak: 0.4 },
  { top: "45%", left: "95%", s: 4, c: "#8beedd", dur: "12.5s", delay: "0.9s", peak: 0.35 },
  { top: "52%", left: "3%", s: 4, c: "#ffd07a", dur: "10.5s", delay: "2.6s", peak: 0.4 },
  { top: "36%", left: "30%", s: 3, c: "#a5f84d", dur: "14s", delay: "4s", peak: 0.3 },
];

function Ambient() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_18%_0%,rgba(165,248,77,0.075),transparent_60%),radial-gradient(80%_60%_at_86%_100%,rgba(255,176,46,0.065),transparent_55%),linear-gradient(180deg,#081712_0%,#050d0b_100%)]" />
      <div className="bg-gridlines absolute inset-0" />
      {FIREFLIES.map((f, i) => (
        <span
          key={i}
          className="firefly"
          style={
            {
              top: f.top,
              left: f.left,
              width: f.s,
              height: f.s,
              background: f.c,
              boxShadow: `0 0 ${f.s * 2.5}px ${f.c}`,
              "--dur": f.dur,
              "--delay": f.delay,
              "--peak": f.peak,
            } as React.CSSProperties
          }
        />
      ))}
      <div className="scanlines absolute inset-0" />
      <div className="vignette absolute inset-0" />
    </div>
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9" aria-hidden>
      <rect x="2" y="22" width="6" height="6" fill="#5cb522" />
      <rect x="8" y="22" width="6" height="6" fill="#83dd33" />
      <rect x="14" y="22" width="6" height="6" fill="#83dd33" />
      <rect x="14" y="16" width="6" height="6" fill="#a5f84d" />
      <rect x="14" y="10" width="6" height="6" fill="#a5f84d" />
      <rect x="20" y="10" width="6" height="6" fill="#c9ff70" />
      <rect x="23" y="12" width="2" height="2" fill="#081712" />
      <rect x="26" y="20" width="4" height="4" fill="#ffb02e" />
    </svg>
  );
}

function StatusLamp({ status }: { status: Status }) {
  const map: Record<Status, { label: string; color: string }> = {
    idle: { label: "READY", color: "#7fae93" },
    running: { label: "LIVE", color: "#a5f84d" },
    paused: { label: "PAUSED", color: "#ffb02e" },
    over: { label: "DOWN", color: "#ff6259" },
  };
  const m = map[status];
  return (
    <div className="hidden items-center gap-2 rounded-md border border-pit-600 bg-pit-900/80 px-3 py-2 sm:flex">
      <span
        className={`h-2 w-2 rounded-full ${status === "running" ? "dot-pulse" : ""}`}
        style={{ background: m.color, color: m.color }}
      />
      <span className="font-display text-[8px] tracking-widest" style={{ color: m.color }}>
        {m.label}
      </span>
    </div>
  );
}

function SoundButton({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      className="btn-arcade flex h-9 w-9 items-center justify-center rounded-md border border-pit-600 bg-pit-900/80 text-moss-300 hover:text-venom-300"
    >
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" stroke="none" />
        {muted ? (
          <>
            <path d="m16 9 5 6" />
            <path d="m21 9-5 6" />
          </>
        ) : (
          <>
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 6a9 9 0 0 1 0 12" />
          </>
        )}
      </svg>
    </button>
  );
}

function HudChip({ label, value, color, popKey }: { label: string; value: React.ReactNode; color: string; popKey?: number }) {
  return (
    <div className="flex flex-col items-center rounded-md border border-pit-600 bg-pit-900/85 px-2 py-1.5">
      <span className="text-[9px] font-bold tracking-widest text-moss-400">{label}</span>
      <span key={popKey} className={`${popKey !== undefined ? "anim-pop" : ""} font-display text-[11px]`} style={{ color }}>
        {value}
      </span>
    </div>
  );
}

export default function App() {
  const [difficulty, setDifficulty] = useState<DifficultyKey>("strike");
  const [status, setStatus] = useState<Status>("idle");
  const [score, setScore] = useState(0);
  const [length, setLength] = useState(3);
  const [pace, setPace] = useState(1);
  const [bests, setBests] = useState<Record<DifficultyKey, number>>(readBests);
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [isNewBest, setIsNewBest] = useState(false);
  const [didWin, setDidWin] = useState(false);

  const engineRef = useRef<GameEngine>(createEngine("strike"));
  const statusRef = useRef(status);
  const difficultyRef = useRef(difficulty);
  const bestsRef = useRef(bests);
  statusRef.current = status;
  difficultyRef.current = difficulty;
  bestsRef.current = bests;

  useEffect(() => {
    sfx.muted = muted;
    try {
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {
      /* noop */
    }
  }, [muted]);

  const freshEngine = useCallback((d: DifficultyKey) => {
    const eng = createEngine(d);
    engineRef.current = eng;
    setScore(0);
    setLength(eng.snake.length);
    setPace(1);
    setIsNewBest(false);
    setDidWin(false);
    return eng;
  }, []);

  const start = useCallback(() => {
    freshEngine(difficultyRef.current);
    setStatus("running");
    sfx.start();
  }, [freshEngine]);

  const toMenu = useCallback(() => {
    freshEngine(difficultyRef.current);
    setStatus("idle");
    sfx.tap();
  }, [freshEngine]);

  const togglePause = useCallback(() => {
    const s = statusRef.current;
    if (s === "running") {
      engineRef.current.status = "paused";
      setStatus("paused");
      sfx.pause(true);
    } else if (s === "paused") {
      engineRef.current.status = "running";
      setStatus("running");
      sfx.pause(false);
    }
  }, []);

  const steer = useCallback(
    (d: Vec) => {
      const s = statusRef.current;
      if (s === "over") return;
      if (s === "idle") {
        freshEngine(difficultyRef.current);
        setStatus("running");
        sfx.start();
      }
      queueDir(engineRef.current, d);
    },
    [freshEngine],
  );

  const finishRun = useCallback((finalScore: number, won: boolean) => {
    setStatus("over");
    if (won) setDidWin(true);
    const d = difficultyRef.current;
    const prevBest = bestsRef.current[d];
    if (finalScore > prevBest) {
      setIsNewBest(true);
      const next = { ...bestsRef.current, [d]: finalScore };
      setBests(next);
      try {
        localStorage.setItem(BEST_KEY(d), String(finalScore));
      } catch {
        /* noop */
      }
    }
    if (won) {
      sfx.best();
    } else {
      sfx.die();
      if (finalScore > prevBest) window.setTimeout(() => sfx.best(), 420);
    }
  }, []);

  const onEventRef = useRef<(e: GameEvent) => void>(() => {});
  onEventRef.current = (e: GameEvent) => {
    const eng = engineRef.current;
    if (e === "eat") {
      setScore(eng.score);
      setLength(eng.snake.length);
      setPace(paceLevel(eng));
      sfx.eat();
    } else if (e === "win") {
      setScore(eng.score);
      setLength(eng.snake.length);
      finishRun(eng.score, true);
    } else {
      setScore(eng.score);
      finishRun(eng.score, false);
    }
  };

  const pickDifficulty = useCallback(
    (k: DifficultyKey) => {
      if (k === difficultyRef.current) return;
      setDifficulty(k);
      difficultyRef.current = k;
      freshEngine(k);
      setStatus("idle");
      sfx.tap();
    },
    [freshEngine],
  );

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const c = e.code;
      if (DIRS[c]) {
        e.preventDefault();
        steer(DIRS[c]);
        return;
      }
      if (c === "Space") {
        e.preventDefault();
        const s = statusRef.current;
        if (s === "idle" || s === "over") start();
        else togglePause();
      } else if (c === "Enter") {
        e.preventDefault();
        const s = statusRef.current;
        if (s === "idle" || s === "over") start();
        else if (s === "paused") togglePause();
      } else if (c === "KeyR") {
        if (statusRef.current !== "idle") start();
      } else if (c === "KeyM") {
        toggleMute();
      } else if (c === "KeyP" || c === "Escape") {
        togglePause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [steer, start, togglePause, toggleMute]);

  // auto-pause when tab hidden
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && statusRef.current === "running") togglePause();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [togglePause]);

  // touch swipe on the board
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const st = touchRef.current;
    if (!st) return;
    const t = e.touches[0];
    const dx = t.clientX - st.x;
    const dy = t.clientY - st.y;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) steer({ x: dx > 0 ? 1 : -1, y: 0 });
    else steer({ x: 0, y: dy > 0 ? 1 : -1 });
    touchRef.current = { x: t.clientX, y: t.clientY };
  };

  const accent = DIFFICULTIES[difficulty].accent;
  const best = bests[difficulty];

  const dpadCenter = () => {
    const s = statusRef.current;
    if (s === "running" || s === "paused") togglePause();
    else start();
  };

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <Ambient />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-6 pt-5 sm:px-6">
        {/* header */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <h1
                className="font-display text-[13px] text-venom-300 sm:text-sm"
                style={{ textShadow: "0 0 18px rgba(165,248,77,0.4)" }}
              >
                NEO SERPENT
              </h1>
              <p className="mt-0.5 text-[10px] font-medium tracking-[0.2em] text-moss-400">
                GRID ARCADE · {GRID}×{GRID}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusLamp status={status} />
            <SoundButton muted={muted} onToggle={toggleMute} />
          </div>
        </header>

        <div className="ticker mt-4 h-[3px] w-full" aria-hidden />

        <main className="mt-5 grid flex-1 items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)_250px]">
          {/* left column */}
          <aside className="hidden flex-col gap-4 lg:flex">
            <ScorePanel
              score={score}
              best={best}
              length={length}
              pace={pace}
              accent={accent}
              isNewBest={isNewBest}
            />
            <DifficultyPanel value={difficulty} bests={bests} onSelect={pickDifficulty} />
          </aside>

          {/* board column */}
          <section className="flex flex-col items-center gap-4">
            {/* mobile HUD */}
            <div className="grid w-full max-w-[440px] grid-cols-[1fr_1fr_1fr_auto] gap-2 sm:max-w-[520px] lg:hidden">
              <HudChip label="SCORE" value={score} color="#c9ff70" popKey={score} />
              <HudChip label="BEST" value={best} color="#ffd07a" />
              <HudChip label="LENGTH" value={length} color="#8beedd" />
              <button
                type="button"
                onClick={() => {
                  const s = statusRef.current;
                  if (s === "running" || s === "paused") togglePause();
                  else start();
                }}
                aria-label={status === "running" ? "Pause" : "Play"}
                className="btn-arcade flex items-center justify-center rounded-md border border-pit-600 bg-pit-900/85 px-3 text-moss-200"
              >
                {status === "running" ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-fruit-400" fill="currentColor" aria-hidden>
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-venom-300" fill="currentColor" aria-hidden>
                    <path d="M7 4.8v14.4a1 1 0 0 0 1.52.85l11.2-7.2a1 1 0 0 0 0-1.7L8.52 3.95A1 1 0 0 0 7 4.8z" />
                  </svg>
                )}
              </button>
            </div>

            {/* board frame */}
            <div
              className="relative w-full max-w-[440px] sm:max-w-[520px] lg:max-w-[560px]"
              style={{ touchAction: "none" }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
            >
              <div className="relative rounded-lg border border-pit-600 bg-pit-900 p-2 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.9)]">
                <i aria-hidden className="pointer-events-none absolute -top-1 -left-1 h-4 w-4 rounded-tl border-t-2 border-l-2" style={{ borderColor: accent }} />
                <i aria-hidden className="pointer-events-none absolute -top-1 -right-1 h-4 w-4 rounded-tr border-t-2 border-r-2" style={{ borderColor: accent }} />
                <i aria-hidden className="pointer-events-none absolute -bottom-1 -left-1 h-4 w-4 rounded-bl border-b-2 border-l-2" style={{ borderColor: accent }} />
                <i aria-hidden className="pointer-events-none absolute -bottom-1 -right-1 h-4 w-4 rounded-br border-b-2 border-r-2" style={{ borderColor: accent }} />

                <div className="relative overflow-hidden rounded-md">
                  <SnakeCanvas engineRef={engineRef} onEventRef={onEventRef} />
                  <Overlays
                    status={status}
                    score={score}
                    best={best}
                    length={length}
                    isNewBest={isNewBest}
                    didWin={didWin}
                    difficulty={difficulty}
                    onStart={start}
                    onResume={togglePause}
                    onRestart={start}
                    onMenu={toMenu}
                    onDifficulty={pickDifficulty}
                  />
                </div>

                <div className="flex items-center justify-between px-1 pt-2">
                  <span className="font-display text-[8px] tracking-widest" style={{ color: accent }}>
                    {DIFFICULTIES[difficulty].tag}
                  </span>
                  <span className="font-display text-[8px] tracking-widest text-moss-400">
                    PACE {pace} · {GRID}×{GRID}
                  </span>
                </div>
              </div>
            </div>

            {/* touch controls */}
            <div className="flex flex-col items-center gap-2 lg:hidden">
              <Dpad status={status} onDir={steer} onCenter={dpadCenter} />
              <p className="text-[10px] text-moss-500">swipe the board or tap the pad</p>
            </div>
          </section>

          {/* right column */}
          <aside className="hidden flex-col gap-4 lg:flex">
            <ControlsPanel />
            <FieldNotes />
          </aside>
        </main>

        <footer className="mt-6 hidden items-center justify-between gap-4 text-[11px] text-moss-500 md:flex">
          <p className="flex items-center gap-2">
            <kbd className="key">SPACE</kbd> pause
            <span className="text-pit-500">·</span>
            <kbd className="key">ENTER</kbd> restart
            <span className="text-pit-500">·</span>
            <kbd className="key">M</kbd> sound
          </p>
          <p className="font-display text-[8px] tracking-widest text-moss-500">
            NEO SERPENT — BUILT FOR KEYBOARDS &amp; THUMBS
          </p>
        </footer>
      </div>
    </div>
  );
}
