import type { ReactNode } from "react";
import {
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  type DifficultyKey,
  type Status,
} from "../game/engine";

interface Props {
  status: Status;
  score: number;
  best: number;
  length: number;
  isNewBest: boolean;
  didWin: boolean;
  difficulty: DifficultyKey;
  onStart: () => void;
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
  onDifficulty: (k: DifficultyKey) => void;
}

function ArcadeButton({
  children,
  onClick,
  variant = "primary",
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "ghost";
}) {
  const base =
    "btn-arcade inline-flex items-center justify-center gap-2 rounded-md px-6 py-3.5 font-display text-[10px] tracking-wider";
  const styles =
    variant === "primary"
      ? "bg-venom-400 text-pit-950 shadow-[0_4px_0_#5cb522,0_10px_24px_-8px_rgba(165,248,77,0.5)]"
      : "border border-pit-500 bg-pit-800/80 text-moss-200 shadow-[0_4px_0_rgba(0,0,0,0.45)] hover:border-venom-500";
  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

function SnakeMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-11 w-11" aria-hidden>
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

function DifficultyPicker({
  value,
  onPick,
}: {
  value: DifficultyKey;
  onPick: (k: DifficultyKey) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {DIFFICULTY_ORDER.map((k) => {
        const d = DIFFICULTIES[k];
        const active = k === value;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onPick(k)}
            className={`btn-arcade rounded-md border px-2 py-2.5 ${
              active ? "border-transparent bg-pit-700/80" : "border-pit-700 bg-pit-800/60"
            }`}
            style={active ? { boxShadow: `inset 0 0 0 2px ${d.accent}` } : undefined}
          >
            <span className="block text-xs font-bold text-moss-100">{d.label}</span>
            <span className="mt-1 block font-display text-[7px] tracking-widest" style={{ color: d.accent }}>
              {d.tag}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: ReactNode; color: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-pit-700/70 py-1.5 last:border-0">
      <span className="text-[10px] font-semibold tracking-widest text-moss-400">{label}</span>
      <span className="font-display text-[11px]" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

export default function Overlays(props: Props) {
  const { status } = props;
  if (status === "running") return null;

  return (
    <div className="anim-fade absolute inset-0 z-20 overflow-y-auto rounded-md bg-pit-950/82 backdrop-blur-[3px]">
      <div className="flex min-h-full items-center justify-center p-4">
      {status === "idle" && (
        <div className="anim-rise m-auto flex w-full max-w-xs flex-col items-center text-center">
          <SnakeMark />
          <h2
            className="mt-3 font-display text-[22px] leading-tight text-venom-300 sm:text-2xl"
            style={{ textShadow: "0 0 24px rgba(165,248,77,0.45)" }}
          >
            NEO
            <br />
            SERPENT
          </h2>
          <p className="mt-2 text-xs text-moss-300">Eat. Grow. Don&apos;t bite yourself.</p>

          <div className="mt-5 w-full">
            <p className="mb-2 font-display text-[8px] tracking-widest text-moss-400">SELECT VENOM</p>
            <DifficultyPicker value={props.difficulty} onPick={props.onDifficulty} />
          </div>

          <div className="mt-5">
            <ArcadeButton onClick={props.onStart}>▶ START RUN</ArcadeButton>
          </div>
          <p className="mt-3 text-[10px] text-moss-500">
            or press <kbd className="key">ENTER</kbd> — arrows / WASD to steer
          </p>
        </div>
      )}

      {status === "paused" && (
        <div className="anim-rise m-auto flex w-full max-w-xs flex-col items-center text-center">
          <h2 className="font-display text-xl text-fruit-400" style={{ textShadow: "0 0 20px rgba(255,176,46,0.4)" }}>
            PAUSED
          </h2>
          <p className="mt-2 text-xs text-moss-300">The serpent holds its breath.</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <ArcadeButton onClick={props.onResume}>RESUME</ArcadeButton>
            <ArcadeButton variant="ghost" onClick={props.onRestart}>
              RESTART
            </ArcadeButton>
          </div>
          <p className="mt-4 text-[10px] text-moss-500">
            <kbd className="key">SPACE</kbd> to resume
          </p>
        </div>
      )}

      {status === "over" && (
        <div className="anim-rise-late m-auto flex w-full max-w-xs flex-col items-center text-center">
          <h2
            className={`font-display text-[20px] sm:text-2xl ${props.didWin ? "text-signal-400" : "text-blood-400"}`}
            style={{
              textShadow: props.didWin
                ? "0 0 22px rgba(79,216,184,0.45)"
                : "0 0 22px rgba(255,98,89,0.45)",
            }}
          >
            {props.didWin ? "BOARD CLEARED" : "GAME OVER"}
          </h2>

          {props.isNewBest && (
            <span className="anim-wiggle mt-3 inline-block rounded-sm bg-fruit-400 px-2.5 py-1.5 font-display text-[8px] tracking-widest text-pit-950 shadow-[0_0_20px_rgba(255,176,46,0.5)]">
              ★ NEW BEST ★
            </span>
          )}

          <p className="mt-4 font-display text-[8px] tracking-widest text-moss-400">FINAL SCORE</p>
          <p
            className="mt-1 font-display text-3xl text-venom-300"
            style={{ textShadow: "0 0 22px rgba(165,248,77,0.4)" }}
          >
            {props.score}
          </p>

          <div className="mt-4 w-full rounded-md border border-pit-700 bg-pit-900/80 px-4 py-2">
            <StatRow label="BEST" value={props.best} color="#ffd07a" />
            <StatRow label="LENGTH" value={props.length} color="#8beedd" />
            <StatRow
              label="VENOM"
              value={DIFFICULTIES[props.difficulty].tag}
              color={DIFFICULTIES[props.difficulty].accent}
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <ArcadeButton onClick={props.onStart}>↻ PLAY AGAIN</ArcadeButton>
            <ArcadeButton variant="ghost" onClick={props.onMenu}>
              MENU
            </ArcadeButton>
          </div>
          <p className="mt-3 text-[10px] text-moss-500">
            <kbd className="key">ENTER</kbd> to run it back
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
