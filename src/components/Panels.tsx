import type { ReactNode } from "react";
import {
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  type DifficultyKey,
} from "../game/engine";

export function PanelShell({
  title,
  accent = "#a5f84d",
  children,
  className = "",
}: {
  title: string;
  accent?: string;
  children: ReactNode;
  className?: string;
}) {
  const tick = "pointer-events-none absolute h-2.5 w-2.5";
  return (
    <section className={`relative rounded-md border border-pit-600 bg-pit-900/85 ${className}`}>
      <i aria-hidden className={`${tick} -top-px -left-px border-t-2 border-l-2`} style={{ borderColor: accent }} />
      <i aria-hidden className={`${tick} -top-px -right-px border-t-2 border-r-2`} style={{ borderColor: accent }} />
      <i aria-hidden className={`${tick} -bottom-px -left-px border-b-2 border-l-2`} style={{ borderColor: accent }} />
      <i aria-hidden className={`${tick} -bottom-px -right-px border-b-2 border-r-2`} style={{ borderColor: accent }} />
      <header className="flex items-center gap-2 border-b border-pit-700 px-3.5 py-2.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
        <h3 className="font-display text-[9px] tracking-widest text-moss-300">{title}</h3>
      </header>
      <div className="p-3.5">{children}</div>
    </section>
  );
}

export function ScorePanel({
  score,
  best,
  length,
  pace,
  accent,
  isNewBest,
}: {
  score: number;
  best: number;
  length: number;
  pace: number;
  accent: string;
  isNewBest: boolean;
}) {
  return (
    <PanelShell title="TELEMETRY" accent={accent}>
      <p className="font-display text-[8px] tracking-widest text-moss-400">SCORE</p>
      <p
        key={score}
        className="anim-pop mt-1 font-display text-[26px] leading-none text-venom-300"
        style={{ textShadow: "0 0 18px rgba(165,248,77,0.35)" }}
      >
        {String(score).padStart(4, "0")}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-sm border border-pit-700 bg-pit-800/70 px-2.5 py-2">
          <p className="text-[10px] font-semibold tracking-widest text-moss-400">BEST</p>
          <p className={`mt-0.5 font-display text-sm ${isNewBest ? "text-fruit-400" : "text-fruit-300"}`}>
            {best}
          </p>
        </div>
        <div className="rounded-sm border border-pit-700 bg-pit-800/70 px-2.5 py-2">
          <p className="text-[10px] font-semibold tracking-widest text-moss-400">LENGTH</p>
          <p className="mt-0.5 font-display text-sm text-signal-300">{length}</p>
        </div>
      </div>

      <p className="mt-4 text-[10px] font-semibold tracking-widest text-moss-400">PACE</p>
      <div className="mt-1.5 flex gap-1">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="h-3 flex-1 rounded-[2px] transition-colors duration-300"
            style={{
              background: i < pace ? accent : "#123128",
              boxShadow: i < pace ? `0 0 8px ${accent}55` : "none",
            }}
          />
        ))}
      </div>
    </PanelShell>
  );
}

export function DifficultyPanel({
  value,
  bests,
  onSelect,
}: {
  value: DifficultyKey;
  bests: Record<DifficultyKey, number>;
  onSelect: (k: DifficultyKey) => void;
}) {
  return (
    <PanelShell title="VENOM LEVEL" accent="#ffb02e">
      <div className="flex flex-col gap-2">
        {DIFFICULTY_ORDER.map((k) => {
          const d = DIFFICULTIES[k];
          const active = k === value;
          return (
            <button
              key={k}
              type="button"
              onClick={() => onSelect(k)}
              className={`btn-arcade group flex items-center justify-between gap-2 rounded-md border px-3 py-2.5 text-left ${
                active
                  ? "border-transparent bg-pit-700/80"
                  : "border-pit-700 bg-pit-800/50 hover:bg-pit-800"
              }`}
              style={active ? { boxShadow: `inset 0 0 0 2px ${d.accent}` } : undefined}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 rounded-full transition-transform group-hover:scale-125"
                  style={{ background: d.accent, boxShadow: `0 0 8px ${d.accent}88` }}
                />
                <span>
                  <span className="block text-sm font-bold text-moss-100">{d.label}</span>
                  <span className="block font-display text-[7px] tracking-widest" style={{ color: d.accent }}>
                    {d.tag}
                  </span>
                </span>
              </span>
              <span className="text-right">
                <span className="block text-[10px] font-semibold tracking-wider text-moss-400">BEST</span>
                <span className="block font-display text-[10px] text-moss-200">{bests[k]}</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-moss-500">
        {DIFFICULTIES[value].blurb}
      </p>
    </PanelShell>
  );
}

const CONTROLS: Array<{ keys: string[]; action: string }> = [
  { keys: ["↑", "↓", "←", "→"], action: "Steer the serpent" },
  { keys: ["W", "A", "S", "D"], action: "Steer (alternate)" },
  { keys: ["SPACE"], action: "Pause / resume" },
  { keys: ["ENTER"], action: "Start / restart" },
  { keys: ["M"], action: "Sound on / off" },
];

export function ControlsPanel() {
  return (
    <PanelShell title="CONTROLS" accent="#4fd8b8">
      <ul className="flex flex-col gap-2.5">
        {CONTROLS.map((c) => (
          <li key={c.action} className="flex items-center justify-between gap-3">
            <span className="flex shrink-0 items-center gap-1">
              {c.keys.map((k) => (
                <kbd key={k} className="key">
                  {k}
                </kbd>
              ))}
            </span>
            <span className="text-right text-[11px] text-moss-300">{c.action}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-pit-700 pt-2.5 text-[11px] leading-relaxed text-moss-500">
        On touch screens: swipe the board or use the pad under it.
      </p>
    </PanelShell>
  );
}

export function FieldNotes() {
  return (
    <PanelShell title="FIELD NOTES" accent="#ff6259">
      <ul className="flex flex-col gap-2 text-[11px] leading-relaxed text-moss-300">
        <li className="flex gap-2">
          <span className="text-fruit-400">◆</span> Every fruit is +10 and a touch more pace.
        </li>
        <li className="flex gap-2">
          <span className="text-blood-400">◆</span> Walls bite back. So does your own tail.
        </li>
        <li className="flex gap-2">
          <span className="text-signal-400">◆</span> Queue two turns fast to whip around tight corners.
        </li>
      </ul>
    </PanelShell>
  );
}
